import { describe, expect, it } from "vitest";
import { buildSitemapIndexXml, buildSitemapXml } from "../src/utils/sitemap";

describe("sitemap", () => {
  it("renders sitemap xml", () => {
    const xml = buildSitemapXml([{ loc: "https://example.com/en/products/a" }]);
    expect(xml).toContain("urlset");
    expect(xml).toContain("https://example.com/en/products/a");
  });

  it("renders sitemap index xml", () => {
    const xml = buildSitemapIndexXml([{ loc: "https://example.com/api/sitemap/en-products.xml" }]);
    expect(xml).toContain("sitemapindex");
    expect(xml).toContain("en-products.xml");
  });
});
