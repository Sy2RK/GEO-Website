import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireRole } from "../lib/auth";
import { prisma } from "../lib/prisma";
import {
  batchUpsert,
  createProduct,
  deleteMedia,
  patchProduct,
  publishCollectionDraft,
  publishHomepageDraft,
  publishLeaderboardDraft,
  publishProductDraft,
  upsertCollectionDraft,
  upsertHomepageDraft,
  upsertLeaderboardDraft,
  upsertMedia,
  upsertProductDraft,
  updateMedia,
  validateBatchInput
} from "../services/admin-service";
import { getCollectionDoc, getHomepageDoc, getLeaderboardDoc, getProductDoc } from "../services/core-service";
import { formSchemas } from "../schemas/form-schemas";

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/api/admin/products", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const query = z
      .object({
        search: z.string().optional(),
        type: z.string().optional(),
        status: z.enum(["active", "archived"]).optional(),
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().min(1).max(100).default(20)
      })
      .safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ message: "invalid_query", issues: query.error.issues });
    }

    const products = await prisma.product.findMany({
      where: {
        ...(query.data.type ? { typeTaxonomy: { has: query.data.type } } : {}),
        ...(query.data.status ? { status: query.data.status } : {})
      },
      orderBy: { updatedAt: "desc" }
    });

    const normalizedSearch = query.data.search?.toLowerCase().trim();
    const filtered = normalizedSearch
      ? products.filter((item) =>
          `${item.canonicalId} ${(item.brand ?? "")} ${(item.developer ?? "")}`
            .toLowerCase()
            .includes(normalizedSearch)
        )
      : products;

    const start = (query.data.page - 1) * query.data.pageSize;

    return {
      total: filtered.length,
      page: query.data.page,
      pageSize: query.data.pageSize,
      items: filtered.slice(start, start + query.data.pageSize)
    };
  });

  fastify.post("/api/admin/products", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const body = z.record(z.any()).safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "invalid_body" });
    }

    try {
      const result = await createProduct({ payload: body.data, actorId: user.id });
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "create_failed" });
    }
  });

  fastify.patch("/api/admin/products", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const body = z
      .object({
        canonicalId: z.string(),
        patch: z.record(z.any())
      })
      .safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ message: "invalid_body", issues: body.error.issues });
    }

    try {
      const result = await patchProduct({
        canonicalId: body.data.canonicalId,
        patch: body.data.patch,
        actorId: user.id
      });
      return result;
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "patch_failed" });
    }
  });

  fastify.get("/api/admin/products/:canonicalId/docs/:locale/draft", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const params = request.params as { canonicalId: string; locale: string };
    const product = await prisma.product.findUnique({ where: { canonicalId: params.canonicalId } });
    if (!product) {
      return reply.code(404).send({ message: "product_not_found" });
    }

    const draft = await getProductDoc({
      productId: product.id,
      locale: params.locale,
      state: "draft"
    });

    const published = await getProductDoc({
      productId: product.id,
      locale: params.locale,
      state: "published"
    });

    return {
      product,
      draft,
      published
    };
  });

  async function handleProductDraftUpsert(request: any, reply: any) {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const params = request.params as { canonicalId: string; locale: string };
    const body = z
      .object({
        content: z.record(z.any()),
        lockedFields: z.record(z.any()).optional()
      })
      .safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ message: "invalid_body", issues: body.error.issues });
    }

    try {
      const result = await upsertProductDraft({
        canonicalId: params.canonicalId,
        locale: params.locale,
        content: body.data.content,
        lockedFields: body.data.lockedFields,
        role: user.role,
        actorId: user.id
      });
      return result;
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "draft_upsert_failed" });
    }
  }

  fastify.post("/api/admin/products/:canonicalId/docs/:locale/draft", handleProductDraftUpsert);
  fastify.patch("/api/admin/products/:canonicalId/docs/:locale/draft", handleProductDraftUpsert);

  fastify.post("/api/admin/products/:canonicalId/docs/:locale/publish", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const params = request.params as { canonicalId: string; locale: string };

    try {
      const result = await publishProductDraft({
        canonicalId: params.canonicalId,
        locale: params.locale,
        actorId: user.id
      });
      return result;
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "publish_failed" });
    }
  });

  fastify.get("/api/admin/homepage/:locale", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const locale = (request.params as { locale: string }).locale;
    const [draft, published] = await Promise.all([
      getHomepageDoc({ locale, state: "draft" }),
      getHomepageDoc({ locale, state: "published" })
    ]);

    return {
      draft,
      published
    };
  });

  fastify.get("/api/admin/collections", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const query = z
      .object({
        locale: z.string().default("zh-CN"),
        state: z.enum(["draft", "published"]).default("published")
      })
      .safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ message: "invalid_query", issues: query.error.issues });
    }

    const items = await prisma.collectionDoc.findMany({
      where: {
        locale: query.data.locale,
        state: query.data.state
      },
      orderBy: { updatedAt: "desc" }
    });

    return {
      items
    };
  });

  fastify.get("/api/admin/leaderboards", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const query = z
      .object({
        locale: z.string().default("zh-CN"),
        state: z.enum(["draft", "published"]).default("published")
      })
      .safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ message: "invalid_query", issues: query.error.issues });
    }

    const items = await prisma.leaderboardDoc.findMany({
      where: {
        locale: query.data.locale,
        state: query.data.state
      },
      orderBy: { updatedAt: "desc" }
    });

    return {
      items
    };
  });

  fastify.post("/api/admin/homepage/:locale/draft", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const locale = (request.params as { locale: string }).locale;
    const body = z.object({ content: z.record(z.any()) }).safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "invalid_body", issues: body.error.issues });
    }

    try {
      return await upsertHomepageDraft({ locale, content: body.data.content, actorId: user.id });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "draft_upsert_failed" });
    }
  });

  fastify.post("/api/admin/homepage/:locale/publish", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const locale = (request.params as { locale: string }).locale;
    try {
      return await publishHomepageDraft({ locale, actorId: user.id });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "publish_failed" });
    }
  });

  fastify.get("/api/admin/leaderboards/:boardId/:locale", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const { boardId, locale } = request.params as { boardId: string; locale: string };
    const [draft, published] = await Promise.all([
      getLeaderboardDoc({ boardId, locale, state: "draft" }),
      getLeaderboardDoc({ boardId, locale, state: "published" })
    ]);

    return {
      draft,
      published
    };
  });

  fastify.post("/api/admin/leaderboards/:boardId/:locale/draft", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const { boardId, locale } = request.params as { boardId: string; locale: string };
    const body = z
      .object({
        mode: z.string().default("manual"),
        content: z.record(z.any())
      })
      .safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "invalid_body", issues: body.error.issues });
    }

    try {
      return await upsertLeaderboardDraft({
        boardId,
        locale,
        mode: body.data.mode,
        content: body.data.content,
        actorId: user.id
      });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "draft_upsert_failed" });
    }
  });

  fastify.post("/api/admin/leaderboards/:boardId/:locale/publish", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const { boardId, locale } = request.params as { boardId: string; locale: string };
    try {
      return await publishLeaderboardDraft({ boardId, locale, actorId: user.id });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "publish_failed" });
    }
  });

  fastify.get("/api/admin/collections/:collectionId/:locale", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const { collectionId, locale } = request.params as { collectionId: string; locale: string };
    const [draft, published] = await Promise.all([
      getCollectionDoc({ collectionId, locale, state: "draft" }),
      getCollectionDoc({ collectionId, locale, state: "published" })
    ]);

    return {
      draft,
      published
    };
  });

  fastify.post("/api/admin/collections/:collectionId/:locale/draft", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const { collectionId, locale } = request.params as { collectionId: string; locale: string };
    const body = z
      .object({
        slugByLocale: z.record(z.string()),
        content: z.record(z.any())
      })
      .safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ message: "invalid_body", issues: body.error.issues });
    }

    try {
      return await upsertCollectionDraft({
        collectionId,
        locale,
        slugByLocale: body.data.slugByLocale,
        content: body.data.content,
        actorId: user.id
      });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "draft_upsert_failed" });
    }
  });

  fastify.post("/api/admin/collections/:collectionId/:locale/publish", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const { collectionId, locale } = request.params as { collectionId: string; locale: string };
    try {
      return await publishCollectionDraft({ collectionId, locale, actorId: user.id });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "publish_failed" });
    }
  });

  fastify.post("/api/admin/media", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const body = z
      .object({
        ownerType: z.enum(["product", "collection", "leaderboard", "homepage"]),
        ownerId: z.string(),
        locale: z.string().optional(),
        type: z.enum(["image", "video", "presskit", "icon", "cover"]),
        url: z.string().url(),
        meta: z.record(z.any()).optional()
      })
      .safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ message: "invalid_body", issues: body.error.issues });
    }

    try {
      return await upsertMedia({
        ownerType: body.data.ownerType,
        ownerId: body.data.ownerId,
        locale: body.data.locale,
        type: body.data.type,
        url: body.data.url,
        meta: body.data.meta,
        actorId: user.id
      });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "media_create_failed" });
    }
  });

  fastify.patch("/api/admin/media/:id", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const id = (request.params as { id: string }).id;
    const body = z
      .object({
        locale: z.string().nullable().optional(),
        type: z.enum(["image", "video", "presskit", "icon", "cover"]).optional(),
        url: z.string().url().optional(),
        meta: z.record(z.any()).optional()
      })
      .safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ message: "invalid_body", issues: body.error.issues });
    }

    try {
      return await updateMedia({
        id,
        patch: body.data,
        actorId: user.id
      });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "media_update_failed" });
    }
  });

  fastify.delete("/api/admin/media/:id", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const id = (request.params as { id: string }).id;
    try {
      return await deleteMedia({
        id,
        actorId: user.id
      });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "media_delete_failed" });
    }
  });

  fastify.get("/api/admin/audit-logs", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const query = z
      .object({
        limit: z.coerce.number().min(1).max(200).default(50)
      })
      .safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ message: "invalid_query", issues: query.error.issues });
    }

    const items = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: query.data.limit
    });

    return {
      items
    };
  });

  fastify.post("/api/admin/batch/validate", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const body = z
      .object({
        entityType: z.string(),
        locale: z.string().optional(),
        items: z.array(z.record(z.any()))
      })
      .safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ message: "invalid_body", issues: body.error.issues });
    }

    return validateBatchInput({
      entityType: body.data.entityType,
      locale: body.data.locale,
      items: body.data.items
    });
  });

  fastify.post("/api/admin/batch/upsert", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const body = z
      .object({
        entityType: z.string(),
        locale: z.string().optional(),
        items: z.array(z.record(z.any()))
      })
      .safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ message: "invalid_body", issues: body.error.issues });
    }

    try {
      return await batchUpsert({
        entityType: body.data.entityType,
        locale: body.data.locale,
        items: body.data.items,
        role: user.role,
        actorId: user.id
      });
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "batch_upsert_failed" });
    }
  });

  fastify.get("/api/admin/schema/:entityType", async (request, reply) => {
    const user = await requireRole(request, reply, "editor");
    if (!user) {
      return;
    }

    const entityType = (request.params as { entityType: string }).entityType;
    const schema = formSchemas[entityType];
    if (!schema) {
      return reply.code(404).send({ message: "schema_not_found" });
    }

    return schema;
  });
};
