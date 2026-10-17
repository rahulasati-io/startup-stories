import Image from "next/image";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import {
  articleHref,
  articleImageUrl,
  type ArticleCardData,
} from "@/lib/article-card-data";

export default function FeaturedStories({ articles }: { articles: ArticleCardData[] }) {
  const [featuredArticle, ...supportingArticles] = articles;
  if (!featuredArticle) return null;

  const imageUrl = articleImageUrl(featuredArticle);
  const generatedImage = imageUrl?.startsWith("/api/article-thumbnail/") ?? false;

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
            Editor&apos;s selection
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">
            Featured Story
          </h2>
        </div>
        <Link href="/articles" className="text-sm font-semibold text-zinc-700 hover:text-black">
          View all →
        </Link>
      </div>

      <article className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-md">
        <Link href={articleHref(featuredArticle)} className="grid md:grid-cols-[1.35fr_1fr]">
          <div className="relative aspect-video overflow-hidden bg-zinc-200 md:aspect-auto md:min-h-[330px]">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={featuredArticle.title}
                fill
                preload
                unoptimized={generatedImage}
                sizes="(min-width: 1280px) 700px, (min-width: 768px) 57vw, calc(100vw - 2.5rem)"
                className="object-cover transition duration-300 group-hover:scale-[1.015]"
              />
            )}
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8 lg:p-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              {featuredArticle.category}
            </p>
            <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-zinc-950 md:text-3xl">
              {featuredArticle.title}
            </h3>
            {featuredArticle.description && (
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600 md:text-base md:leading-7">
                {featuredArticle.description}
              </p>
            )}
            <span className="mt-6 text-sm font-bold text-zinc-950">Read the story →</span>
          </div>
        </Link>
      </article>

      {supportingArticles.length > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {supportingArticles.map((article) => (
            <ArticleCard key={article._id} article={article} compact />
          ))}
        </div>
      )}
    </section>
  );
}
