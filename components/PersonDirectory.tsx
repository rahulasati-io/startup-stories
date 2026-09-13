"use client";

import { useMemo, useState } from "react";
import PersonCard from "@/components/PersonCard";

export type DirectoryPerson = {
  _id: string;
  name: string;
  slug: string;
  role?: string;
  photoUrl?: string;
  photoAlt?: string;
  companyNames?: string[];
};

export default function PersonDirectory({ people }: { people: DirectoryPerson[] }) {
  const [search, setSearch] = useState("");
  const visiblePeople = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return people;
    return people.filter((person) =>
      [person.name, person.role, ...(person.companyNames ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [people, search]);

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">People directory</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-950 md:text-5xl">People behind the companies</h1>
        <p className="mt-4 leading-7 text-zinc-600">Explore founders, executives and business leaders covered by MisterStory.</p>
      </div>

      <div className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4 md:p-6">
        <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm focus-within:border-zinc-400">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search people</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by person, role or company" className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400" />
        </label>

        {visiblePeople.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePeople.map((person) => (
              <PersonCard key={person._id} person={person} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-10 text-center text-sm text-zinc-500">No people match your search.</div>
        )}
      </div>
    </section>
  );
}
