import Link from "@/components/NavigationLink";
import {articleHref, type ArticleCardData} from "@/lib/article-card-data";

export type SidebarStory = Pick<ArticleCardData, "_id" | "_updatedAt" | "title" | "slug" | "categorySlug" | "socialImageUrl" | "mainImageUrl"> & {category?: string};

export default function SidebarArticleLinks({articles}: {articles: SidebarStory[]}) {
  return <ol className="divide-y divide-zinc-200">
    {articles.map(item=>{
      return <li key={item._id} className="py-3 first:pt-0 last:pb-0">
        <Link href={articleHref(item)} prefetch={false} className="group block">
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-5 text-zinc-900 group-hover:text-amber-800">{item.title}</span>
            {item.category && <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">{item.category}</span>}
          </span>
        </Link>
      </li>;
    })}
  </ol>;
}
