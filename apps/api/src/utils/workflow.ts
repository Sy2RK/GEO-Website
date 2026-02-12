import { hasRole } from "../lib/auth";

export function canAccessRole(userRole: "viewer" | "editor" | "admin", requiredRole: "viewer" | "editor" | "admin") {
  return hasRole(userRole, requiredRole);
}

export function nextDraftRevision(currentRevision?: number | null): number {
  return (currentRevision ?? 0) + 1;
}

export function nextPublishedRevision(currentRevision?: number | null): number {
  return (currentRevision ?? 0) + 1;
}

export function buildSlugRedirects(params: {
  oldSlugByLocale: Record<string, string>;
  newSlugByLocale: Record<string, string>;
  pathBuilder: (locale: string, slug: string) => string;
}): Array<{ locale: string; fromPath: string; toPath: string }> {
  const locales = new Set<string>([
    ...Object.keys(params.oldSlugByLocale),
    ...Object.keys(params.newSlugByLocale)
  ]);

  const redirects: Array<{ locale: string; fromPath: string; toPath: string }> = [];

  for (const locale of locales) {
    const oldSlug = params.oldSlugByLocale[locale];
    const newSlug = params.newSlugByLocale[locale];

    if (!oldSlug || !newSlug || oldSlug === newSlug) {
      continue;
    }

    redirects.push({
      locale,
      fromPath: params.pathBuilder(locale, oldSlug),
      toPath: params.pathBuilder(locale, newSlug)
    });
  }

  return redirects;
}
