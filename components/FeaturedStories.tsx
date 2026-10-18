import Image from "next/image";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import {
  articleHref,
  articleImageUrl,
  type ArticleCardData,
} from "@/lib/article-card-data";

export default function FeaturedStories({ articles, title = "Featured Stories", eyebrow = "Editor's selection", description, href = "/articles", linkLabel = "View all" }: { articles: ArticleCardData[]; title?: string; eyebrow?: string; description?: string; href?: string; linkLabel?: string }) {
  const highlightedArticles = articles.slice(0, 2);
  const supportingArticles = articles.slice(2, 6);
  if (!highlightedArticles.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">
            {title}
          </h2>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>}
        </div>
        <Link href={href} className="text-sm font-semibold text-zinc-700 hover:text-black">
          {linkLabel || "View all"} →
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {highlightedArticles.map((featuredArticle, index) => {
          const imageUrl = articleImageUrl(featuredArticle);
          const generatedImage = imageUrl?.startsWith("/api/article-thumbnail/") ?? false;
          return (
            <article key={featuredArticle._id} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-md">
              <Link href={articleHref(featuredArticle)} className="block h-full">
                <div className="relative aspect-video overflow-hidden bg-zinc-200">
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={featuredArticle.title}
                      fill
                      preload={index === 0}
                      unoptimized={generatedImage}
                      sizes="(min-width: 1280px) 600px, (min-width: 768px) 50vw, calc(100vw - 2.5rem)"
                      className="object-cover transition duration-300 group-hover:scale-[1.015]"
                    />
                  )}
                </div>
                <div className="p-5 md:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                    {featuredArticle.category}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-zinc-950">
                    {featuredArticle.title}
                  </h3>
                  {featuredArticle.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">
                      {featuredArticle.description}
                    </p>
                  )}
                  <span className="mt-4 block text-sm font-bold text-zinc-950">Read the story →</span>
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {supportingArticles.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {supportingArticles.map((article) => (
            <ArticleCard key={article._id} article={article} compact imageSizes="(min-width: 1280px) 290px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, calc(100vw - 2.5rem)" />
          ))}
        </div>
      )}
    </section>
  );
}
