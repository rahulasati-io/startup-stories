import Image from "next/image";
import Link from "next/link";
import { articleHref, articleImageUrl, type ArticleCardData } from "@/lib/article-card-data";

export default function ArticleCard({ article, compact = false }: { article: ArticleCardData; compact?: boolean }) {
  const imageUrl = articleImageUrl(article);
  const isGeneratedThumbnail = imageUrl?.startsWith("/api/article-thumbnail/") ?? false;
  const date = article.publishedAt
    ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(article.publishedAt))
    : null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
      <Link href={articleHref(article)} className="block h-full">
        <div className="relative aspect-[1200/630] overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-600 to-amber-200">
          {imageUrl && <Image src={imageUrl} alt={article.title} fill unoptimized={isGeneratedThumbnail} sizes={compact ? "(max-width: 640px) 100vw, 25vw" : "(max-width: 768px) 100vw, 33vw"} className="object-cover transition duration-300 group-hover:scale-[1.02]" />}
        </div>
        <div className={compact ? "p-4" : "p-5"}>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{article.category}</p>
          <h3 className={`mt-2 font-bold leading-tight tracking-tight text-zinc-950 ${compact ? "text-lg" : "text-xl"}`}>{article.title}</h3>
          {article.description && <p className={`mt-3 line-clamp-2 text-zinc-600 ${compact ? "text-xs leading-5" : "text-sm leading-6"}`}>{article.description}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-zinc-500">
            {article.companyName && <span>{article.companyName}</span>}
            {article.companyName && date && <span aria-hidden="true">•</span>}
            {date && <time dateTime={article.publishedAt || undefined}>{date}</time>}
          </div>
        </div>
      </Link>
    </article>
  );
}
