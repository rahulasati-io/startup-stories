import Link from 'next/link';
import {dataPages} from '@/lib/data-library';
import {DATA_CATEGORIES,dataCategoryHref} from '@/lib/data-navigation';

export default function HomepageDataSection(){
  const published=dataPages.filter(page=>!page.reviewRequired&&!page.withheld);
  const groups=DATA_CATEGORIES.map(name=>({name,pages:published.filter(page=>page.segment===name)})).filter(group=>group.pages.length);
  if(!groups.length)return null;
  return <section id="homepage-data" aria-labelledby="homepage-data-title" className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><h2 id="homepage-data-title" className="text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">Business &amp; Economic Data</h2><p className="mt-2 text-sm leading-6 text-zinc-600">Explore India’s economy and financial markets through historical charts and tables.</p></div><Link href="/data" className="text-sm font-semibold text-zinc-700 hover:text-black">Explore all data →</Link></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{groups.map(group=><article key={group.name} className="rounded-xl border border-zinc-200 bg-white p-5"><h3 className="text-lg font-bold text-zinc-950"><Link href={dataCategoryHref(group.name)} className="hover:text-amber-800">{group.name}</Link></h3><ul className="mt-4 space-y-3">{group.pages.map(page=><li key={page.slug}><Link href={`/data/${page.slug}`} className="text-sm leading-6 text-zinc-600 hover:text-amber-800 hover:underline">{page.title}</Link></li>)}</ul></article>)}</div>
  </section>;
}
