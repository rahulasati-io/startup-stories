import Link from "next/link";
import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

const FOOTER_COMPANIES_QUERY = defineQuery(/* groq */ `
  *[_type == "company" && defined(slug.current)] | order(name asc) [0...8] {
    _id,
    name,
    "slug": slug.current
  }
`);

type FooterCompany = { _id: string; name?: string; slug?: string };

export default async function Footer() {
  let companies: FooterCompany[] = [];
  try {
    const result = await sanityFetch({ query: FOOTER_COMPANIES_QUERY });
    companies = (result.data ?? []) as FooterCompany[];
  } catch {
    // Core navigation and legal information should remain available if Sanity is briefly unreachable.
  }
  const uniqueCompanies = Array.from(
    companies.reduce((items, company) => {
      const key = company.slug?.toLowerCase();
      if (key && company.name && (!items.has(key) || company.slug === key)) items.set(key, company);
      return items;
    }, new Map<string, FooterCompany>()).values(),
  ).slice(0, 6);

  return (
    <footer className="bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 md:grid-cols-4 md:px-8 md:py-16">
        <div>
          <Link href="/" className="text-2xl font-extrabold tracking-tight">MisterStory</Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
            Stories, strategies and numbers that explain how interesting businesses work.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Explore</h2>
          <nav className="mt-4 space-y-3 text-sm text-zinc-300" aria-label="Footer navigation">
            <Link href="/" className="block hover:text-white">Home</Link>
            <Link href="/companies" className="block hover:text-white">Explore Companies</Link>
            <Link href="/people" className="block hover:text-white">Explore People</Link>
            <Link href="/articles" className="block hover:text-white">All Articles</Link>
            <Link href="/topics/business-model" className="block hover:text-white">Business Models</Link>
            <Link href="/topics/strategy" className="block hover:text-white">Strategies</Link>
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">MisterStory</h2>
          <nav className="mt-4 space-y-3 text-sm text-zinc-300" aria-label="About and legal navigation">
            <Link href="/about" className="block hover:text-white">About</Link>
            <Link href="/editorial-policy" className="block hover:text-white">Editorial Policy</Link>
            <Link href="/contact" className="block hover:text-white">Contact</Link>
            <Link href="/privacy" className="block hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="block hover:text-white">Terms of Use</Link>
          </nav>
        </div>

        {uniqueCompanies.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Popular Companies</h2>
            <nav className="mt-4 space-y-3 text-sm text-zinc-300" aria-label="Popular companies">
              {uniqueCompanies.map((company) => (
                <Link key={company._id} href={`/companies/${company.slug}`} className="block hover:text-white">
                  {company.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 px-5 py-5 text-center text-xs text-zinc-500">
        © 2026 MisterStory. General information only; not investment advice.
      </div>
    </footer>
  );
}
