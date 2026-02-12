export type UiLocale = "zh" | "en";

export function resolveUiLocale(value?: string): UiLocale {
  return value === "en" ? "en" : "zh";
}

export function t(uiLocale: UiLocale, text: { zh: string; en: string }): string {
  return uiLocale === "en" ? text.en : text.zh;
}
