import Image from "next/image";
import Link from "next/link";
import type { DirectoryPerson } from "@/components/PersonDirectory";

export default function PersonCard({ person }: { person: DirectoryPerson }) {
  return (
    <Link href={`/people/${person.slug}`} className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
          {person.photoUrl ? <Image src={person.photoUrl} alt={person.photoAlt || person.name} width={128} height={128} className="h-full w-full object-cover" /> : <span className="text-xl font-bold text-zinc-500">{person.name.charAt(0)}</span>}
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-zinc-950 group-hover:text-amber-800">{person.name}</h2>
          {person.role && <p className="mt-1 text-sm text-zinc-600">{person.role}</p>}
        </div>
      </div>
      {person.companyNames?.length ? <p className="mt-4 text-xs font-medium text-zinc-500">{person.companyNames.join(" · ")}</p> : null}
      <p className="mt-4 text-sm font-semibold text-amber-700">View profile →</p>
    </Link>
  );
}
