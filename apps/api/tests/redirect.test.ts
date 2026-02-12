import { describe, expect, it } from "vitest";
import { buildSlugRedirects } from "../src/utils/workflow";

describe("redirect map", () => {
  it("builds redirect entries when slug changes", () => {
    const redirects = buildSlugRedirects({
      oldSlugByLocale: { "zh-CN": "old-zh", en: "old-en" },
      newSlugByLocale: { "zh-CN": "new-zh", en: "old-en" },
      pathBuilder: (locale, slug) => `/${locale}/products/${slug}`
    });

    expect(redirects).toHaveLength(1);
    expect(redirects[0]).toEqual({
      locale: "zh-CN",
      fromPath: "/zh-CN/products/old-zh",
      toPath: "/zh-CN/products/new-zh"
    });
  });
});
