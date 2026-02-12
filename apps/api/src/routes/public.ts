import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { canEdit, pathToLocale, supportedLocales } from "@guru/shared";
import { config } from "../config";
import { getOptionalUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import {
  buildCollectionResponse,
  buildLeaderboardResponse,
  buildProductDetailResponse,
  expandProductCard,
  findProductBySlug,
  getCollectionDoc,
  getHomepageDoc,
  getLeaderboardDoc,
  getProductDoc,
  getLocaleValue,
  shouldUseDraft
} from "../services/core-service";
import { getSitemapEntries, getSitemapIndexEntries } from "../services/sitemap-service";
import { buildSitemapIndexXml, buildSitemapXml } from "../utils/sitemap";
import { listSkills, runSkill } from "../services/skill-service";

const listProductsQuerySchema = z.object({
  locale: z.string().default("zh-CN"),
  type: z.string().optional(),
  platform: z.string().optional(),
  search: z.string().optional(),
  collectionId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12)
});

const localeSchema = z.object({
  locale: z.string().default("zh-CN")
});

const stateLocaleSchema = z.object({
  locale: z.string().default("zh-CN"),
  state: z.enum(["draft", "published"]).optional()
});

export const publicRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/api/site/config", async () => {
    return {
      locales: supportedLocales,
      defaultLocale: "zh-CN"
    };
  });

  fastify.get("/api/homepage", async (request, reply) => {
    const parsed = stateLocaleSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ message: "invalid_query", issues: parsed.error.issues });
    }

    const user = await getOptionalUser(request);
    const useDraft = shouldUseDraft({ requestedState: parsed.data.state, role: user?.role ?? null });

    const doc = await getHomepageDoc({
      locale: parsed.data.locale,
      state: useDraft ? "draft" : "published"
    });

    if (!doc) {
      return reply.code(404).send({ message: "homepage_not_found" });
    }

    const content = doc.content as {
      featured?: Array<{
        canonicalId: string;
        badge?: string;
        reason?: string;
        priority?: number;
        startAt?: string;
        endAt?: string;
      }>;
      leaderboardRefs?: Array<{ boardId: string; placement: string; maxItems: number }>;
      collectionRefs?: Array<{ collectionId: string; placement: string; maxItems: number }>;
    };

    const now = Date.now();
    const featuredCards = (
      await Promise.all(
        (content.featured ?? []).map(async (item) => {
          const start = item.startAt ? Date.parse(item.startAt) : null;
          const end = item.endAt ? Date.parse(item.endAt) : null;
          if ((start && now < start) || (end && now > end)) {
            return null;
          }
          const card = await expandProductCard(item.canonicalId, parsed.data.locale);
          if (!card) {
            return null;
          }
          return {
            ...item,
            card
          };
        })
      )
    )
      .filter(Boolean) as Array<{
      canonicalId: string;
      badge?: string;
      reason?: string;
      priority?: number;
      startAt?: string;
      endAt?: string;
      card: unknown;
    }>;
    featuredCards.sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0));

    const leaderboards = (
      await Promise.all(
        (content.leaderboardRefs ?? []).map(async (ref) => {
          const doc = await getLeaderboardDoc({
            boardId: ref.boardId,
            locale: parsed.data.locale,
            state: useDraft ? "draft" : "published"
          });
          if (!doc) {
            return null;
          }
          const board = await buildLeaderboardResponse({
            doc,
            locale: parsed.data.locale,
            role: user?.role
          });
          return {
            placement: ref.placement,
            maxItems: ref.maxItems,
            board
          };
        })
      )
    ).filter(Boolean);

    const collections = (
      await Promise.all(
        (content.collectionRefs ?? []).map(async (ref) => {
          const doc = await getCollectionDoc({
            collectionId: ref.collectionId,
            locale: parsed.data.locale,
            state: useDraft ? "draft" : "published"
          });
          if (!doc) {
            return null;
          }
          const collection = await buildCollectionResponse({
            doc,
            locale: parsed.data.locale,
            role: user?.role
          });
          return {
            placement: ref.placement,
            maxItems: ref.maxItems,
            collection
          };
        })
      )
    ).filter(Boolean);

    const media = await prisma.mediaAsset.findMany({
      where: {
        ownerType: "homepage",
        ownerId: parsed.data.locale,
        OR: [{ locale: parsed.data.locale }, { locale: null }]
      },
      orderBy: { createdAt: "asc" }
    });
    media.sort(
      (a, b) =>
        Number(((a.meta as Record<string, unknown> | undefined)?.sortOrder as number | undefined) ?? 0) -
        Number(((b.meta as Record<string, unknown> | undefined)?.sortOrder as number | undefined) ?? 0)
    );

    return {
      locale: parsed.data.locale,
      state: doc.state,
      revision: doc.revision,
      content: doc.content,
      featured: featuredCards,
      leaderboards,
      collections,
      media,
      canEdit: canEdit(user?.role ?? null),
      editUrl: canEdit(user?.role ?? null) ? `/admin/homepage/${parsed.data.locale}` : null
    };
  });

  fastify.get("/api/products", async (request, reply) => {
    const parsed = listProductsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ message: "invalid_query", issues: parsed.error.issues });
    }

    let candidateIds: string[] | null = null;

    if (parsed.data.collectionId) {
      const collection = await prisma.collectionDoc.findUnique({
        where: {
          collectionId_locale_state: {
            collectionId: parsed.data.collectionId,
            locale: parsed.data.locale,
            state: "published"
          }
        }
      });

      if (collection) {
        const ids = (((collection.content as Record<string, unknown>).includedProducts as string[]) ?? []).slice();
        candidateIds = ids;
      } else {
        candidateIds = [];
      }
    }

    const products = await prisma.product.findMany({
      where: {
        status: "active",
        ...(parsed.data.type ? { typeTaxonomy: { has: parsed.data.type } } : {}),
        ...(parsed.data.platform ? { platforms: { has: parsed.data.platform as any } } : {}),
        ...(candidateIds ? { canonicalId: { in: candidateIds } } : {})
      },
      orderBy: { updatedAt: "desc" }
    });

    const cards = (
      await Promise.all(products.map((product) => expandProductCard(product.canonicalId, parsed.data.locale)))
    ).filter(Boolean) as Array<{
      canonicalId: string;
      slug: string;
      name: string;
      summary: string;
      definition: string;
      typeTaxonomy: string[];
      platforms: string[];
      keywords: string[];
      url: string;
    }>;

    const searchText = parsed.data.search?.trim().toLowerCase();
    const filtered = searchText
      ? cards.filter((card) =>
          [card.name, card.summary, card.definition, ...card.keywords].join(" ").toLowerCase().includes(searchText)
        )
      : cards;

    const start = (parsed.data.page - 1) * parsed.data.pageSize;
    const pageItems = filtered.slice(start, start + parsed.data.pageSize);

    return {
      locale: parsed.data.locale,
      total: filtered.length,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      items: pageItems
    };
  });

  fastify.get("/api/products/slug/:slug", async (request, reply) => {
    const slug = String((request.params as Record<string, string>).slug);
    const parsed = stateLocaleSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ message: "invalid_query", issues: parsed.error.issues });
    }

    const product = await findProductBySlug(parsed.data.locale, slug);
    if (!product) {
      return reply.code(404).send({ message: "product_not_found" });
    }

    const user = await getOptionalUser(request);
    const useDraft = shouldUseDraft({ requestedState: parsed.data.state, role: user?.role ?? null });

    const doc = await getProductDoc({
      productId: product.id,
      locale: parsed.data.locale,
      state: useDraft ? "draft" : "published"
    });

    if (!doc) {
      return reply.code(404).send({ message: "product_doc_not_found" });
    }

    const response = await buildProductDetailResponse({
      product,
      doc,
      locale: parsed.data.locale,
      role: user?.role
    });

    return response;
  });

  fastify.get("/api/products/:canonicalId", async (request, reply) => {
    const canonicalId = String((request.params as Record<string, string>).canonicalId);
    const parsed = stateLocaleSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ message: "invalid_query", issues: parsed.error.issues });
    }

    const product = await prisma.product.findUnique({ where: { canonicalId } });
    if (!product) {
      return reply.code(404).send({ message: "product_not_found" });
    }

    const user = await getOptionalUser(request);
    const useDraft = shouldUseDraft({ requestedState: parsed.data.state, role: user?.role ?? null });

    const doc = await getProductDoc({
      productId: product.id,
      locale: parsed.data.locale,
      state: useDraft ? "draft" : "published"
    });

    if (!doc) {
      return reply.code(404).send({ message: "product_doc_not_found" });
    }

    return buildProductDetailResponse({
      product,
      doc,
      locale: parsed.data.locale,
      role: user?.role
    });
  });

  fastify.get("/api/collections/slug/:slug", async (request, reply) => {
    const slug = String((request.params as Record<string, string>).slug);
    const parsed = stateLocaleSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ message: "invalid_query", issues: parsed.error.issues });
    }

    const all = await prisma.collectionDoc.findMany({
      where: {
        locale: parsed.data.locale,
        state: "published"
      }
    });

    const match = all.find((doc) => getLocaleValue(doc.slugByLocale, parsed.data.locale) === slug);
    if (!match) {
      return reply.code(404).send({ message: "collection_not_found" });
    }

    const user = await getOptionalUser(request);
    const useDraft = shouldUseDraft({ requestedState: parsed.data.state, role: user?.role ?? null });

    const doc = await getCollectionDoc({
      collectionId: match.collectionId,
      locale: parsed.data.locale,
      state: useDraft ? "draft" : "published"
    });

    if (!doc) {
      return reply.code(404).send({ message: "collection_doc_not_found" });
    }

    return buildCollectionResponse({
      doc,
      locale: parsed.data.locale,
      role: user?.role
    });
  });

  fastify.get("/api/collections/:collectionId", async (request, reply) => {
    const collectionId = String((request.params as Record<string, string>).collectionId);
    const parsed = stateLocaleSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ message: "invalid_query", issues: parsed.error.issues });
    }

    const user = await getOptionalUser(request);
    const useDraft = shouldUseDraft({ requestedState: parsed.data.state, role: user?.role ?? null });

    const doc = await getCollectionDoc({
      collectionId,
      locale: parsed.data.locale,
      state: useDraft ? "draft" : "published"
    });

    if (!doc) {
      return reply.code(404).send({ message: "collection_not_found" });
    }

    return buildCollectionResponse({
      doc,
      locale: parsed.data.locale,
      role: user?.role
    });
  });

  fastify.get("/api/leaderboards/:boardId", async (request, reply) => {
    const boardId = String((request.params as Record<string, string>).boardId);
    const parsed = stateLocaleSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ message: "invalid_query", issues: parsed.error.issues });
    }

    const user = await getOptionalUser(request);
    const useDraft = shouldUseDraft({ requestedState: parsed.data.state, role: user?.role ?? null });

    const doc = await getLeaderboardDoc({
      boardId,
      locale: parsed.data.locale,
      state: useDraft ? "draft" : "published"
    });

    if (!doc) {
      return reply.code(404).send({ message: "leaderboard_not_found" });
    }

    return buildLeaderboardResponse({
      doc,
      locale: parsed.data.locale,
      role: user?.role
    });
  });

  fastify.get("/api/media", async (request, reply) => {
    const query = z
      .object({
        ownerType: z.enum(["product", "collection", "leaderboard", "homepage"]),
        ownerId: z.string(),
        locale: z.string().optional()
      })
      .safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ message: "invalid_query", issues: query.error.issues });
    }

    const items = await prisma.mediaAsset.findMany({
      where: {
        ownerType: query.data.ownerType,
        ownerId: query.data.ownerId,
        ...(query.data.locale
          ? {
              OR: [{ locale: query.data.locale }, { locale: null }]
            }
          : {})
      },
      orderBy: [{ createdAt: "asc" }]
    });

    return {
      items
    };
  });

  fastify.get("/api/redirects/resolve", async (request, reply) => {
    const query = z
      .object({
        path: z.string(),
        locale: z.string().optional()
      })
      .safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ message: "invalid_query", issues: query.error.issues });
    }

    let locale = query.data.locale;
    if (!locale) {
      const seg = query.data.path.split("/").filter(Boolean)[0] ?? "zh";
      locale = pathToLocale(seg);
    }

    const match = await prisma.redirectMap.findUnique({
      where: {
        locale_fromPath: {
          locale,
          fromPath: query.data.path
        }
      }
    });

    if (!match) {
      return {
        found: false
      };
    }

    return {
      found: true,
      statusCode: 301,
      toPath: match.toPath
    };
  });

  fastify.get("/api/sitemap/index.xml", async (_request, reply) => {
    const xml = buildSitemapIndexXml(getSitemapIndexEntries());
    reply.header("content-type", "application/xml");
    return reply.send(xml);
  });

  fastify.get("/api/sitemap/:name.xml", async (request, reply) => {
    const name = String((request.params as Record<string, string>).name);
    const match = name.match(/^(zh|en)-(products|collections|leaderboards|homepage)$/);
    if (!match) {
      return reply.code(404).send({ message: "sitemap_not_found" });
    }

    const locale = pathToLocale(match[1]);
    const kind = match[2] as "products" | "collections" | "leaderboards" | "homepage";
    const entries = await getSitemapEntries(locale, kind);
    const xml = buildSitemapXml(entries);
    reply.header("content-type", "application/xml");
    return reply.send(xml);
  });

  fastify.get("/api/skills/list", async () => {
    return {
      skills: listSkills()
    };
  });

  fastify.post("/api/skills/run", async (request, reply) => {
    const body = z
      .object({
        skillId: z.string(),
        input: z.record(z.any())
      })
      .safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ message: "invalid_body", issues: body.error.issues });
    }

    return runSkill({
      skillId: body.data.skillId,
      payload: body.data.input
    });
  });

  fastify.get("/api/ping", async () => ({
    ok: true,
    time: new Date().toISOString(),
    apiBaseUrl: config.apiBaseUrl
  }));
};
