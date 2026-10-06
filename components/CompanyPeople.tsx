import Link from "next/link";

export type CompanyPersonCard = {
  id: string;
  name: string;
  slug?: string;
  roleTitles?: string[];
  notes?: string[];
};

type CompanyPeopleProps = {
  people: CompanyPersonCard[];
  initialCount?: number;
};

function PersonCard({ person }: { person: CompanyPersonCard }) {
  const content = (
    <>
      <h3 className="text-lg font-semibold">{person.name}</h3>
      {!!person.roleTitles?.length && (
        <p className="mt-1 text-sm font-medium text-amber-700">
          {person.roleTitles.join(" · ")}
        </p>
      )}
      {person.notes?.map((note) => (
        <p key={note} className="mt-3 text-sm leading-6 text-zinc-600">
          {note}
        </p>
      ))}
      {person.slug && (
        <p className="mt-4 text-sm font-semibold text-amber-700">View profile →</p>
      )}
    </>
  );

  return person.slug ? (
    <Link
      href={`/people/${person.slug}`}
      className="rounded-2xl border border-zinc-200 p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
    >
      {content}
    </Link>
  ) : (
    <article className="rounded-2xl border border-zinc-200 p-5">{content}</article>
  );
}

export default function CompanyPeople({ people, initialCount = 4 }: CompanyPeopleProps) {
  const visiblePeople = people.slice(0, initialCount);
  const remainingPeople = people.slice(initialCount);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {visiblePeople.map((person) => (
          <PersonCard key={person.id} person={person} />
        ))}
      </div>

      {!!remainingPeople.length && (
        <details className="group mt-5">
          <summary className="inline-flex cursor-pointer list-none rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-amber-400 hover:bg-amber-50">
            <span className="group-open:hidden">View all {people.length} people ↓</span>
            <span className="hidden group-open:inline">Show fewer people ↑</span>
          </summary>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {remainingPeople.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        </details>
      )}
    </>
  );
}
