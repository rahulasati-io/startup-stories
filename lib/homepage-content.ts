import { defineQuery } from "next-sanity";

export type HomepageSettings = {
  featuredArticleId: string | null;
  secondFeaturedArticleId: string | null;
  supportingFeaturedArticleIds: string[];
};

export const HOMEPAGE_SETTINGS_QUERY = defineQuery(/* groq */ `
  *[_type == "homepageSettings" && _id == "homepageSettings"][0]{
    "featuredArticleId": featuredArticle->_id,
    "secondFeaturedArticleId": secondFeaturedArticle->_id,
    "supportingFeaturedArticleIds": coalesce(supportingFeaturedArticles[]->_id, [])
  }
`);
