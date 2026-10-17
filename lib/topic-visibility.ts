// Keep topic discovery aligned with the published articles the topic page can render.
// Used inside category subqueries, where ^ refers to the category document.
export const TOPIC_ARTICLE_FILTER = /* groq */ `
  _type == "post" &&
  !(_id in path("drafts.**")) &&
  defined(title) &&
  defined(slug.current) &&
  category._ref == ^._id
`;
