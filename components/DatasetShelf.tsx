'use client';
import Link from 'next/link';
import {useEffect,useId,useRef,useState} from 'react';
import {dataCategoryId} from '@/lib/data-navigation';

export type DatasetCard={slug:string;title:string;description:string;frequency:string;coverage:string;reviewRequired:boolean};
export default function DatasetShelf({title,pages}:{title:string;pages:DatasetCard[]}){
  const [expanded,setExpanded]=useState(false);const list=useRef<HTMLDivElement>(null);const id=useId();const [overflow,setOverflow]=useState({previous:false,next:false});
  useEffect(()=>{const element=list.current;if(!element)return;const update=()=>setOverflow({previous:element.scrollLeft>2,next:element.scrollLeft+element.clientWidth<element.scrollWidth-3});const observer=new ResizeObserver(update);observer.observe(element);element.addEventListener('scroll',update,{passive:true});return ()=>{observer.disconnect();element.removeEventListener('scroll',update);};},[expanded,pages.length]);
  const scroll=(direction:number)=>list.current?.scrollBy({left:direction*list.current.clientWidth*.85,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  return <section id={dataCategoryId(title)} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-zinc-200 pt-7">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div><h2 id={`${id}-title`} className="text-2xl font-bold tracking-tight">{title}</h2><p className="mt-1 text-xs text-zinc-500">{pages.length} {pages.length===1?'dataset':'datasets'}</p></div>{pages.length>1&&<div className="flex items-center gap-2"><button type="button" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded} aria-controls={id} className="min-h-11 px-2 text-sm font-semibold text-amber-800">{expanded?'Show fewer':`Show all datasets (${pages.length})`}</button>{!expanded&&(overflow.previous||overflow.next)&&<><button type="button" onClick={()=>scroll(-1)} disabled={!overflow.previous} aria-label={`Previous ${title} datasets`} aria-controls={id} className="h-11 w-11 rounded-full border border-zinc-300 bg-white disabled:opacity-40">←</button><button type="button" onClick={()=>scroll(1)} disabled={!overflow.next} aria-label={`More ${title} datasets`} aria-controls={id} className="h-11 w-11 rounded-full border border-zinc-300 bg-white disabled:opacity-40">→</button></>}</div>}</div>
    <div id={id} ref={list} role="region" aria-label={`${title} datasets`} className={expanded?'grid gap-4 sm:grid-cols-2 lg:grid-cols-3':pages.length===1?'grid grid-cols-1':'grid auto-cols-[85%] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain pb-3 sm:auto-cols-[46%] lg:auto-cols-[32%]'}>
      {pages.map(page=><article key={page.slug} className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5"><h3 className="text-lg font-bold leading-snug"><Link href={`/data/${page.slug}`} className="hover:text-amber-800 hover:underline">{page.title}</Link></h3><p className="mt-3 text-sm leading-6 text-zinc-600">{page.description}</p><p className="mt-5 border-t border-zinc-100 pt-3 text-xs text-zinc-500">{page.coverage}</p></article>)}
    </div>
  </section>;
}
