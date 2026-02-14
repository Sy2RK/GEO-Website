import { describe, expect, it } from "vitest";
import { buildProductJsonLd } from "../src/utils/jsonld";

describe("jsonld", () => {
  it("generates VideoGame and Game category for game taxonomy", () => {
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
    expect(jsonld.applicationCategory).toBe("Game");
    expect(jsonld["@id"]).toBe("https://example.com/en/products/goods-triple-match");
    expect(jsonld.inLanguage).toBe("en");
  });

  it("generates SoftwareApplication and Other category for others taxonomy", () => {
    const jsonld = buildProductJsonLd({
      product: {
        id: "2",
        canonicalId: "guru:product:example-others",
        slugByLocale: { "zh-CN": "example-others", en: "example-others" },
        typeTaxonomy: ["others"],
        developer: null,
        publisher: null,
        brand: null,
        platforms: ["web"],
        storeLinks: {},
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      } as any,
      doc: {
        content: {
          identity: { name: "Example Others Product" },
          canonicalSummary: "Summary"
        }
      } as any,
      canonicalUrl: "https://example.com/en/products/example-others",
      locale: "en"
    });

    expect(jsonld["@type"]).toBe("SoftwareApplication");
    expect(jsonld.applicationCategory).toBe("Other");
  });
});
