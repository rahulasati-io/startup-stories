import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleCardData } from "@/lib/article-card-data";

export default function LatestStories({ articles }: { articles: ArticleCardData[] }) {
  if (!articles.length) return null;
  return (
    <section
      id="stories"
      className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16"
    >
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
            Fresh from MisterStory
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">
            Latest Stories
          </h2>
        </div>

        <Link
          href="/articles"
          className="text-sm font-semibold text-zinc-700 hover:text-black"
        >
          View all →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => <ArticleCard key={article._id} article={article} />)}
      </div>
    </section>
  );
}
