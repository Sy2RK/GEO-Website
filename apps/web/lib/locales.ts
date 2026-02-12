export const supportedPathLocales = ["zh", "en"] as const;
export type PathLocale = (typeof supportedPathLocales)[number];

export function toApiLocale(pathLocale: string): "zh-CN" | "en" {
  return pathLocale === "en" ? "en" : "zh-CN";
}

export function toPathLocale(apiLocale: string): "zh" | "en" {
  return apiLocale === "en" ? "en" : "zh";
}

export function switchLocaleInPath(pathname: string, toLocale: PathLocale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return `/${toLocale}`;
  }

  if (segments[0] === "zh" || segments[0] === "en") {
    segments[0] = toLocale;
  } else {
    segments.unshift(toLocale);
  }

  return `/${segments.join("/")}`;
}
