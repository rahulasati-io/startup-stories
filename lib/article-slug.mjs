export const ARTICLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ARTICLE_SLUG_ERROR = "Use lowercase letters and numbers separated by single hyphens, with no spaces or leading/trailing hyphens.";

/** @param {unknown} value */
export function isValidArticleSlug(value) {
  // JavaScript's $ also matches before a final newline. Require a full match.
  return typeof value === "string" && ARTICLE_SLUG_PATTERN.exec(value)?.[0] === value;
}

/** @param {unknown} value @param {string} [context] */
export function assertArticleSlug(value, context = "Article slug") {
  if (!isValidArticleSlug(value)) throw new Error(`${context}: ${ARTICLE_SLUG_ERROR}`);
}
