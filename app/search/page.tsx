import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { EMPTY_SEARCH_RESULTS, GLOBAL_SEARCH_PAGE_QUERY, toSearchMatch, type GlobalSearchResults } from "@/lib/global-search";
import { client } from "@/sanity/lib/client";

export const metadata: Metadata = { title: "Search | MisterStory", description: "Search MisterStory companies, people and articles." };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const rawQuery = (await searchParams).q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery || "").trim().slice(0, 80);
  let results: GlobalSearchResults = EMPTY_SEARCH_RESULTS;
  let unavailable = false;

  if (query.length >= 2) {
    try {
      results = await client.fetch<GlobalSearchResults>(GLOBAL_SEARCH_PAGE_QUERY, { search: toSearchMatch(query) }, { perspective: "published", cache: "no-store", signal: AbortSignal.timeout(6000) });
    } catch {
      unavailable = true;
    }
  }

  const count = results.companies.length + results.people.length + results.articles.length;
  const section = (title: string, items: { _id: string; title: string; subtitle: string; href: string }[]) => items.length ? <section className="mt-10">
    <h2 className="text-xl font-bold text-zinc-950">{title}</h2>
    <div className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {items.map((item) => <Link key={item._id} href={item.href} className="block px-5 py-4 transition hover:bg-zinc-50"><h3 className="font-semibold text-zinc-950">{item.title}</h3><p className="mt-1 text-sm text-zinc-500">{item.subtitle}</p></Link>)}
    </div>
  </section> : null;

  return <><Header /><main className="min-h-[65vh] bg-[#f7f6f2]"><div className="mx-auto max-w-4xl px-5 py-12 md:px-8 md:py-16">
    <p className="text-xs font-bold uppercase tracking-[.16em] text-amber-700">MisterStory search</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950 md:text-5xl">{query ? `Results for “${query}”` : "Search MisterStory"}</h1>
    {query.length < 2 ? <p className="mt-5 text-zinc-600">Use the search field in the header and enter at least two letters.</p> : unavailable ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Search is temporarily unavailable. Please try again.</p> : <p className="mt-4 text-sm text-zinc-600">{count} {count === 1 ? "result" : "results"} across companies, people and articles.</p>}
    {section("Companies", results.companies.map((item) => ({ _id: item._id, title: item.name, subtitle: item.industry || "Company", href: `/companies/${item.slug}` })))}
    {section("People", results.people.map((item) => ({ _id: item._id, title: item.name, subtitle: item.role || "Person", href: `/people/${item.slug}` })))}
    {section("Articles", results.articles.map((item) => ({ _id: item._id, title: item.title, subtitle: [item.category, item.company].filter(Boolean).join(" · ") || "Article", href: `/articles/${item.slug}` })))}
    {query.length >= 2 && !unavailable && count === 0 && <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center"><h2 className="text-lg font-bold">No results found</h2><p className="mt-2 text-sm text-zinc-500">Try a company name, person, article title or a broader term.</p></div>}
  </div></main><Footer /></>;
}

