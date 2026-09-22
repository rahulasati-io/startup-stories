import { defineQuery } from "next-sanity";
import { getBusinessModelThumbnailPath } from "@/lib/business-model-thumbnail";

export type ArticleCardData = {
  _id: string;
  _updatedAt: string;
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  description: string | null;
  publishedAt: string | null;
  promotion: "standard" | "popular" | null;
  companies: {
    name: string;
    slug: string;
    industry: string | null;
  }[];
  socialImageUrl: string | null;
  mainImageUrl: string | null;
};

export const ARTICLE_CARDS_QUERY = defineQuery(/* groq */ `
  *[
    _type == "post" &&
    !(_id in path("drafts.**")) &&
    defined(title) &&
    defined(slug.current) &&
    defined(category->slug.current)
  ] | order(publishedAt desc, _updatedAt desc) {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    "category": category->title,
    "categorySlug": category->slug.current,
    "description": coalesce(seoDescription, array::join(body[0...2].children[].text, " ")),
    publishedAt,
    promotion,
    "companies": coalesce(company[]->{
      name,
      "slug": slug.current,
      "industry": coalesce(industryCategory->name, industry)
    }, []),
    "socialImageUrl": socialImage.asset->url,
    "mainImageUrl": mainImage.asset->url
  }
`);

export function articleHref(article: ArticleCardData) {
  return `/articles/${article.slug}`;
}

export function articleImageUrl(article: ArticleCardData) {
  return article.socialImageUrl || article.mainImageUrl || getBusinessModelThumbnailPath(article.categorySlug, article.slug, article._updatedAt);
}
