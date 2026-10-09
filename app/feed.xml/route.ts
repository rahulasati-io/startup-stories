import {defineQuery} from "next-sanity";
import {getGeneratedArticleThumbnailPath} from "@/lib/business-model-thumbnail";
import {absoluteUrl} from "@/lib/site-url";
import {escapeXml} from "@/lib/sitemap-xml";
import {client} from "@/sanity/lib/client";

export const dynamic = "force-dynamic";

type FeedArticle = {
  _updatedAt: string;
  title: string;
  slug: string;
  description?: string | null;
  publishedAt?: string | null;
  contentUpdatedAt?: string | null;
  category?: string | null;
  categorySlug?: string | null;
  author?: string | null;
  socialImageUrl?: string | null;
  mainImageUrl?: string | null;
};

const FEED_QUERY = defineQuery(/* groq */ `
  *[
    _type == "post" &&
    !(_id in path("drafts.**")) &&
    defined(title) &&
    defined(slug.current)
  ] | order(coalesce(contentUpdatedAt, publishedAt, _updatedAt) desc) [0...50] {
    _updatedAt,
    title,
    "slug": slug.current,
    "description": coalesce(seoDescription, array::join(body[0...2].children[].text, " ")),
    publishedAt,
    contentUpdatedAt,
    "category": category->title,
    "categorySlug": category->slug.current,
    "author": author->name,
    "socialImageUrl": socialImage.asset->url,
    "mainImageUrl": mainImage.asset->url
  }
`);

function rssDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toUTCString();
}

function isoDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function articleThumbnail(article: FeedArticle) {
  const generated = getGeneratedArticleThumbnailPath(
    article.categorySlug,
    article.slug,
    article._updatedAt,
  );

  const value = article.socialImageUrl || article.mainImageUrl || generated;
  return value ? absoluteUrl(value) : null;
}

export async function GET() {
  try {
    const articles = await client.fetch<FeedArticle[]>(
      FEED_QUERY,
      {},
      {perspective: "published", cache: "no-store"},
    );

    const newestUpdate = articles[0]
      ? rssDate(articles[0].contentUpdatedAt || articles[0].publishedAt || articles[0]._updatedAt)
      : null;

    const items = articles
      .map((article) => {
        const articleUrl = absoluteUrl(`/articles/${article.slug}`);
        const publishedAt = rssDate(article.publishedAt || article._updatedAt);
        const updatedAt = isoDate(article.contentUpdatedAt || article.publishedAt || article._updatedAt);
        const thumbnail = articleThumbnail(article);

        return [
          "    <item>",
          `      <title>${escapeXml(article.title)}</title>`,
          `      <link>${escapeXml(articleUrl)}</link>`,
          `      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>`,
          publishedAt ? `      <pubDate>${publishedAt}</pubDate>` : null,
          updatedAt ? `      <atom:updated>${updatedAt}</atom:updated>` : null,
          article.author ? `      <dc:creator>${escapeXml(article.author)}</dc:creator>` : null,
          article.category ? `      <category>${escapeXml(article.category)}</category>` : null,
          article.description ? `      <description>${escapeXml(article.description)}</description>` : null,
          thumbnail ? `      <media:thumbnail url="${escapeXml(thumbnail)}" />` : null,
          "    </item>",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n");

    const feedUrl = absoluteUrl("/feed.xml");
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">',
      "  <channel>",
      "    <title>MisterStory</title>",
      `    <link>${escapeXml(absoluteUrl("/"))}</link>`,
      "    <description>Recently published business stories, company analysis and people profiles from MisterStory.</description>",
      "    <language>en-IN</language>",
      `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
      newestUpdate ? `    <lastBuildDate>${newestUpdate}</lastBuildDate>` : null,
      "    <ttl>15</ttl>",
      items,
      "  </channel>",
      "</rss>",
    ]
      .filter(Boolean)
      .join("\n");

    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("RSS feed generation failed", error);
    return new Response("Feed temporarily unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "300",
      },
    });
  }
}
