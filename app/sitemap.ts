import type { MetadataRoute } from "next";
import { defineQuery } from "next-sanity";
import { absoluteUrl } from "@/lib/site-url";
import { client } from "@/sanity/lib/client";

export const revalidate = 3600;

const SITEMAP_QUERY = defineQuery(/* groq */ `
  *[
    _type in ["company", "founder", "post"] &&
    defined(slug.current) &&
    !(_id in path("drafts.**"))
  ] {
    _type,
    "slug": slug.current,
    "categorySlug": category->slug.current,
    _updatedAt
  }
`);

type SitemapDocument = {
  _type: "company" | "founder" | "post";
  slug: string;
  categorySlug?: string;
  _updatedAt: string;
};

function documentPath(document: SitemapDocument) {
  if (document._type === "company") return `/company/${document.slug}`;
  if (document._type === "founder") return `/founder/${document.slug}`;
  if (document._type === "post" && document.categorySlug) {
    return `/articles/${document.categorySlug}/${document.slug}`;
  }
  return null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/companies"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/people"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/articles"),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const documents = await client.fetch<SitemapDocument[]>(
      SITEMAP_QUERY,
      {},
      { perspective: "published" },
    );

    const contentPages: MetadataRoute.Sitemap = documents.flatMap(
      (document) => {
        const path = documentPath(document);
        if (!path) return [];

        return [
          {
            url: absoluteUrl(path),
            lastModified: new Date(document._updatedAt),
            changeFrequency: "weekly" as const,
            priority: document._type === "post" ? 0.8 : 0.7,
          },
        ];
      },
    );

    return [...staticPages, ...contentPages];
  } catch {
    // Keep the core pages discoverable if Sanity is briefly unavailable.
    return staticPages;
  }
}
