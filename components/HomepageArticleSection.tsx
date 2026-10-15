import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleCardData } from "@/lib/article-card-data";

type HomepageArticleSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  articles: ArticleCardData[];
};

export default function HomepageArticleSection({
  eyebrow,
  title,
  description,
  href,
  articles,
}: HomepageArticleSectionProps) {
  if (!articles.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-14">
      <div className="mb-6 flex items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>
        </div>
        <Link href={href} className="shrink-0 text-sm font-semibold text-zinc-700 hover:text-black">
          View all →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <ArticleCard key={article._id} article={article} compact />
        ))}
      </div>
    </section>
  );
}
