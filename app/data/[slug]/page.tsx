import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import DatasetChart from '@/components/DatasetChart';
import DataFeaturedStories from '@/components/DataFeaturedStories';
import {getDataFeaturedStories} from '@/lib/data-featured-stories';
import {dataPages,getDataPage,metricRows,defaultRows,formatDataValue,periodLabel} from '@/lib/data-library';
import type {DataRow} from '@/lib/data-library';
import {absoluteUrl} from '@/lib/site-url';
import {breadcrumbJsonLd} from '@/lib/structured-data';
import {datasetJsonLd} from '@/lib/data-bank.mjs';

type Props={params:Promise<{slug:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const page=getDataPage((await params).slug);if(!page)return {};return {title:page.seoTitle?{absolute:page.seoTitle}:`${page.title} | MisterStory`,description:page.description,keywords:page.keywords,alternates:{canonical:absoluteUrl(`/data/${page.slug}`)},robots:{index:!page.reviewRequired&&!page.withheld,follow:true}};}
export function generateStaticParams(){return dataPages.map(page=>({slug:page.slug}));}
export default async function DatasetPage({params,searchParams}:Props){
  const page=getDataPage((await params).slug);if(!page)notFound();const search=await searchParams;
  const ipo=page.slug==='largest-indian-ipos';
  const metric=page.metrics.find(item=>item.key===search.metric)||page.metrics[0];
  const all=metric?metricRows(page,metric.key):[];
  const weekly=search.view==='weekly';
  const table:DataRow[]=metric?(ipo?[...all].sort((a,b)=>Number(a.rank)-Number(b.rank)):weekly?all:defaultRows(page,metric.key)):[];
  const rawPage=typeof search.page==='string'?search.page:'1';
  const pageNumber=/^[1-9]\d*$/.test(rawPage)?Number(rawPage):0;
  const totalPages=Math.max(1,Math.ceil(table.length/25));
  if(!Number.isSafeInteger(pageNumber)||pageNumber<1||pageNumber>totalPages)notFound();
  const featured=await getDataFeaturedStories();
  const visible=(ipo?table:[...table].reverse()).slice((pageNumber-1)*25,pageNumber*25);
  const latest=all.at(-1);
  const tableHref=(number:number)=>`/data/${page.slug}?${new URLSearchParams({metric:metric.key,...(weekly?{view:'weekly'}:{}),page:String(number)})}#historical-table`;
  // Switching a series or table view starts at page one, retaining the other choice.
  const choiceHref=(key:string,view:string,anchor:string)=>`/data/${page.slug}?${new URLSearchParams({metric:key,...(view==='weekly'?{view:'weekly'}:{})})}#${anchor}`;
  const switchClass=(selected:boolean)=>`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800 ${selected?'bg-white text-zinc-950 shadow-sm':'text-zinc-600 hover:bg-white/70 hover:text-zinc-950'}`;
  const schema=datasetJsonLd(page,absoluteUrl('/'));
  return <><Header/><main className="mx-auto max-w-7xl px-5 py-7 text-zinc-950 md:px-8">
    <Breadcrumbs items={[{label:'Home',href:'/'},{label:'Data',href:'/data'},{label:page.title}]}/>
    <JsonLd data={breadcrumbJsonLd([{name:'Home',path:'/'},{name:'Data',path:'/data'},{name:page.title,path:`/data/${page.slug}`}])}/>
    <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">{page.title}</h1>
    <p className="mt-4 max-w-3xl leading-7 text-zinc-600">{page.description}</p>
    {schema&&<JsonLd data={schema}/>}
    <div className={featured.length?'mt-7 grid items-start gap-x-7 lg:grid-cols-[minmax(0,1fr)_320px]':'mt-7 block'}>
      <div className="min-w-0">
      {metric&&!ipo&&<>
        <section id="data-chart" className="scroll-mt-24 rounded-xl border border-zinc-200 bg-white p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{page.metrics.length>1?'Year-on-year inflation':metric.label}</h2>
            {page.metrics.length>1&&<nav aria-label="Inflation base year" className="inline-flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1">{page.metrics.map(item=><Link key={item.key} href={choiceHref(item.key,weekly?'weekly':'changes','data-chart')} scroll={false} aria-current={item.key===metric.key?'true':undefined} className={switchClass(item.key===metric.key)}>{item.key==='cpi2024Inflation'?'2024 base':item.key==='cpi2012Inflation'?'2012 base':item.label}</Link>)}</nav>}
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1"><p className="text-3xl font-bold tabular-nums">{latest?formatDataValue(latest[metric.key],metric.decimals):'Not available'}<span className="text-lg font-medium">{metric.unit.startsWith('%')?'':' '}{metric.unit}</span></p><p className="text-sm text-zinc-500">As of {latest?periodLabel(latest.period):'Not available'}</p></div>
          <DatasetChart key={metric.key} rows={all} metric={metric.key} label={metric.label} unit={metric.unit} decimals={metric.decimals} step={page.step}/>
        </section>
      </>}
      <section id="historical-table" className="mt-8 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">{ipo?'Largest IPOs by issue size':page.step?(metric.key==='repo'?'Historical repo rates':'Historical cash reserve ratios'):'Historical data table'}</h2>
          {page.step&&<nav aria-label="Rate table view" className="inline-flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1"><Link href={choiceHref(metric.key,'changes','historical-table')} aria-current={!weekly?'true':undefined} className={switchClass(!weekly)}>Rate changes</Link><Link href={choiceHref(metric.key,'weekly','historical-table')} aria-current={weekly?'true':undefined} className={switchClass(weekly)}>All weekly observations</Link></nav>}
        </div>
        {page.step&&<p className="mt-2 text-sm leading-6 text-zinc-600">{weekly?'All weekly observations.':'First observation and changes first seen in the weekly data.'}</p>}
        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white"><table className="w-full text-sm">
          <caption className="sr-only">{page.title}, {metric.label}, {metric.unit}.</caption>
          <thead className="bg-zinc-50"><tr>{ipo&&<><th scope="col" className="p-3 text-left">Rank</th><th scope="col" className="p-3 text-left">Company</th></>}<th scope="col" className="p-3 text-left">{ipo?'Year':page.step?'Observation date':'Period'}</th><th scope="col" className="p-3 text-right">{metric.label} ({metric.unit})</th></tr></thead>
          <tbody>{visible.map(row=><tr key={ipo?String(row.rank):row.period} className="border-t border-zinc-100">{ipo&&<><td className="p-3 tabular-nums">{row.rank}</td><th scope="row" className="p-3 text-left font-medium">{row.company}</th></>}{ipo?<td className="p-3">{row.period}</td>:<th scope="row" className="p-3 text-left font-normal">{periodLabel(row.period,page.step)}</th>}<td className="p-3 text-right tabular-nums">{formatDataValue(row[metric.key],metric.decimals)}</td></tr>)}</tbody>
        </table></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><span>{table.length} {ipo?'IPOs':'observations'} · Page {pageNumber} of {totalPages}</span><nav aria-label="Data table pagination" className="flex gap-5">{pageNumber>1&&<Link href={tableHref(pageNumber-1)} className="font-semibold underline">Previous</Link>}{pageNumber<totalPages&&<Link href={tableHref(pageNumber+1)} className="font-semibold underline">Next</Link>}</nav></div>
      </section>
      <section className="mt-9"><h2 className="text-2xl font-bold">Definitions and methodology</h2><p className="mt-3 leading-7 text-zinc-700">{page.methodology}</p>{page.source?.trim()&&<p className="mt-3 text-sm">Source: {page.source.trim()}.</p>}</section>
    </div>
    <section id="related-datasets" className="mt-12 border-t border-zinc-200 pt-7 lg:col-start-1 lg:row-start-2"><h2 className="text-2xl font-bold">Related datasets</h2><ul className="mt-4 flex flex-wrap gap-x-7 gap-y-3">{dataPages.filter(item=>item.slug!==page.slug).sort((a,b)=>Number(b.segment===page.segment)-Number(a.segment===page.segment)).slice(0,4).map(item=><li key={item.slug}><Link href={`/data/${item.slug}`} className="text-sm font-semibold underline underline-offset-4">{item.title}</Link></li>)}</ul></section>
    <DataFeaturedStories articles={featured}/>
    </div>
  </main><Footer/></>;
}
