import { defineQuery } from "next-sanity";
import { getGeneratedArticleThumbnailPath } from "@/lib/business-model-thumbnail";

export type ArticleCardData = {
  _id: string;
  _updatedAt: string;
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  description: string | null;
  publishedAt: string | null;
  contentUpdatedAt: string | null;
  promotion: "standard" | "popular" | null;
  companies: {
    _id?: string;
    name: string;
    slug: string;
    industry: string | null;
  }[];
  peopleIds?: string[];
  conceptIds?: string[];
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
    contentUpdatedAt,
    promotion,
    "companies": coalesce(company[]->{
      _id,
      name,
      "slug": slug.current,
      "industry": coalesce(industryCategory->name, industry)
    }, []),
    "peopleIds": coalesce(people[]._ref, []),
    "conceptIds": coalesce(concepts[]._ref, []),
    "socialImageUrl": socialImage.asset->url,
    "mainImageUrl": mainImage.asset->url
  }
`);

export type ArticleLinkData = Pick<ArticleCardData, "_id" | "title" | "slug" | "category" | "_updatedAt" | "categorySlug" | "socialImageUrl" | "mainImageUrl">;

export function articleHref(article: Pick<ArticleCardData, "slug">) {
  return `/articles/${article.slug}`;
}

export function articleImageUrl(article: Pick<ArticleCardData,'socialImageUrl'|'mainImageUrl'|'categorySlug'|'slug'|'_updatedAt'>) {
  return article.socialImageUrl || article.mainImageUrl || getGeneratedArticleThumbnailPath(article.categorySlug, article.slug, article._updatedAt);
}
