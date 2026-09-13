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
    foundedYear,
    description,
    "logoUrl": logo.asset->url,
    "logoAlt": coalesce(logo.alt, name + " logo")
  }
`);

type CompanyRowProps = {
  excludeSlug?: string;
  title?: string;
  description?: string;
  companies?: Company[];
};

export default async function CompanyRow({ excludeSlug, title, description, companies: suppliedCompanies }: CompanyRowProps = {}) {
  let companies = suppliedCompanies;
  if (!companies) {
    try {
      companies = await client.fetch<Company[]>(COMPANIES_QUERY, {}, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    } catch {
      companies = [];
    }
  }

  return <CompanyDirectory companies={companies} excludeSlug={excludeSlug} title={title} description={description} previewLimit={6} showViewAll />;
}
