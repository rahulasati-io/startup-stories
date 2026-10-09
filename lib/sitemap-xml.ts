export type SitemapEntry = {
  url: string;
  lastModified?: Date | string;
};

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "no-store",
};

export function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function createSitemapResponse(entries: SitemapEntry[]) {
  const urls = entries
    .map((entry) => {
      const lastModified = entry.lastModified ? formatDate(entry.lastModified) : null;
      return [
        "  <url>",
        `    <loc>${escapeXml(entry.url)}</loc>`,
        lastModified ? `    <lastmod>${lastModified}</lastmod>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
  ].join("\n");

  return new Response(xml, {headers: XML_HEADERS});
}

export function createSitemapIndexResponse(sitemaps: string[]) {
  const children = sitemaps
    .map(
      (url) =>
        ["  <sitemap>", `    <loc>${escapeXml(url)}</loc>`, "  </sitemap>"].join("\n"),
    )
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    children,
    "</sitemapindex>",
  ].join("\n");

  return new Response(xml, {headers: XML_HEADERS});
}

export function createSitemapErrorResponse() {
  return new Response("Sitemap temporarily unavailable", {
    status: 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": "300",
    },
  });
}
