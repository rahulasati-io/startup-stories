"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type DirectoryAuthor = {
  _id: string;
  name: string;
  slug: string;
  role?: string;
  education?: string[];
  experience?: string[];
  articleCount: number;
};

export default function AuthorDirectory({ authors }: { authors: DirectoryAuthor[] }) {
  const [search, setSearch] = useState("");
  const visibleAuthors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return authors;
    return authors.filter((author) =>
      [author.name, author.role, ...(author.education ?? []), ...(author.experience ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [authors, search]);

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Editorial team</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-950 md:text-5xl">MisterStory authors</h1>
        <p className="mt-4 leading-7 text-zinc-600">Meet the people researching and writing MisterStory&apos;s company analysis.</p>
      </div>

      <div className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4 md:p-6">
        <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm focus-within:border-zinc-400">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search authors</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by author, role, education or experience" className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400" />
        </label>

        {visibleAuthors.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleAuthors.map((author) => (
              <Link key={author._id} href={`/authors/${author.slug}`} className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-amber-700">MisterStory author</p>
                <h2 className="mt-3 text-xl font-semibold group-hover:text-amber-800">{author.name}</h2>
                {author.role && <p className="mt-2 text-sm leading-6 text-zinc-600">{author.role}</p>}
                <p className="mt-5 text-xs text-zinc-500">{author.articleCount} {author.articleCount === 1 ? "published article" : "published articles"}</p>
                <p className="mt-3 text-sm font-semibold text-amber-700">View author profile →</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-10 text-center text-sm text-zinc-500">No authors match your search.</div>
        )}
      </div>
    </section>
  );
}
