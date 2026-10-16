import Link from "next/link";
import { defineQuery } from "next-sanity";
import PersonCard from "@/components/PersonCard";
import type { DirectoryPerson } from "@/components/PersonDirectory";
import { client } from "@/sanity/lib/client";

export const PEOPLE_DIRECTORY_QUERY = defineQuery(/* groq */ `
  *[_type == "founder" && !(_id in path("drafts.**")) && defined(name) && defined(slug.current)]
  | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    role,
    "photoUrl": photo.asset->url,
    "photoAlt": coalesce(photo.alt, name),
    "companyNames": *[
      _type == "companyPersonRole" &&
      person._ref == ^._id &&
      defined(company._ref)
    ].company->name
  }
`);

const RELATED_PEOPLE_QUERY = defineQuery(/* groq */ `
  *[
    _type == "founder" &&
    !(_id in path("drafts.**")) &&
    defined(name) &&
    defined(slug.current) &&
    slug.current != $excludeSlug &&
    _id in *[
      _type == "companyPersonRole" &&
      company._ref in $companyIds &&
      defined(person._ref)
    ].person._ref
  ] | order(name asc)[0...6] {
    _id,
    name,
    "slug": slug.current,
    role,
    "photoUrl": photo.asset->url,
    "photoAlt": coalesce(photo.alt, name),
    "companyNames": *[
      _type == "companyPersonRole" &&
      person._ref == ^._id &&
      company._ref in $companyIds
    ].company->name
  }
`);

export default async function PeopleRow({
  excludeSlug,
  companyIds = [],
  companyNames = [],
}: {
  excludeSlug?: string;
  companyIds?: string[];
  companyNames?: string[];
}) {
  if (!companyIds.length) return null;

  const relatedPeople = await client.fetch<DirectoryPerson[]>(
    RELATED_PEOPLE_QUERY,
    { excludeSlug: excludeSlug || "", companyIds },
    { perspective: "published", next: { revalidate: 60 } },
  );
  const visiblePeople = relatedPeople.map((person) => ({
    ...person,
    companyNames: [...new Set(person.companyNames || [])],
  }));

  if (!visiblePeople.length) return null;
  const heading = companyNames.length === 1
    ? `Other leaders connected to ${companyNames[0]}`
    : "Other leaders connected to these companies";

  return (
    <section className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Related people</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">{heading}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">Explore founders, executives and business leaders associated with the same companies.</p>
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
