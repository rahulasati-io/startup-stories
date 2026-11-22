type DescriptionArticle = {
  title: string;
  seoDescription?: string | null;
  body?: { _type: string; children?: unknown[] }[];
};

export function articleDescription(article: DescriptionArticle): string {
  if (article.seoDescription?.trim()) return article.seoDescription.trim();
  const text = (article.body || [])
    .filter((block) => block._type === "block")
    .map((block) => (block.children || [])
      .map((span) => span && typeof span === "object" && "text" in span
        && typeof span.text === "string" ? span.text : "").join(""))
    .join(" ").replace(/\s+/g, " ").trim();
  return text.slice(0, 160) || article.title;
}
