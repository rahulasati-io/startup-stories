import Image from "next/image";
import Link from "@/components/NavigationLink";
import {articleHref, articleImageUrl, type ArticleCardData} from "@/lib/article-card-data";

export type SidebarStory = Pick<ArticleCardData, "_id" | "_updatedAt" | "title" | "slug" | "categorySlug" | "socialImageUrl" | "mainImageUrl"> & {category?: string};

export default function SidebarArticleLinks({articles}: {articles: SidebarStory[]}) {
  return <ol className="divide-y divide-zinc-200">
    {articles.map(item=>{
      const image = articleImageUrl(item);
      return <li key={item._id} className="py-3 first:pt-0 last:pb-0">
        <Link href={articleHref(item)} prefetch={false} className={`group ${image ? "grid grid-cols-[88px_minmax(0,1fr)] items-start gap-3" : "block"}`}>
          {image && <div className="relative aspect-video overflow-hidden rounded-md bg-zinc-100">
            <Image src={image} alt="" fill sizes="88px" loading="lazy" unoptimized={image.startsWith('/api/article-thumbnail/')} className="object-cover" />
          </div>}
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-5 text-zinc-900 group-hover:text-amber-800">{item.title}</span>
            {item.category && <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">{item.category}</span>}
          </span>
        </Link>
      </li>;
    })}
  </ol>;
}
