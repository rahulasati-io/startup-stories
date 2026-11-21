type ArticleDates = {
  publishedAt?: string | null;
  contentUpdatedAt?: string | null;
};

// A database revision is not an editorial update. Share this rule between the
// visible byline, metadata, Article JSON-LD and content sitemap.
export function articleDates(article: ArticleDates) {
  const publishedAt = article.publishedAt || undefined;
  const updatedAt = article.contentUpdatedAt || undefined;
  const modifiedAt = updatedAt || publishedAt;
  return {
    publishedAt,
    modifiedAt,
    visibleDate: modifiedAt,
    label: updatedAt ? "Updated" : "Published",
  };
}
