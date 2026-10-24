import type {Metadata} from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import DatasetShelf from '@/components/DatasetShelf';
import {dataPages,metricRows,periodLabel} from '@/lib/data-library';
import {absoluteUrl} from '@/lib/site-url';
import JsonLd from '@/components/JsonLd';
import {dataCatalogJsonLd} from '@/lib/data-bank.mjs';

export const metadata:Metadata={title:{absolute:'India Economic & Financial Data: Charts & Tables'},description:'Explore historical data on India’s GDP, inflation, RBI rates, rupee dollar exchange rates, SIP contributions, Nifty returns and IPOs, with charts and tables.',keywords:['India economic data','India financial data','historical economic indicators','RBI rate history','Indian market data','India data charts'],alternates:{canonical:absoluteUrl('/data')},robots:{index:dataPages.some(page=>!page.reviewRequired&&!page.withheld),follow:true}};
export default async function DataLibrary({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams;const search=(typeof params.q==='string'?params.q:'').trim().slice(0,120);
  const pages=dataPages.filter(page=>`${page.title} ${page.description} ${page.segment}`.toLowerCase().includes(search.toLowerCase()));
  const segments=[...new Set(pages.map(page=>page.segment))];
  const catalog=dataCatalogJsonLd(pages,absoluteUrl('/'));
  return <><Header/><main className="mx-auto max-w-7xl px-5 py-7 text-zinc-950 md:px-8"><Breadcrumbs items={[{label:'Home',href:'/'},{label:'Data'}]}/><h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">Business &amp; Economic Data</h1><p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">Explore the numbers behind India’s economy and financial markets. Historical observations, clear definitions and traceable sources.</p>
    {catalog&&<JsonLd data={catalog}/>}
    <form action="/data" className="my-7 flex max-w-2xl gap-2"><label className="sr-only" htmlFor="dataset-search">Search datasets</label><input id="dataset-search" name="q" defaultValue={search} placeholder="Search repo rates, inflation, SIP, exchange rates…" className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base"/><button className="rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">Search</button></form><p className="mb-6 text-sm text-zinc-500" aria-live="polite">{pages.length} datasets across {segments.length} subjects</p>
    <div className="space-y-9">{segments.map(segment=><DatasetShelf key={segment} title={segment} pages={pages.filter(page=>page.segment===segment).map(page=>{const rows=page.metrics.length?metricRows(page,page.metrics[0].key):[];const periods=rows.map(row=>row.period).sort();return {slug:page.slug,title:page.title,description:page.description,frequency:page.frequency,coverage:periods.length?`${periodLabel(periods[0])} – ${periodLabel(periods.at(-1)!)}`:'',reviewRequired:page.reviewRequired};})}/>)}</div>{!pages.length&&<p className="py-12">No datasets match your search.</p>}
  </main><Footer/></>;
}
