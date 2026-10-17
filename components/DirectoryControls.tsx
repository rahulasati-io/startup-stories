"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useTransition} from "react";
import {directoryHref, type DirectoryPagination} from "@/lib/directory-pagination";

export function DirectoryControls({pagination, placeholder}: {pagination: DirectoryPagination; placeholder: string}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <form action={pagination.path} method="get" aria-busy={pending} onSubmit={(event) => {
    event.preventDefault();
    const query: Record<string, string> = {};
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value.trim()) query[key] = value.trim();
    }
    startTransition(() => router.push(directoryHref(pagination.path, 1, query), {scroll: false}));
  }}>
    <div className="flex gap-3">
      <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
        <span aria-hidden="true">⌕</span><span className="sr-only">{placeholder}</span>
        <input key={pagination.query.q || ""} type="search" name="q" defaultValue={pagination.query.q || ""} placeholder={placeholder} className="w-full bg-transparent text-sm text-zinc-950 outline-none" />
      </label>
      <button disabled={pending} className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Searching…" : "Search"}</button>
    </div>
    {pagination.filters.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {pagination.filters.map((filter) => <label key={filter.name} className="text-xs font-semibold text-zinc-600">
        {filter.label}
        <select key={filter.value} name={filter.name} defaultValue={filter.value} disabled={pending} onChange={(event) => event.currentTarget.form?.requestSubmit()} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900">
          <option value="">All {filter.label.toLowerCase()}</option>
          {filter.options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>)}
    </div>}
    {Object.keys(pagination.query).length > 0 && <Link href={pagination.path} prefetch={false} className="mt-3 inline-block text-sm font-semibold text-zinc-600 underline">Clear filters</Link>}
    <p role="status" className="mt-4 text-xs font-semibold text-zinc-500">{pending ? "Updating results…" : `${pagination.total} results · Showing ${pagination.total ? (pagination.page - 1) * pagination.pageSize + 1 : 0}–${Math.min(pagination.page * pagination.pageSize, pagination.total)}`}</p>
  </form>;
}

export function DirectoryPageLinks({pagination}: {pagination: DirectoryPagination}) {
  const pages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
  if (pages < 2) return null;
  const nearby = [...new Set([1, pagination.page - 1, pagination.page, pagination.page + 1, pages])].filter((page) => page > 0 && page <= pages).sort((a, b) => a - b);
  const style = "rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:border-zinc-400";
  return <nav aria-label="Directory pages" className="mt-7 flex flex-wrap items-center justify-center gap-2">
    {pagination.page > 1 && <Link prefetch={false} className={style} href={directoryHref(pagination.path, pagination.page - 1, pagination.query)}>← Previous</Link>}
    {nearby.map((page, index) => <span key={page} className="contents">
      {index > 0 && page - nearby[index - 1] > 1 && <span className="px-1 text-zinc-400">…</span>}
      <Link prefetch={false} aria-current={page === pagination.page ? "page" : undefined} className={`${style} ${page === pagination.page ? "!bg-zinc-950 text-white" : ""}`} href={directoryHref(pagination.path, page, pagination.query)}>{page}</Link>
    </span>)}
    {pagination.page < pages && <Link prefetch={false} className={style} href={directoryHref(pagination.path, pagination.page + 1, pagination.query)}>Next →</Link>}
  </nav>;
}
