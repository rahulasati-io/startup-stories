import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import ArticleDirectory from "@/components/ArticleDirectory";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import JsonLd from "@/components/JsonLd";
import Newsletter from "@/components/Newsletter";
import { ARTICLE_CARDS_QUERY, type ArticleCardData } from "@/lib/article-card-data";
import { absoluteUrl } from "@/lib/site-url";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { client } from "@/sanity/lib/client";

const TOPIC_QUERY = defineQuery(/* groq */ `
  *[_type == "category" && slug.current == $slug][0]{
    title,
    description,
    "slug": slug.current
  }
`);

type Topic = {
  title: string;
  description?: string;
  slug: string;
};

type Props = { params: Promise<{ slug: string }> };

async function getTopic(slug: string) {
  return client.fetch<Topic | null>(TOPIC_QUERY, { slug }, { perspective: "published" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) return {};
  return {
    title: `${topic.title} Articles | MisterStory`,
    description: topic.description || `Explore MisterStory articles about ${topic.title.toLowerCase()}.`,
    alternates: { canonical: absoluteUrl(`/topics/${topic.slug}`) },
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const [topic, allArticles] = await Promise.all([
    getTopic(slug),
    client.fetch<ArticleCardData[]>(ARTICLE_CARDS_QUERY, {}, { perspective: "published", cache: "no-store" }),
  ]);
  if (!topic) notFound();

  const articles = allArticles.filter((article) => article.categorySlug === topic.slug);
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Articles", path: "/articles" },
    { name: topic.title, path: `/topics/${topic.slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <Header />
      <main className="bg-[#f7f6f2]">
        <div className="mx-auto max-w-7xl px-5 pt-8 md:px-8">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Articles", href: "/articles" }, { label: topic.title }]} />
        </div>
        <ArticleDirectory
          articles={articles}
          initialCategory={topic.title}
          eyebrow="Explore by topic"
          title={topic.title}
          description={topic.description || `Articles and analysis about ${topic.title.toLowerCase()}.`}
          showCategoryFilters={false}
        />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
