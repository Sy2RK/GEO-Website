import { localeToPath, supportedLocales } from "@guru/shared";
import { config } from "../config";
import { prisma } from "../lib/prisma";
import { getLocaleValue } from "./core-service";

export type SitemapKind = "products" | "collections" | "leaderboards" | "homepage";

export async function getSitemapEntries(locale: string, kind: SitemapKind) {
  const lastmod = new Date().toISOString();

  if (kind === "homepage") {
    return [
      {
        loc: `${config.webBaseUrl}/${localeToPath(locale)}`,
        lastmod
      }
    ];
  }

  if (kind === "products") {
    const products = await prisma.product.findMany({ where: { status: "active" } });
    return products
      .map((product) => {
        const slug = getLocaleValue(product.slugByLocale, locale);
        if (!slug) {
          return null;
        }
        return {
          loc: `${config.webBaseUrl}/${localeToPath(locale)}/products/${slug}`,
          lastmod: product.updatedAt.toISOString()
        };
      })
      .filter(Boolean) as Array<{ loc: string; lastmod: string }>;
  }

  if (kind === "collections") {
    const docs = await prisma.collectionDoc.findMany({
      where: {
        locale,
        state: "published"
      }
    });

    return docs.map((doc) => ({
      loc: `${config.webBaseUrl}/${localeToPath(locale)}/collections/${getLocaleValue(doc.slugByLocale, locale)}`,
      lastmod: doc.updatedAt.toISOString()
    }));
  }

  const boards = await prisma.leaderboardDoc.findMany({
    where: {
      locale,
      state: "published"
    }
  });

  return boards.map((board) => ({
    loc: `${config.webBaseUrl}/${localeToPath(locale)}/leaderboards/${board.boardId}`,
    lastmod: board.updatedAt.toISOString()
  }));
}

export function getSitemapIndexEntries() {
  const now = new Date().toISOString();
  const entries: Array<{ loc: string; lastmod: string }> = [];

  for (const locale of supportedLocales) {
    const prefix = localeToPath(locale);
    for (const kind of ["products", "collections", "leaderboards", "homepage"]) {
      entries.push({
        loc: `${config.apiBaseUrl}/api/sitemap/${prefix}-${kind}.xml`,
        lastmod: now
      });
    }
  }

  return entries;
}
