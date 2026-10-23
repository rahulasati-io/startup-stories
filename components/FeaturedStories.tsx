import Image from "next/image";
import Link from "@/components/NavigationLink";
import {articleHref, articleImageUrl, type ArticleCardData} from "@/lib/article-card-data";
import {formatIstDate} from "@/lib/display-dates.mjs";

function StoryDate({article}:{article:ArticleCardData}) {
  const value=article.contentUpdatedAt||article.publishedAt;
  return value?<time dateTime={value} className="text-[11px] font-medium text-zinc-500">{article.contentUpdatedAt?'Updated':'Published'} {formatIstDate(value)}</time>:null;
}

export default function FeaturedStories({articles,title="Featured Stories",eyebrow="Editor's selection",description,href="/articles",linkLabel="View all"}:{articles:ArticleCardData[];title?:string;eyebrow?:string;description?:string;href?:string;linkLabel?:string}){
  const [lead,...supporting]=articles.slice(0,5);
  if(!lead)return null;
  const image=articleImageUrl(lead);
  return (
    <section aria-labelledby="featured-stories-title" className="mx-auto max-w-7xl px-5 pb-10 pt-5 md:px-8 md:pb-12 md:pt-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow&&<p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">{eyebrow}</p>}
          <h2 id="featured-stories-title" className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">{title}</h2>
          {description&&<p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>}
        </div>
        <Link href={href} className="shrink-0 text-sm font-semibold text-zinc-700 hover:text-black">{linkLabel||'View all'} →</Link>
      </div>
      <div className={supporting.length?'grid items-stretch gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:gap-7':'max-w-3xl'}>
        <article data-featured-lead className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-md">
          <Link href={articleHref(lead)} className="block">
            <div className="relative aspect-video overflow-hidden bg-zinc-100">
              {image&&<Image src={image} alt={lead.title} fill preload unoptimized={image.startsWith('/api/article-thumbnail/')} sizes="(min-width:1280px) 660px, (min-width:768px) 55vw, calc(100vw - 2.5rem)" className="object-cover transition duration-300 group-hover:scale-[1.015]"/>}
            </div>
            <div className="p-5 md:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{lead.category}</p>
              <h3 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-zinc-950 lg:text-[28px]">{lead.title}</h3>
              {lead.description&&<p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">{lead.description}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><StoryDate article={lead}/><span className="text-sm font-bold text-zinc-950">Read the story →</span></div>
            </div>
          </Link>
        </article>
        {supporting.length>0&&<div className="relative min-w-0">
          <div aria-label="More featured stories" style={{gridTemplateRows:`repeat(${supporting.length}, minmax(0, 1fr))`}} className="divide-y divide-zinc-200 border-y border-zinc-200 md:absolute md:inset-0 md:grid">
          {supporting.map(article=>{
            const thumbnail=articleImageUrl(article);
            return <article key={article._id} data-featured-supporting className="group min-h-0 py-3 md:flex md:items-center">
              <Link href={articleHref(article)} className="grid w-full grid-cols-[112px_minmax(0,1fr)] items-center gap-3 xl:grid-cols-[144px_minmax(0,1fr)] xl:gap-4">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-zinc-100">
                  {thumbnail&&<Image src={thumbnail} alt={article.title} fill unoptimized={thumbnail.startsWith('/api/article-thumbnail/')} sizes="(min-width:1280px) 144px, 112px" className="object-cover transition duration-300 group-hover:scale-[1.02]"/>}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{article.category}</p>
                  <h3 className="mb-2 mt-1 line-clamp-3 text-base font-bold leading-snug tracking-tight text-zinc-950 group-hover:text-amber-800 md:line-clamp-2 lg:text-lg">{article.title}</h3>
                  <StoryDate article={article}/>
                </div>
              </Link>
            </article>;
          })}
          </div>
        </div>}
      </div>
    </section>
  );
}
