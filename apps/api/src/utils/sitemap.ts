export function buildSitemapXml(entries: Array<{ loc: string; lastmod?: string }>): string {
  const body = entries
    .map(
      (entry) =>
        `<url><loc>${entry.loc}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function buildSitemapIndexXml(entries: Array<{ loc: string; lastmod?: string }>): string {
  const body = entries
    .map(
      (entry) =>
        `<sitemap><loc>${entry.loc}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</sitemap>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}
