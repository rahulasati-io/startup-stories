import type { Metadata } from "next";
import ArticleDirectory from "@/components/ArticleDirectory";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Newsletter from "@/components/Newsletter";
import { ARTICLE_CARDS_QUERY, type ArticleCardData } from "@/lib/article-card-data";
import { client } from "@/sanity/lib/client";

export const metadata: Metadata = {
  title: "Business Articles | MisterStory",
  description: "Explore business models, company strategies, founder stories and detailed business analysis from MisterStory.",
};

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; category?: string | string[] }> }) {
  const params = await searchParams;
  const initialSearch = Array.isArray(params.q) ? params.q[0] : params.q || "";
  const initialCategory = Array.isArray(params.category) ? params.category[0] : params.category || "All";
  let articles: ArticleCardData[] = [];
  try {
    articles = await client.fetch<ArticleCardData[]>(ARTICLE_CARDS_QUERY, {}, { perspective: "published", cache: "no-store", signal: AbortSignal.timeout(6000) });
  } catch {
    // Keep the directory and its navigation usable during a temporary CMS/network failure.
  }
  const validCategory = initialCategory === "All" || articles.some((article) => article.category === initialCategory) ? initialCategory : "All";
  return <><Header /><main className="bg-[#f7f6f2]"><ArticleDirectory articles={articles} initialSearch={initialSearch} initialCategory={validCategory} /><Newsletter /></main><Footer /></>;
}
