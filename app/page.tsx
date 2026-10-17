import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedStories from "@/components/FeaturedStories";
import HomepageArticleSection from "@/components/HomepageArticleSection";
import IntentCards from "@/components/IntentCards";
import Topics from "@/components/Topics";
import LatestStories from "@/components/LatestStories";
import CompanyRow from "@/components/CompanyRow";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { COMPANIES_QUERY } from "@/components/CompanyRow";
import type { Company } from "@/components/CompanyDirectory";
import { ARTICLE_CARDS_QUERY, type ArticleCardData } from "@/lib/article-card-data";
import { HOMEPAGE_SETTINGS_QUERY, type HomepageSettings } from "@/lib/homepage-content";
import { client } from "@/sanity/lib/client";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default async function Home() {
  const [companiesResult, articlesResult, homepageSettingsResult] = await Promise.allSettled([
    client.fetch<Company[]>(COMPANIES_QUERY, {}, { perspective: "published", next: { revalidate: 60 }, signal: AbortSignal.timeout(6000) }),
    client.fetch<ArticleCardData[]>(ARTICLE_CARDS_QUERY, {}, { perspective: "published", next: { revalidate: 60 }, signal: AbortSignal.timeout(6000) }),
    client.fetch<HomepageSettings | null>(HOMEPAGE_SETTINGS_QUERY, {}, { perspective: "published", next: { revalidate: 60 }, signal: AbortSignal.timeout(6000) }),
  ]);
  const companies = companiesResult.status === "fulfilled" ? companiesResult.value : [];
  const articles = articlesResult.status === "fulfilled" ? articlesResult.value : [];
  const homepageSettings = homepageSettingsResult.status === "fulfilled" ? homepageSettingsResult.value : null;
  const articlesById = new Map(articles.map((article) => [article._id, article]));
  const configuredFeaturedIds = [...new Set([
    homepageSettings?.featuredArticleId,
    homepageSettings?.secondFeaturedArticleId,
    ...(homepageSettings?.supportingFeaturedArticleIds || []),
  ].filter((id): id is string => Boolean(id)))];
  const configuredFeatured = configuredFeaturedIds.flatMap((id) => {
    const article = articlesById.get(id);
    return article ? [article] : [];
  });
  const featuredArticles = (configuredFeatured.length ? configuredFeatured : articles).slice(0, 6);
  const usedArticleIds = new Set(featuredArticles.map((article) => article._id));

  const takeUnique = (candidates: ArticleCardData[], limit: number) => {
    const selected: ArticleCardData[] = [];
    for (const article of candidates) {
      if (usedArticleIds.has(article._id)) continue;
      selected.push(article);
      usedArticleIds.add(article._id);
      if (selected.length === limit) break;
    }
    return selected;
  };

  const fundingArticles = takeUnique(
    articles.filter((article) => article.categorySlug === "funding-news"),
    4,
  );
  const businessModelArticles = takeUnique(
    articles.filter((article) => article.categorySlug === "business-model"),
    4,
  );
  const latestArticles = takeUnique(
    articles.filter((article) => article.categorySlug !== "funding-news"),
    4,
  );

  return (
    <>
      <Header />

      <main>
        {/* Search + discovery */}
        <Hero companies={companies} />

        <FeaturedStories articles={featuredArticles} />

        <HomepageArticleSection
          eyebrow="Capital and ownership"
          title="Funding & Deals"
          description="Funding rounds, acquisitions, rights issues and the ownership moves shaping companies."
          href="/topics/funding-news"
          articles={fundingArticles}
        />

        <HomepageArticleSection
          eyebrow="Business models"
          title="How Companies Make Money"
          description="Clear breakdowns of the revenue engines, costs and economics behind interesting companies."
          href="/topics/business-model"
          articles={businessModelArticles}
        />

        <LatestStories articles={latestArticles} />

        {/* Core ways to explore MisterStory */}
        <IntentCards />

        {/* Explore businesses by idea */}
        <Topics articles={articles} />

        {/* Company directory preview */}
        <CompanyRow companies={companies} />

        {/* Capture email after demonstrating value */}
        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
