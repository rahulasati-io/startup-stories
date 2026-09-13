"use client";

import { useMemo, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleCardData } from "@/lib/article-card-data";

export default function ArticleDirectory({ articles, initialSearch = "", initialCategory = "All" }: { articles: ArticleCardData[]; initialSearch?: string; initialCategory?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const categories = useMemo(() => ["All", ...Array.from(new Set(articles.map((article) => article.category).filter(Boolean))).sort()], [articles]);
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return articles.filter((article) => (category === "All" || article.category === category) && (!term || [article.title, article.description, article.companyName, article.category].filter(Boolean).join(" ").toLowerCase().includes(term)));
  }, [articles, category, search]);

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">MisterStory library</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] text-zinc-950 md:text-5xl">Articles</h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">Explore business models, strategies, founder stories and the decisions that shaped interesting companies.</p>
      </div>
      <div className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4 md:p-6">
        <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm focus-within:border-zinc-400">
          <span aria-hidden="true" className="text-zinc-500">⌕</span><span className="sr-only">Search articles</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by article, company or topic" className="w-full bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400" />
        </label>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter articles by category">
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${category === item ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"}`}>{item}</button>)}
        </div>
        <p className="mt-5 text-xs font-semibold text-zinc-500" aria-live="polite">{visible.length} {visible.length === 1 ? "article" : "articles"}</p>
        {visible.length ? <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map((article) => <ArticleCard key={article._id} article={article} />)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-12 text-center"><p className="font-semibold text-zinc-900">No articles found</p><p className="mt-1 text-sm text-zinc-500">Try another company, topic or category.</p></div>}
      </div>
    </section>
  );
}
