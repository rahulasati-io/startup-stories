export const DEFAULT_ARTICLE_AUTHOR_SLUG = 'rahul-asati';

// Never allow a draft author ID into a reference written to an article.
export const PUBLISHED_AUTHORS_QUERY = /* groq */ `*[
  _type == "author" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) &&
  defined(name) && defined(slug.current)
]{_id, name, "slug": slug.current}`;

export const DEFAULT_ARTICLE_AUTHOR_QUERY = /* groq */ `*[
  _type == "author" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) &&
  slug.current in ["rahul-asati", "rahul"] && defined(name)
] | order((slug.current == "rahul-asati") desc)[0]{_id, name, "slug": slug.current}`;

// One expression keeps the visible byline, SEO, RSS and author listings aligned.
// An explicitly selected published author always takes precedence.
export const ARTICLE_AUTHOR_PROJECTION = /* groq */ `coalesce(
  author->{_id, name, "slug": slug.current},
  ${DEFAULT_ARTICLE_AUTHOR_QUERY}
)`;

/**
 * @param {string} slug An optional explicit spreadsheet selection.
 * @param {{_ref?: string} | null | undefined} existingAuthor
 * @param {Array<{_id: string, slug: string}>} authors Published authors only.
 */
export function importedArticleAuthorId(slug, existingAuthor, authors) {
  const published = authors.filter(author => !/^(drafts|versions)\./.test(author._id));
  if (slug) {
    // Support the previous Rahul slug after the profile's canonical rename.
    return (published.find(author => author.slug === slug) ||
      (slug === 'rahul' ? published.find(author => author.slug === DEFAULT_ARTICLE_AUTHOR_SLUG) : undefined))?._id;
  }
  const existingId = existingAuthor?._ref?.replace(/^drafts\./, '');
  if (existingId && published.some(author => author._id === existingId)) return existingId;
  return (published.find(author => author.slug === DEFAULT_ARTICLE_AUTHOR_SLUG) ||
    published.find(author => author.slug === 'rahul'))?._id;
}
