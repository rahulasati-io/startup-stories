import Header from "@/components/Header";
import Hero from "@/components/Hero";
import IntentCards from "@/components/IntentCards";
import Topics from "@/components/Topics";
import LatestStories from "@/components/LatestStories";
import CompanyRow from "@/components/CompanyRow";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { COMPANIES_QUERY } from "@/components/CompanyRow";
import type { Company } from "@/components/CompanyDirectory";
import { ARTICLE_CARDS_QUERY, type ArticleCardData } from "@/lib/article-card-data";
import { client } from "@/sanity/lib/client";

export default async function Home() {
  const [companiesResult, articlesResult] = await Promise.allSettled([
    client.fetch<Company[]>(COMPANIES_QUERY, {}, { perspective: "published", cache: "no-store", signal: AbortSignal.timeout(6000) }),
    client.fetch<ArticleCardData[]>(ARTICLE_CARDS_QUERY, {}, { perspective: "published", cache: "no-store", signal: AbortSignal.timeout(6000) }),
  ]);
  const companies = companiesResult.status === "fulfilled" ? companiesResult.value : [];
  const articles = articlesResult.status === "fulfilled" ? articlesResult.value : [];
  return (
    <>
      <Header />

      <main>
        {/* Search + discovery */}
        <Hero companies={companies} featuredArticles={articles.slice(0, 4)} />

        {/* Core ways to explore MisterStory */}
        <IntentCards />

        {/* Explore businesses by idea */}
        <Topics />

        {/* Fresh content */}
        <LatestStories articles={articles.slice(4, 8)} />

        {/* Company directory preview */}
        <CompanyRow companies={companies} />

        {/* Capture email after demonstrating value */}
        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
