import Link from "next/link";
import type { ArticleCardData } from "@/lib/article-card-data";

const topics = [
  { label: "Business Models", href: "/topics/business-model", categorySlug: "business-model" },
  { label: "Fintech", href: "/articles?q=Fintech", search: "fintech" },
  { label: "Distribution", href: "/articles?q=Distribution", search: "distribution" },
  { label: "Electric Vehicles", href: "/articles?q=Electric%20Vehicles", search: "electric vehicles" },
  { label: "Automotive", href: "/articles?q=Automotive", search: "automotive" },
  { label: "Artificial Intelligence", href: "/articles?q=Artificial%20Intelligence", search: "artificial intelligence" },
  { label: "Space Technology", href: "/articles?q=Space%20Technology", search: "space technology" },
  { label: "Food Delivery", href: "/articles?q=Food%20Delivery", search: "food delivery" },
];

function searchableArticleText(article: ArticleCardData) {
  return [
    article.title,
    article.description,
    article.category,
    ...article.companies.flatMap((company) => [company.name, company.industry]),
  ].filter(Boolean).join(" ").toLowerCase();
}

export default function Topics({ articles }: { articles: ArticleCardData[] }) {
  const visibleTopics = topics.flatMap((topic) => {
    const count = articles.filter((article) => topic.categorySlug
      ? article.categorySlug === topic.categorySlug
      : searchableArticleText(article).includes(topic.search || "")).length;

    return count ? [{ ...topic, count }] : [];
  });

  if (!visibleTopics.length) return null;

  return (
    <section
      id="topics"
      className="mx-auto mt-14 max-w-7xl border-y border-zinc-200 bg-[#ece8dc] px-5 py-8 md:mt-16 md:px-8 md:py-10"
    >
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-amber-700">
          Explore by idea
        </p>

        <h2 className="mt-2 font-serif text-3xl font-normal tracking-tight text-zinc-900 md:text-4xl">
          Topics worth following
        </h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
        {visibleTopics.map((topic) => (
          <Link
            key={topic.label}
            href={topic.href}
            className="flex shrink-0 items-center gap-2 rounded-full border border-[#d5cfbf] px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-[#f4f1e8]"
          >
            {topic.label}
            <span className="text-xs text-zinc-500" aria-label={`${topic.count} articles`}>{topic.count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
