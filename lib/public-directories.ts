import "server-only";
import {cache} from "react";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {defineQuery} from "next-sanity";
import {client} from "@/sanity/lib/client";
import {toSearchMatch} from "@/lib/global-search";
import {ARTICLE_DIRECTORY_FILTER} from "@/lib/article-directory-filter";
import {absoluteUrl} from "@/lib/site-url";
import {directoryHref, directoryParams, DIRECTORY_PAGE_SIZE, type DirectoryParams, type DirectoryPagination} from "@/lib/directory-pagination";

export type PublicDirectoryKind = "articles" | "companies" | "people";
const published = '!(_id in path("drafts.**")) && !(_id in path("versions.**"))';
const filters = {
  companies: `_type == "company" && ${published} && defined(name) && defined(slug.current) &&
    ($industry == "" || industry == $industry || industryCategory._ref in *[_type == "industry" && name == $industry]._id) &&
    ($q == "" || name match $search || slug.current match $search || description match $search || industry match $search || subIndustry match $search || industryCategory._ref in *[_type == "industry" && name match $search]._id)`,
  people: `_type == "founder" && ${published} && defined(name) && defined(slug.current) &&
    ($q == "" || name match $search || slug.current match $search || role match $search || _id in *[_type == "companyPersonRole" && company._ref in *[_type == "company" && name match $search]._id].person._ref)`,
  articles: ARTICLE_DIRECTORY_FILTER,
};
const projections = {
  companies: `{_id, name, "slug": slug.current, "industry": coalesce(industryCategory->name, industry), subIndustry, foundedYear, description}`,
  people: `{_id, name, "slug": slug.current, role, "photoUrl": photo.asset->url, "photoAlt": coalesce(photo.alt, name), "companyNames": array::unique(*[_type == "companyPersonRole" && person._ref == ^._id].company->name)}`,
  articles: `{_id, _updatedAt, title, "slug": slug.current, "category": category->title, "categorySlug": category->slug.current,
    "description": coalesce(seoDescription, array::join(body[0...2].children[].text, " ")), publishedAt, contentUpdatedAt, promotion,
    "companies": coalesce(company[]->{_id, name, "slug": slug.current, "industry": coalesce(industryCategory->name, industry)}, []),
    "socialImageUrl": socialImage.asset->url, "mainImageUrl": mainImage.asset->url}`,
};
const optionsQuery = defineQuery(/* groq */ `{
  "industries": array::unique(*[_type == "company" && defined(slug.current)]{"value": coalesce(industryCategory->name, industry)}.value),
  "categories": *[_type == "category" && _id in *[_type == "post"].category._ref].title,
  "companies": *[_type == "company" && _id in *[_type == "post"].company[]._ref].name
}`);
type Options = {industries: string[]; categories: string[]; companies: string[]};
const getOptions = cache(() => client.fetch<Options>(optionsQuery, {}, {perspective: "published", next: {revalidate: 60}}));

export async function getPublicDirectory<T>(kind: PublicDirectoryKind, raw: DirectoryParams): Promise<{items: T[]; pagination: DirectoryPagination}> {
  const {page, query} = directoryParams(raw);
  if (!page) notFound();
  const params = {q: query.q || "", search: toSearchMatch(query.q || ""), category: query.category || "", company: query.company || "", industry: query.industry || ""};
  const [total, options] = await Promise.all([
    client.fetch<number>(defineQuery(`count(*[${filters[kind]}])`), params, {perspective: "published", next: {revalidate: 60}}),
    kind === "people" ? Promise.resolve({industries: [], categories: [], companies: []}) : getOptions(),
  ]);
  if (page > Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE))) notFound();
  const start = (page - 1) * DIRECTORY_PAGE_SIZE;
  const order = kind === "articles" ? "publishedAt desc, _updatedAt desc, _id asc" : "name asc, _id asc";
  const items = await client.fetch<T[]>(defineQuery(`*[${filters[kind]}] | order(${order})[${start}...${start + DIRECTORY_PAGE_SIZE}] ${projections[kind]}`), params, {perspective: "published", next: {revalidate: 60}});
  const names = kind === "articles" ? ["category", "company", "industry"] : kind === "companies" ? ["industry"] : [];
  const filterOptions: Record<string, string[]> = {category: options.categories, company: options.companies, industry: options.industries};
  return {items, pagination: {path: `/${kind}`, page, total, pageSize: DIRECTORY_PAGE_SIZE, query, filters: names.map((name) => ({name, label: name === "category" ? "Categories" : name === "company" ? "Companies" : "Industries", value: query[name] || "", options: [...new Set(filterOptions[name].filter(Boolean).concat(query[name] ? [query[name]] : []))].sort((a, b) => a.localeCompare(b))}))}};
}

export function directoryMetadata(kind: PublicDirectoryKind, params: DirectoryParams, title: string, description: string): Metadata {
  const {page, query} = directoryParams(params);
  return {title: page > 1 ? `${title} — Page ${page}` : title, description,
    alternates: {canonical: absoluteUrl(directoryHref(`/${kind}`, page || 1, query))},
    ...(Object.keys(query).length ? {robots: {index: false, follow: true}} : {}),
  };
}
