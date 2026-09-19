"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Company } from "@/components/CompanyDirectory";

const popularCompanies = [
  { label: "Zomato", slug: "zomato" },
  { label: "Jio", slug: "jio-platforms" },
  { label: "Zerodha", slug: "zerodha" },
  { label: "Safari", slug: "safari" },
];

export default function HomepageCompanySearch({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return companies
      .filter((company) => [company.name, company.slug].filter(Boolean).join(" ").toLowerCase().includes(term))
      .sort((left, right) => {
        const leftName = left.name?.toLowerCase() || "";
        const rightName = right.name?.toLowerCase() || "";
        const leftStarts = leftName.startsWith(term) ? 0 : 1;
        const rightStarts = rightName.startsWith(term) ? 0 : 1;
        return leftStarts - rightStarts || leftName.localeCompare(rightName);
      })
      .slice(0, 8);
  }, [companies, search]);

  function submit() {
    if (activeIndex >= 0 && results[activeIndex]?.slug) router.push(`/companies/${results[activeIndex].slug}`);
    else if (results[0]?.slug) router.push(`/companies/${results[0].slug}`);
    else setOpen(true);
  }

  return (
    <div className="relative mx-auto mt-6 w-full max-w-2xl">
      <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex items-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3.5 text-left shadow-sm transition focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-200">
        <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-zinc-500"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <label className="sr-only" htmlFor="homepage-company-search">Search companies and industries</label>
        <input
          id="homepage-company-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          value={search}
          autoComplete="off"
          aria-expanded={open && Boolean(search.trim())}
          aria-controls="homepage-company-results"
          aria-activedescendant={activeIndex >= 0 ? `homepage-company-result-${activeIndex}` : undefined}
          placeholder="Search Zomato, Zerodha, fintech, distribution..."
          onFocus={() => search.trim() && setOpen(true)}
          onChange={(event) => { setSearch(event.target.value); setOpen(true); setActiveIndex(0); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setOpen(false); setActiveIndex(-1); }
            if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((value) => Math.min(value + 1, results.length - 1)); }
            if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((value) => Math.max(value - 1, -1)); }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-500 md:text-base"
        />
      </form>

      {open && search.trim() && (
        <div id="homepage-company-results" aria-label="Company search results" className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-left shadow-xl md:w-[72%]">
          {results.length ? results.map((company, index) => (
            <Link id={`homepage-company-result-${index}`} key={company._id} href={`/companies/${company.slug}`} onMouseEnter={() => setActiveIndex(index)} className={`block truncate px-4 py-2.5 text-sm transition ${activeIndex === index ? "bg-zinc-950 font-semibold text-white" : "text-zinc-800 hover:bg-zinc-100"}`}>
              {company.name}
            </Link>
          )) : <div className="px-4 py-6 text-center"><p className="text-sm font-semibold text-zinc-900">No companies found</p><p className="mt-1 text-xs text-zinc-500">Try another company or industry.</p></div>}
          <p className="sr-only" aria-live="polite">{results.length} {results.length === 1 ? "company" : "companies"} found</p>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
        <span>Popular:</span>
        {popularCompanies.map((company) => <Link key={company.slug} href={`/companies/${company.slug}`} className="font-semibold underline underline-offset-2 transition hover:text-zinc-950">{company.label}</Link>)}
      </div>
    </div>
  );
}
