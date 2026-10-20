import { defineQuery } from "next-sanity";
import { client } from "@/sanity/lib/client";
import CompanyDirectory from "@/components/CompanyDirectory";
import type { Company } from "@/components/CompanyDirectory";

export const COMPANIES_QUERY = defineQuery(/* groq */ `
  *[_type == "company" && defined(name) && defined(slug.current)]
  | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    "industry": coalesce(industryCategory->name, industry),
    subIndustry,
    foundedYear,
    description
  }
`);

type CompanyRowProps = {
  excludeSlug?: string;
  title?: string;
  description?: string;
  companies?: Company[];
  eyebrow?: string;
  limit?: number;
  href?: string;
  linkLabel?: string;
};

export default async function CompanyRow({ excludeSlug, title, description, companies: suppliedCompanies, eyebrow, limit = 6, href, linkLabel }: CompanyRowProps = {}) {
  let companies = suppliedCompanies;
  if (!companies) {
    try {
      companies = await client.fetch<Company[]>(COMPANIES_QUERY, {}, { perspective: "published", next: { revalidate: 60 }, signal: AbortSignal.timeout(6000) });
    } catch {
      companies = [];
    }
  }

  return <CompanyDirectory companies={companies} excludeSlug={excludeSlug} title={title} description={description} previewLimit={limit} showViewAll headingLevel="h2" eyebrow={eyebrow} viewAllHref={href} viewAllLabel={linkLabel} />;
}
