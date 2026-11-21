// Cache dependencies describe query results, not just the page displaying them.
// A post change refreshes related-story sections without expiring biographies.
export const ARTICLE_DEPENDENCIES = ["post", "category", "author", "company", "founder", "concept", "industry"];
export const COMPANY_DEPENDENCIES = ["company", "industry", "founder"];
export const PEOPLE_DEPENDENCIES = ["founder", "companyPersonRole", "company", "industry"];

export function contentCacheTag(type: string) {
  return `published-content:${type}`;
}

export function publicContentOptions(...dependencies: string[]) {
  return {
    perspective: "published" as const,
    stega: false,
    cache: "force-cache" as const,
    next: {
      revalidate: 60,
      tags: [...new Set([...dependencies, "sanity.imageAsset"])].map(contentCacheTag),
    },
  };
}

// Unknown/missing types use the conservative legacy fallback until their
// dependencies are mapped. Existing webhook projections need only `_type`.
export const KNOWN_CONTENT_TYPES = new Set([
  ...ARTICLE_DEPENDENCIES, ...PEOPLE_DEPENDENCIES,
  "fundingRound", "timelineEvent", "companyMetric", "homepageSettings",
  "directoryPageSettings", "seoSettings", "companyFinancialControl",
  "companyBusinessModelComponent", "companyStrategy", "sanity.imageAsset",
]);
