"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_SEARCH_RESULTS, type GlobalSearchResults } from "@/lib/global-search";

type SearchItem = { id: string; kind: "Company" | "Person" | "Article"; title: string; subtitle: string; href: string };

const searchIcon = <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;

export default function GlobalSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults>(EMPTY_SEARCH_RESULTS);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const items = useMemo<SearchItem[]>(() => [
    ...results.companies.map((item) => ({ id: item._id, kind: "Company" as const, title: item.name, subtitle: item.industry || "Company", href: `/companies/${item.slug}` })),
    ...results.people.map((item) => ({ id: item._id, kind: "Person" as const, title: item.name, subtitle: item.role || "Person", href: `/people/${item.slug}` })),
    ...results.articles.map((item) => ({ id: item._id, kind: "Article" as const, title: item.title, subtitle: [item.category, item.company].filter(Boolean).join(" · ") || "Article", href: `/articles/${item.slug}` })),
  ], [results]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search request failed");
        setResults(await response.json());
      } catch (searchError) {
        if ((searchError as Error).name !== "AbortError") {
          setResults(EMPTY_SEARCH_RESULTS);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (mobileOpen) window.setTimeout(() => mobileInputRef.current?.focus(), 0);
  }, [mobileOpen]);

  function goTo(item: SearchItem) {
    setOpen(false);
    setMobileOpen(false);
    setQuery("");
    setResults(EMPTY_SEARCH_RESULTS);
    setLoading(false);
    router.push(item.href);
  }

  function changeQuery(value: string) {
    setQuery(value);
    setActiveIndex(-1);
    setResults(EMPTY_SEARCH_RESULTS);
    setError(false);
    setLoading(value.trim().length >= 2);
  }

  function submit() {
    if (activeIndex >= 0 && items[activeIndex]) return goTo(items[activeIndex]);
    if (items[0]) return goTo(items[0]);
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  function handleKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { setOpen(false); setMobileOpen(false); setActiveIndex(-1); }
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((value) => Math.min(value + 1, items.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((value) => Math.max(value - 1, -1)); }
  }

  const resultList = (mobile = false) => {
    const term = query.trim();
    if (term.length < 2) return <p className="px-4 py-8 text-center text-sm text-zinc-500">Type at least two letters to search.</p>;
    if (loading) return <p className="px-4 py-8 text-center text-sm text-zinc-500">Searching…</p>;
    if (error) return <p className="px-4 py-8 text-center text-sm text-red-700">Search is temporarily unavailable. Please try again.</p>;
    if (!items.length) return <p className="px-4 py-8 text-center text-sm text-zinc-500">No matching companies, people or articles.</p>;

    let itemIndex = -1;
    const group = (label: string, groupItems: SearchItem[]) => groupItems.length ? <div>
      <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[.16em] text-zinc-400">{label}</p>
      {groupItems.map((item) => {
        itemIndex += 1;
        const index = itemIndex;
        return <Link key={`${item.kind}-${item.id}`} href={item.href} onClick={() => { setOpen(false); setMobileOpen(false); setQuery(""); }} onMouseEnter={() => setActiveIndex(index)} className={`block px-4 py-2.5 transition ${activeIndex === index ? "bg-zinc-950 text-white" : "hover:bg-zinc-100"}`}>
          <span className="block truncate text-sm font-semibold">{item.title}</span>
          <span className={`mt-0.5 block truncate text-xs ${activeIndex === index ? "text-zinc-300" : "text-zinc-500"}`}>{item.subtitle}</span>
        </Link>;
      })}
    </div> : null;

    return <>
      {group("Companies", items.filter((item) => item.kind === "Company"))}
      {group("People", items.filter((item) => item.kind === "Person"))}
      {group("Articles", items.filter((item) => item.kind === "Article"))}
      <Link href={`/search?q=${encodeURIComponent(term)}`} onClick={() => { setOpen(false); setMobileOpen(false); }} className="mt-2 block border-t border-zinc-100 px-4 py-3 text-center text-sm font-bold text-amber-800 hover:bg-amber-50">View all results →</Link>
      <p className="sr-only" aria-live="polite">{items.length} results found</p>
      {mobile && <div className="h-4" />}
    </>;
  };

  return <div ref={rootRef} className="md:min-w-0 md:flex-1">
    <div className="relative hidden max-w-md md:block">
      <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 transition focus-within:border-zinc-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-zinc-100">
        <span className="text-zinc-500">{searchIcon}</span>
        <label htmlFor="global-search" className="sr-only">Search companies, people and articles</label>
        <input id="global-search" type="search" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="global-search-results" autoComplete="off" value={query} onFocus={() => setOpen(true)} onChange={(event) => { changeQuery(event.target.value); setOpen(true); }} onKeyDown={handleKeys} placeholder="Search companies, people, articles…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500" />
      </form>
      {open && <div id="global-search-results" className="absolute left-0 top-full z-50 mt-2 max-h-[70vh] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-zinc-200 bg-white py-1 shadow-2xl">{resultList()}</div>}
    </div>

    <button type="button" aria-label="Open search" onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 md:hidden">{searchIcon}</button>

    {mobileOpen && <div className="fixed inset-0 z-[80] overflow-y-auto bg-white md:hidden">
      <div className="sticky top-0 border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex h-11 flex-1 items-center gap-2 rounded-full border border-zinc-300 bg-zinc-50 px-4 focus-within:border-zinc-500">
            <span className="text-zinc-500">{searchIcon}</span>
            <label htmlFor="mobile-global-search" className="sr-only">Search companies, people and articles</label>
            <input ref={mobileInputRef} id="mobile-global-search" type="search" value={query} onChange={(event) => changeQuery(event.target.value)} onKeyDown={handleKeys} autoComplete="off" placeholder="Search MisterStory…" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
          </form>
          <button type="button" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-zinc-700">Cancel</button>
        </div>
      </div>
      <div className="py-2">{resultList(true)}</div>
    </div>}
  </div>;
}
