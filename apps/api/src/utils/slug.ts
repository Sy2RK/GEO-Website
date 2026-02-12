import { localeToPath } from "@guru/shared";

export function productPath(locale: string, slug: string): string {
  return `/${localeToPath(locale)}/products/${slug}`;
}

export function collectionPath(locale: string, slug: string): string {
  return `/${localeToPath(locale)}/collections/${slug}`;
}

export function leaderboardPath(locale: string, boardId: string): string {
  return `/${localeToPath(locale)}/leaderboards/${boardId}`;
}

export function homepagePath(locale: string): string {
  return `/${localeToPath(locale)}`;
}
