import { defineQuery } from "next-sanity";

export type GlobalSearchResults = {
  companies: { _id: string; name: string; slug: string; industry: string | null }[];
  people: { _id: string; name: string; slug: string; role: string | null }[];
  articles: { _id: string; title: string; slug: string; category: string | null; company: string | null }[];
};

export const EMPTY_SEARCH_RESULTS: GlobalSearchResults = { companies: [], people: [], articles: [] };

export const GLOBAL_SEARCH_QUERY = defineQuery(/* groq */ `
  {
    "companies": *[
      _type == "company" &&
      defined(name) &&
      defined(slug.current) &&
      (name match $search || slug.current match $search || industry match $search || industryCategory->name match $search)
    ] | order(name asc)[0...5] {
      _id,
      name,
      "slug": slug.current,
      "industry": coalesce(industryCategory->name, industry)
    },
    "people": *[
      _type == "founder" &&
      defined(name) &&
      defined(slug.current) &&
      (name match $search || slug.current match $search || role match $search)
    ] | order(name asc)[0...4] {
      _id,
      name,
      "slug": slug.current,
      role
    },
    "articles": *[
      _type == "post" &&
      !(_id in path("drafts.**")) &&
      defined(title) &&
      defined(slug.current) &&
      (title match $search || slug.current match $search)
    ] | order(publishedAt desc)[0...5] {
      _id,
      title,
      "slug": slug.current,
      "category": category->title,
      "company": company[0]->name
    }
  }
`);

export const GLOBAL_SEARCH_PAGE_QUERY = defineQuery(/* groq */ `
  {
    "companies": *[
      _type == "company" &&
      defined(name) &&
      defined(slug.current) &&
      (name match $search || slug.current match $search || industry match $search || industryCategory->name match $search)
    ] | order(name asc)[0...30] {
      _id,
      name,
      "slug": slug.current,
      "industry": coalesce(industryCategory->name, industry)
    },
    "people": *[
      _type == "founder" &&
      defined(name) &&
      defined(slug.current) &&
      (name match $search || slug.current match $search || role match $search)
    ] | order(name asc)[0...30] {
      _id,
      name,
      "slug": slug.current,
      role
    },
    "articles": *[
      _type == "post" &&
      !(_id in path("drafts.**")) &&
      defined(title) &&
      defined(slug.current) &&
      (title match $search || slug.current match $search)
    ] | order(publishedAt desc)[0...30] {
      _id,
      title,
      "slug": slug.current,
      "category": category->title,
      "company": company[0]->name
    }
  }
`);

export function toSearchMatch(value: string) {
  return value
    .trim()
    .slice(0, 80)
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part}*`)
    .join(" ");
}

