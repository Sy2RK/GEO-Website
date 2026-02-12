import { z } from "zod";

export const supportedLocales = ["zh-CN", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const localePathMap: Record<SupportedLocale, string> = {
  "zh-CN": "zh",
  en: "en"
};

export const pathLocaleMap = {
  zh: "zh-CN",
  en: "en"
} as const;

export const userRoleSchema = z.enum(["viewer", "editor", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const platformSchema = z.enum(["ios", "android", "web", "pc", "mac"]);
export type Platform = z.infer<typeof platformSchema>;

export const productDocContentSchema = z.object({
  identity: z
    .object({
      name: z.string(),
      alias: z.array(z.string()).optional(),
      tagline: z.string().optional()
    })
    .passthrough(),
  canonicalSummary: z.string(),
  definition: z.string(),
  coreMechanics: z.array(z.string()).default([]),
  valueProposition: z.array(z.string()).default([]),
  geo: z
    .object({
      keywords: z.array(z.string()).default([]),
      searchIntents: z.array(z.string()).default([]),
      usageContexts: z.array(z.string()).default([])
    })
    .passthrough(),
  assets: z.record(z.any()).optional(),
  editing: z
    .object({
      notes: z.string().optional(),
      suggestions: z.array(z.string()).default([])
    })
    .optional()
}).passthrough();

export type ProductDocContent = z.infer<typeof productDocContentSchema>;

export const collectionContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  geo: z
    .object({
      keywords: z.array(z.string()).default([]),
      searchIntents: z.array(z.string()).default([])
    })
    .passthrough(),
  includedProducts: z.array(z.string()).default([])
}).passthrough();

export type CollectionContent = z.infer<typeof collectionContentSchema>;

export const leaderboardItemSchema = z.object({
  canonicalId: z.string(),
  rank: z.number(),
  score: z.number().optional(),
  badges: z.array(z.string()).optional(),
  reason: z.string().optional()
});

export const leaderboardContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  items: z.array(leaderboardItemSchema)
}).passthrough();

export type LeaderboardContent = z.infer<typeof leaderboardContentSchema>;

export const homepageContentSchema = z.object({
  featured: z
    .array(
      z.object({
        canonicalId: z.string(),
        badge: z.string().optional(),
        reason: z.string().optional(),
        priority: z.number().default(0),
        startAt: z.string().optional(),
        endAt: z.string().optional()
      })
    )
    .default([]),
  leaderboardRefs: z
    .array(
      z.object({
        boardId: z.string(),
        placement: z.string().default("main"),
        maxItems: z.number().default(10)
      })
    )
    .default([]),
  collectionRefs: z
    .array(
      z.object({
        collectionId: z.string(),
        placement: z.string().default("main"),
        maxItems: z.number().default(8)
      })
    )
    .default([])
}).passthrough();

export type HomepageContent = z.infer<typeof homepageContentSchema>;

export const batchEntitySchema = z.enum([
  "product",
  "productDoc",
  "homepage",
  "leaderboard",
  "collection",
  "media"
]);

export type BatchEntityType = z.infer<typeof batchEntitySchema>;

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.any())
});

export type SkillDefinition = z.infer<typeof skillSchema>;

export const boardIds = ["games_top", "ai_top", "overall_top", "new_and_noteworthy"] as const;
export type BoardId = (typeof boardIds)[number];

export function localeToPath(locale: string): string {
  return localePathMap[locale as SupportedLocale] ?? "zh";
}

export function pathToLocale(pathLocale: string): SupportedLocale {
  return (pathLocaleMap as Record<string, SupportedLocale>)[pathLocale] ?? "zh-CN";
}

export function canEdit(role?: UserRole | null): boolean {
  return role === "editor" || role === "admin";
}

export function isAdmin(role?: UserRole | null): boolean {
  return role === "admin";
}
