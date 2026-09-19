import type { MetadataRoute } from "next";
import { defineQuery } from "next-sanity";
import { absoluteUrl } from "@/lib/site-url";
import { client } from "@/sanity/lib/client";

export const revalidate = 3600;

const SITEMAP_QUERY = defineQuery(/* groq */ `
  *[
    _type in ["company", "founder", "post", "category", "author"] &&
    defined(slug.current) &&
    !(_id in path("drafts.**"))
  ] {
    _type,
    "slug": slug.current,
    _updatedAt
  }
`);

type SitemapDocument = {
  _type: "company" | "founder" | "post" | "category" | "author";
  slug: string;
  _updatedAt: string;
};

function documentPath(document: SitemapDocument) {
  if (document._type === "company") return `/companies/${document.slug}`;
  if (document._type === "founder") return `/people/${document.slug}`;
  if (document._type === "post") return `/articles/${document.slug}`;
  if (document._type === "category") return `/topics/${document.slug}`;
  if (document._type === "author") return `/authors/${document.slug}`;
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
