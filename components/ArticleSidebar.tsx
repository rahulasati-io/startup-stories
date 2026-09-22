import Link from "next/link";
import Newsletter from "@/components/Newsletter";
import { articleHref, type ArticleCardData } from "@/lib/article-card-data";

export type SidebarCompany = {
  _id: string;
  name: string;
  slug: string;
  industry?: string;
  description?: string;
};

export type SidebarPerson = {
  _id: string;
  name: string;
  role?: string;
  slug?: string;
};

function ArticleLinks({ articles }: { articles: ArticleCardData[] }) {
  return (
    <ol className="divide-y divide-zinc-200">
      {articles.map((item) => (
        <li key={item._id} className="py-3 first:pt-0 last:pb-0">
          <Link href={articleHref(item)} className="group block">
            <span className="block text-sm font-semibold leading-5 text-zinc-900 group-hover:text-amber-800">
              {item.title}
            </span>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
              {item.category}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default function ArticleSidebar({
  companies,
  recentArticles,
  relatedCompanies,
  people,
  popularArticles,
}: {
  companies: SidebarCompany[];
  recentArticles: ArticleCardData[];
  relatedCompanies: SidebarCompany[];
  people: SidebarPerson[];
  popularArticles: ArticleCardData[];
}) {
  return (
    <aside className="space-y-5" aria-label="Explore more from MisterStory">
      {companies.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
            {companies.length === 1 ? "Company discussed" : "Companies discussed"}
          </p>
          <div className="mt-3 space-y-4">
            {companies.map((company) => (
              <div key={company._id}>
                <Link href={`/companies/${company.slug}`} className="text-lg font-bold text-zinc-950 hover:text-amber-800">
                  {company.name}
                </Link>
                {company.industry && <p className="mt-1 text-xs font-semibold text-zinc-500">{company.industry}</p>}
                {company.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{company.description}</p>}
                <Link href={`/companies/${company.slug}`} className="mt-3 inline-block text-sm font-semibold text-zinc-900 hover:text-amber-800">
                  View company profile →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <Newsletter compact />

      {recentArticles.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold tracking-tight text-zinc-950">Recent articles</h2>
          <ArticleLinks articles={recentArticles} />
          <Link href="/articles" className="mt-4 inline-block text-sm font-semibold text-zinc-900 hover:text-amber-800">
            View all articles →
          </Link>
        </section>
      )}

      {relatedCompanies.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-1 text-lg font-bold tracking-tight text-zinc-950">Related companies</h2>
          <ul className="divide-y divide-zinc-200">
            {relatedCompanies.map((company) => (
              <li key={company._id} className="py-3 last:pb-0">
                <Link href={`/companies/${company.slug}`} className="group block">
                  <span className="block text-sm font-semibold text-zinc-900 group-hover:text-amber-800">{company.name}</span>
                  {company.industry && <span className="mt-1 block text-xs text-zinc-500">{company.industry}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {people.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-1 text-lg font-bold tracking-tight text-zinc-950">Related people</h2>
          <ul className="divide-y divide-zinc-200">
            {people.map((person) => (
              <li key={person._id} className="py-3 last:pb-0">
                {person.slug ? (
                  <Link href={`/people/${person.slug}`} className="group block">
                    <span className="block text-sm font-semibold text-zinc-900 group-hover:text-amber-800">{person.name}</span>
                    {person.role && <span className="mt-1 block text-xs text-zinc-500">{person.role}</span>}
                  </Link>
                ) : (
                  <div>
                    <span className="block text-sm font-semibold text-zinc-900">{person.name}</span>
                    {person.role && <span className="mt-1 block text-xs text-zinc-500">{person.role}</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {popularArticles.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold tracking-tight text-zinc-950">Popular articles</h2>
          <ArticleLinks articles={popularArticles} />
        </section>
      )}
    </aside>
  );
}
