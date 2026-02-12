import { describe, expect, it } from "vitest";
import { buildProductJsonLd } from "../src/utils/jsonld";

describe("jsonld", () => {
  it("generates VideoGame for game taxonomy", () => {
    const jsonld = buildProductJsonLd({
      product: {
        id: "1",
        canonicalId: "guru:product:goodstriplematch",
        slugByLocale: { "zh-CN": "goods-triple-match", en: "goods-triple-match" },
        typeTaxonomy: ["game"],
        developer: null,
        publisher: null,
        brand: null,
        platforms: ["ios"],
        storeLinks: {},
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      } as any,
      doc: {
        content: {
          identity: { name: "Goods TripleMatch" },
          canonicalSummary: "Summary"
        }
      } as any,
      canonicalUrl: "https://example.com/en/products/goods-triple-match",
      locale: "en"
    });

    expect(jsonld["@type"]).toBe("VideoGame");
    expect(jsonld["@id"]).toBe("https://example.com/en/products/goods-triple-match");
    expect(jsonld.inLanguage).toBe("en");
  });
});
