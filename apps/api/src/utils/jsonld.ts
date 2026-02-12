import type { Product, ProductDoc } from "@prisma/client";

type ProductDocContent = {
  identity?: {
    name?: string;
    alias?: string[];
  };
  canonicalSummary?: string;
  definition?: string;
  geo?: {
    keywords?: string[];
  };
};

export function buildProductJsonLd(params: {
  product: Product;
  doc: ProductDoc;
  canonicalUrl: string;
  locale: string;
}): Record<string, unknown> {
  const { product, doc, canonicalUrl, locale } = params;
  const content = (doc.content ?? {}) as ProductDocContent;
  const isGame = product.typeTaxonomy.includes("game");

  return {
    "@context": "https://schema.org",
    "@type": isGame ? "VideoGame" : "SoftwareApplication",
    "@id": canonicalUrl,
    url: canonicalUrl,
    inLanguage: locale,
    name: content.identity?.name ?? product.canonicalId,
    description: content.canonicalSummary ?? content.definition ?? "",
    keywords: content.geo?.keywords ?? [],
    applicationCategory: isGame ? "Game" : "AI Tool",
    operatingSystem: product.platforms.join(",")
  };
}

export function buildCollectionJsonLd(params: {
  canonicalUrl: string;
  locale: string;
  title: string;
  description: string;
  itemUrls: string[];
}): Record<string, unknown> {
  const { canonicalUrl, locale, title, description, itemUrls } = params;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonicalUrl,
    url: canonicalUrl,
    inLanguage: locale,
    name: title,
    description,
    hasPart: itemUrls.map((url) => ({ "@type": "ListItem", item: url }))
  };
}

export function buildLeaderboardJsonLd(params: {
  canonicalUrl: string;
  locale: string;
  title: string;
  description: string;
  items: Array<{ rank: number; name: string; url: string }>;
}): Record<string, unknown> {
  const { canonicalUrl, locale, title, description, items } = params;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": canonicalUrl,
    url: canonicalUrl,
    inLanguage: locale,
    name: title,
    description,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.rank,
      name: item.name,
      url: item.url
    }))
  };
}
