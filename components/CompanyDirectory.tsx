"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type Company = {
  _id: string;
  name: string | null;
  slug: string | null;
  industry: string | null;
  foundedYear: number | null;
  description: string | null;
  logoUrl: string | null;
  logoAlt: string | null;
};

type CompanyDirectoryProps = {
  companies: Company[];
  excludeSlug?: string;
  title?: string;
  description?: string;
  previewLimit?: number;
  showViewAll?: boolean;
  initialSearch?: string;
};

export default function CompanyDirectory({
  companies,
  excludeSlug,
  title = "Explore Companies",
  description = "Find company stories, strategies, business models, people and key numbers.",
  previewLimit,
  showViewAll = false,
  initialSearch = "",
}: CompanyDirectoryProps) {
  const [search, setSearch] = useState(initialSearch);
  const [industry, setIndustry] = useState("All");

  const uniqueCompanies = useMemo(() => {
    const bySlug = new Map<string, Company>();

    for (const company of companies) {
      const key = company.slug?.toLowerCase();
      if (!key || key === excludeSlug?.toLowerCase()) continue;

      const existing = bySlug.get(key);
      if (!existing || company.slug === key) bySlug.set(key, company);
    }

    return Array.from(bySlug.values());
  }, [companies, excludeSlug]);

  const industries = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(uniqueCompanies.map((company) => company.industry).filter(Boolean)),
      ).sort((a, b) => a!.localeCompare(b!)),
    ] as string[],
    [uniqueCompanies],
  );

  const visibleCompanies = useMemo(() => {
    const term = search.trim().toLowerCase();

    return uniqueCompanies.filter((company) => {
      const matchesIndustry = industry === "All" || company.industry === industry;
      const searchableText = [company.name, company.industry, company.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesIndustry && (!term || searchableText.includes(term));
    });
  }, [uniqueCompanies, industry, search]);

  const displayedCompanies = previewLimit ? visibleCompanies.slice(0, previewLimit) : visibleCompanies;

  return (
    <section id="company-deep-dives" className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Company directory</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
      </div>

      <div className="mt-7 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4 md:p-6">
        <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm focus-within:border-zinc-400">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-zinc-500">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only">Search companies</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by company or industry" className="w-full bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400" />
        </label>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter companies by industry">
          {industries.map((item) => (
            <button key={item} type="button" onClick={() => setIndustry(item)} aria-pressed={industry === item} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${industry === item ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"}`}>
              {item}
            </button>
          ))}
        </div>

        {visibleCompanies.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedCompanies.map((company) => (
              <Link key={company._id} href={`/company/${company.slug}`} className="group flex min-h-48 flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2">
                    {company.logoUrl ? (
                      <Image src={company.logoUrl} alt={company.logoAlt || `${company.name} logo`} width={96} height={64} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-lg font-extrabold text-zinc-700">{company.name?.charAt(0).toUpperCase() || "?"}</span>
                    )}
                  </div>
                  <span className="text-lg text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-950">→</span>
                </div>

                <h3 className="mt-5 text-lg font-bold tracking-tight text-zinc-950">{company.name}</h3>
                <div className="mt-1 flex flex-wrap gap-x-2 text-xs font-medium text-zinc-500">
                  {company.industry && <span>{company.industry}</span>}
                  {company.industry && company.foundedYear && <span>•</span>}
                  {company.foundedYear && <span>Founded {company.foundedYear}</span>}
                </div>
                {company.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">{company.description}</p>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
            <p className="font-semibold text-zinc-900">No companies found</p>
            <p className="mt-1 text-sm text-zinc-500">Try a different name or industry.</p>
          </div>
        )}

        {showViewAll && (
          <div className="mt-6 text-center">
            <Link href="/companies" className="inline-flex rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-zinc-800">
              View all companies →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
