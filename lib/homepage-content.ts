import { defineQuery } from "next-sanity";
import type {HomepageSection} from "@/lib/homepage-config";

export type HomepageSettings = {
  featuredArticleId: string | null;
  secondFeaturedArticleId: string | null;
  supportingFeaturedArticleIds: string[];
  seoTitle?: string;
  seoDescription?: string;
  socialImageUrl?: string;
  heroTitle?: string;
  heroDescription?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  popularCompanies?: {label: string; slug: string}[];
  sections?: HomepageSection[] | null;
};

export const HOMEPAGE_SETTINGS_QUERY = defineQuery(/* groq */ `
  *[_type == "homepageSettings" && _id == "homepageSettings"][0]{
    seoTitle, seoDescription, "socialImageUrl": socialImage.asset->url,
    heroTitle, heroDescription, showSearch, searchPlaceholder,
    "popularCompanies": popularCompanies[]->{"label": name, "slug": slug.current},
    sections[]{_key, kind, enabled, title, eyebrow, description, href, linkLabel,
      "categorySlug": coalesce(category->slug.current, categorySlug), excludeFunding, limit,
      "articleIds": articles[]._ref,
      links[]{_key, title, description, href, action, categorySlug, search}},
    "featuredArticleId": featuredArticle._ref,
    "secondFeaturedArticleId": secondFeaturedArticle._ref,
    "supportingFeaturedArticleIds": coalesce(supportingFeaturedArticles[]._ref, [])
  }
`);
