import {defineQuery} from "next-sanity";
import {absoluteUrl} from "@/lib/site-url";
import type {SitemapEntry} from "@/lib/sitemap-xml";
import {client} from "@/sanity/lib/client";

type SitemapDocumentType = "company" | "founder" | "post" | "category" | "author";

type SitemapDocument = {
  _type: SitemapDocumentType;
  slug: string;
  _updatedAt: string;
};

const CONTENT_SITEMAP_QUERY = defineQuery(/* groq */ `
  *[
    _type in $types &&
    defined(slug.current) &&
    !(_id in path("drafts.**"))
  ] | order(_updatedAt desc) {
    _type,
    "slug": slug.current,
    _updatedAt
  }
`);

function documentPath(document: SitemapDocument) {
  if (document._type === "company") return `/companies/${document.slug}`;
  if (document._type === "founder") return `/people/${document.slug}`;
  if (document._type === "post") return `/articles/${document.slug}`;
  if (document._type === "category") return `/topics/${document.slug}`;
  if (document._type === "author") return `/authors/${document.slug}`;
  return null;
}

export async function getContentSitemap(types: SitemapDocumentType[]): Promise<SitemapEntry[]> {
  const documents = await client.fetch<SitemapDocument[]>(
    CONTENT_SITEMAP_QUERY,
    {types},
    {perspective: "published", cache: "no-store"},
  );

  return documents.flatMap((document) => {
    const path = documentPath(document);
    if (!path) return [];

    return [{url: absoluteUrl(path), lastModified: document._updatedAt}];
  });
}

export function getStaticSitemap(): SitemapEntry[] {
  return [
    {url: absoluteUrl("/")},
    {url: absoluteUrl("/companies")},
    {url: absoluteUrl("/people")},
    {url: absoluteUrl("/authors")},
    {url: absoluteUrl("/articles")},
    {url: absoluteUrl("/about"), lastModified: "2026-09-24"},
    {url: absoluteUrl("/editorial-policy"), lastModified: "2026-09-24"},
    {url: absoluteUrl("/contact"), lastModified: "2026-09-24"},
    {url: absoluteUrl("/privacy"), lastModified: "2026-09-24"},
    {url: absoluteUrl("/terms"), lastModified: "2026-09-24"},
  ];
}
