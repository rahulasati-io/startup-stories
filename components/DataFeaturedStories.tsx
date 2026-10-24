import Image from 'next/image';
import Link from '@/components/NavigationLink';
import {articleHref,articleImageUrl} from '@/lib/article-card-data';
import type {DataFeaturedStory} from '@/lib/data-featured-stories';

export default function DataFeaturedStories({articles}:{articles:DataFeaturedStory[]}){
  if(!articles.length)return null;
  return <aside aria-labelledby="data-featured-title" className="mt-8 self-start rounded-xl border border-zinc-200 bg-white p-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:p-5">
    <h2 id="data-featured-title" className="text-lg font-bold">Featured Stories</h2>
    <ul className="mt-3 divide-y divide-zinc-100">{articles.slice(0,5).map(article=>{
      const image=articleImageUrl(article);
      return <li key={article._id} className="py-3 first:pt-0 last:pb-0"><Link href={articleHref(article)} className="group grid grid-cols-[88px_minmax(0,1fr)] items-start gap-3" prefetch={false}>
        <div className="relative aspect-video overflow-hidden rounded-md bg-zinc-100">{image&&<Image src={image} alt="" fill sizes="88px" unoptimized={image.startsWith('/api/article-thumbnail/')} className="object-cover"/>}</div>
        <h3 className="text-sm font-semibold leading-5 text-zinc-950 group-hover:text-amber-800">{article.title}</h3>
      </Link></li>;
    })}</ul>
  </aside>;
}
