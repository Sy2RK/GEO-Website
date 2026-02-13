import type {
  CollectionDoc,
  HomepageConfig,
  LeaderboardDoc,
  MediaAsset,
  Prisma,
  Product,
  ProductDoc,
  UserRole
} from "@prisma/client";
import { canEdit, localeToPath, supportedLocales } from "@guru/shared";
import { config } from "../config";
import { prisma } from "../lib/prisma";
import { buildCollectionJsonLd, buildLeaderboardJsonLd, buildProductJsonLd } from "../utils/jsonld";
import { collectionPath, homepagePath, leaderboardPath, productPath } from "../utils/slug";

export function getLocaleValue(jsonValue: Prisma.JsonValue, locale: string): string {
  const map = (jsonValue ?? {}) as Record<string, string>;
  return map[locale] ?? map.en ?? Object.values(map)[0] ?? "";
}

export function getAlternatesForProduct(product: Product): Record<string, string> {
  const slugMap = product.slugByLocale as Record<string, string>;
  const result: Record<string, string> = {};

  for (const locale of supportedLocales) {
    const slug = slugMap[locale] ?? slugMap.en;
    if (!slug) {
      continue;
    }
    result[locale] = `${config.webBaseUrl}${productPath(locale, slug)}`;
  }

  return result;
}

export async function findProductBySlug(locale: string, slug: string): Promise<Product | null> {
  const candidates = await prisma.product.findMany({ where: { status: "active" } });
  const normalize = (value: string): string => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  const targetSlug = normalize(slug).trim();

  return candidates.find((product) => {
    const resolvedSlug = getLocaleValue(product.slugByLocale as Prisma.JsonValue, locale);
    const slugMap = product.slugByLocale as Record<string, string>;
    const slugCandidates = new Set<string>([
      resolvedSlug,
      ...Object.values(slugMap)
    ]);
    for (const candidate of slugCandidates) {
      if (!candidate) {
        continue;
      }
      if (normalize(candidate).trim() === targetSlug) {
        return true;
      }
    }
    return false;
  }) ?? null;
}

export async function getProductDoc(params: {
  productId: string;
  locale: string;
  state: "draft" | "published";
}): Promise<ProductDoc | null> {
  return prisma.productDoc.findUnique({
    where: {
      productId_locale_state: {
        productId: params.productId,
        locale: params.locale,
        state: params.state
      }
    }
  });
}

export async function getCollectionDoc(params: {
  collectionId: string;
  locale: string;
  state: "draft" | "published";
}): Promise<CollectionDoc | null> {
  return prisma.collectionDoc.findUnique({
    where: {
      collectionId_locale_state: {
        collectionId: params.collectionId,
        locale: params.locale,
        state: params.state
      }
    }
  });
}

export async function getLeaderboardDoc(params: {
  boardId: string;
  locale: string;
  state: "draft" | "published";
}): Promise<LeaderboardDoc | null> {
  return prisma.leaderboardDoc.findUnique({
    where: {
      boardId_locale_state: {
        boardId: params.boardId,
        locale: params.locale,
        state: params.state
      }
    }
  });
}

export async function getHomepageDoc(params: {
  locale: string;
  state: "draft" | "published";
}): Promise<HomepageConfig | null> {
  return prisma.homepageConfig.findUnique({
    where: {
      locale_state: {
        locale: params.locale,
        state: params.state
      }
    }
  });
}

export function shouldUseDraft(params: {
  requestedState?: string;
  role?: UserRole | null;
}): boolean {
  return params.requestedState === "draft" && canEdit(params.role ?? null);
}

function getMediaSortOrder(item: MediaAsset): number {
  return Number(((item.meta as Record<string, unknown> | undefined)?.sortOrder as number | undefined) ?? 0);
}

function sortMediaForStableDisplay(items: MediaAsset[]): MediaAsset[] {
  return items.slice().sort((a, b) => {
    const orderDelta = getMediaSortOrder(a) - getMediaSortOrder(b);
    if (orderDelta !== 0) {
      return orderDelta;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

function pickCoverAssetForLocale(items: MediaAsset[], locale: string): MediaAsset | null {
  const sorted = sortMediaForStableDisplay(items);
  const localeMatched = sorted.filter((item) => item.locale === locale);
  const global = sorted.filter((item) => item.locale === null);
  const otherLocale = sorted.filter((item) => item.locale !== locale && item.locale !== null);

  const pickCoverOrImage = (list: MediaAsset[]): MediaAsset | null =>
    list.find((item) => item.type === "cover") ?? list.find((item) => item.type === "image") ?? null;

  return pickCoverOrImage(localeMatched) ?? pickCoverOrImage(global) ?? pickCoverOrImage(otherLocale);
}

export async function expandProductCard(canonicalId: string, locale: string) {
  const product = await prisma.product.findUnique({ where: { canonicalId } });
  if (!product) {
    return null;
  }

  const doc = await prisma.productDoc.findUnique({
    where: {
      productId_locale_state: {
        productId: product.id,
        locale,
        state: "published"
      }
    }
  });

  if (!doc) {
    return null;
  }

  const content = doc.content as Record<string, unknown>;
  const slug = getLocaleValue(product.slugByLocale, locale);
  const media = await prisma.mediaAsset.findMany({
    where: {
      ownerType: "product",
      ownerId: canonicalId
    }
  });
  const coverAsset = pickCoverAssetForLocale(media, locale);

  return {
    canonicalId,
    slug,
    name: (content.identity as { name?: string } | undefined)?.name ?? canonicalId,
    summary: (content.canonicalSummary as string | undefined) ?? "",
    definition: (content.definition as string | undefined) ?? "",
    typeTaxonomy: product.typeTaxonomy,
    platforms: product.platforms,
    keywords: ((content.geo as { keywords?: string[] } | undefined)?.keywords ?? []).slice(0, 6),
    coverUrl: coverAsset?.url ?? null,
    coverAlt: ((coverAsset?.meta as Record<string, unknown> | undefined)?.altText as string | undefined) ?? null,
    url: `${config.webBaseUrl}${productPath(locale, slug)}`
  };
}

export async function buildProductDetailResponse(params: {
  product: Product;
  doc: ProductDoc;
  locale: string;
  role?: UserRole | null;
}) {
  const { product, doc, locale, role } = params;
  const slugMap = product.slugByLocale as Record<string, string>;
  const slug = slugMap[locale] ?? slugMap.en;
  const canonicalUrl = `${config.webBaseUrl}${productPath(locale, slug)}`;
  const alternateUrls = getAlternatesForProduct(product);

  const jsonld = buildProductJsonLd({ product, doc, canonicalUrl, locale });

  const allMedia = await prisma.mediaAsset.findMany({
    where: {
      ownerType: "product",
      ownerId: product.canonicalId
    }
  });
  const localeMedia = allMedia.filter((item) => item.locale === locale || item.locale === null);
  const fallbackCover = pickCoverAssetForLocale(allMedia, locale);
  const media = sortMediaForStableDisplay(
    fallbackCover && !localeMedia.some((item) => item.id === fallbackCover.id)
      ? [fallbackCover, ...localeMedia]
      : localeMedia
  );

  return {
    product,
    doc,
    jsonld,
    canonicalUrl,
    alternateUrls,
    breadcrumbs: [
      {
        title: locale === "zh-CN" ? "首页" : "Home",
        url: `${config.webBaseUrl}${homepagePath(locale)}`
      },
      {
        title: locale === "zh-CN" ? "产品" : "Products",
        url: `${config.webBaseUrl}${homepagePath(locale)}#products`
      },
      {
        title: ((doc.content as Record<string, unknown>).identity as { name?: string } | undefined)?.name ??
          product.canonicalId,
        url: canonicalUrl
      }
    ],
    canEdit: canEdit(role ?? null),
    editUrl: canEdit(role ?? null) ? `/admin/products/${product.canonicalId}?locale=${encodeURIComponent(locale)}` : null,
    media
  };
}

export async function buildCollectionResponse(params: {
  doc: CollectionDoc;
  locale: string;
  role?: UserRole | null;
}) {
  const { doc, locale, role } = params;
  const slug = getLocaleValue(doc.slugByLocale, locale);
  const canonicalUrl = `${config.webBaseUrl}${collectionPath(locale, slug)}`;
  const content = doc.content as Record<string, unknown>;
  const includedProducts = ((content.includedProducts as string[] | undefined) ?? []).slice(0, 200);

  const cards = (
    await Promise.all(includedProducts.map((id) => expandProductCard(id, locale)))
  ).filter(Boolean);

  const jsonld = buildCollectionJsonLd({
    canonicalUrl,
    locale,
    title: (content.title as string) ?? doc.collectionId,
    description: (content.description as string) ?? "",
    itemUrls: cards.map((item) => item!.url)
  });

  const media = await prisma.mediaAsset.findMany({
    where: {
      ownerType: "collection",
      ownerId: doc.collectionId,
      OR: [{ locale }, { locale: null }]
    }
  });
  media.sort(
    (a, b) =>
      Number(((a.meta as Record<string, unknown> | undefined)?.sortOrder as number | undefined) ?? 0) -
      Number(((b.meta as Record<string, unknown> | undefined)?.sortOrder as number | undefined) ?? 0)
  );

  return {
    collectionId: doc.collectionId,
    slug,
    doc,
    products: cards,
    canonicalUrl,
    alternateUrls: {
      "zh-CN": `${config.webBaseUrl}${collectionPath("zh-CN", getLocaleValue(doc.slugByLocale, "zh-CN"))}`,
      en: `${config.webBaseUrl}${collectionPath("en", getLocaleValue(doc.slugByLocale, "en"))}`
    },
    jsonld,
    canEdit: canEdit(role ?? null),
    editUrl: canEdit(role ?? null) ? `/admin/collections/${doc.collectionId}/${locale}` : null,
    media
  };
}

export async function buildLeaderboardResponse(params: {
  doc: LeaderboardDoc;
  locale: string;
  role?: UserRole | null;
}) {
  const { doc, locale, role } = params;
  const content = doc.content as Record<string, unknown>;
  const items = ((content.items as Array<Record<string, unknown>> | undefined) ?? []).slice(0, 100);

  const expanded = (
    await Promise.all(
      items.map(async (item) => {
        const canonicalId = String(item.canonicalId ?? "");
        const card = await expandProductCard(canonicalId, locale);
        if (!card) {
          return null;
        }
        return {
          ...item,
          ...card
        };
      })
    )
  ).filter(Boolean) as Array<Record<string, unknown>>;

  const canonicalUrl = `${config.webBaseUrl}${leaderboardPath(locale, doc.boardId)}`;
  const jsonld = buildLeaderboardJsonLd({
    canonicalUrl,
    locale,
    title: (content.title as string) ?? doc.boardId,
    description: (content.description as string) ?? "",
    items: expanded.map((item, index) => ({
      rank: Number(item.rank ?? index + 1),
      name: String(item.name ?? item.canonicalId),
      url: String(item.url ?? "")
    }))
  });

  const media = await prisma.mediaAsset.findMany({
    where: {
      ownerType: "leaderboard",
      ownerId: doc.boardId,
      OR: [{ locale }, { locale: null }]
    }
  });
  media.sort(
    (a, b) =>
      Number(((a.meta as Record<string, unknown> | undefined)?.sortOrder as number | undefined) ?? 0) -
      Number(((b.meta as Record<string, unknown> | undefined)?.sortOrder as number | undefined) ?? 0)
  );

  return {
    boardId: doc.boardId,
    doc,
    items: expanded,
    canonicalUrl,
    alternateUrls: {
      "zh-CN": `${config.webBaseUrl}${leaderboardPath("zh-CN", doc.boardId)}`,
      en: `${config.webBaseUrl}${leaderboardPath("en", doc.boardId)}`
    },
    jsonld,
    canEdit: canEdit(role ?? null),
    editUrl: canEdit(role ?? null) ? `/admin/leaderboards/${doc.boardId}/${locale}` : null,
    media
  };
}
