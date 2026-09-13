import Link from "next/link";
import PersonCard from "@/components/PersonCard";
import type { DirectoryPerson } from "@/components/PersonDirectory";
import { client } from "@/sanity/lib/client";

export const PEOPLE_DIRECTORY_QUERY = `*[_type == "founder" && defined(name) && defined(slug.current)] | order(name asc){
  _id,
  name,
  "slug": slug.current,
  role,
  "photoUrl": photo.asset->url,
  "photoAlt": coalesce(photo.alt, name),
  "companyNames": *[_type == "companyPersonRole" && person._ref == ^._id && defined(company->name)].company->name
}`;

export default async function PeopleRow({ excludeSlug }: { excludeSlug?: string }) {
  const people = await client.fetch<DirectoryPerson[]>(PEOPLE_DIRECTORY_QUERY, {}, { cache: "no-store" });
  const visiblePeople = people.filter((person) => person.slug !== excludeSlug).slice(0, 6);
  if (!visiblePeople.length) return null;

  return (
    <section className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Continue exploring</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">Also know about these people</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">Discover more founders, executives and business leaders.</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePeople.map((person) => <PersonCard key={person._id} person={person} />)}
        </div>
        <div className="mt-7 text-center">
          <Link href="/people" className="inline-flex rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-zinc-800">View all people →</Link>
        </div>
      </div>
    </section>
  );
}
