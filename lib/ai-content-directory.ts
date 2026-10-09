import {defineQuery} from "next-sanity";
import {absoluteUrl} from "@/lib/site-url";
import {client} from "@/sanity/lib/client";

type DirectoryCompany = {
  name: string;
  slug: string;
  industry?: string | null;
};

const COMPANY_DIRECTORY_QUERY = defineQuery(/* groq */ `
  *[
    _type == "company" &&
    !(_id in path("drafts.**")) &&
    defined(name) &&
    defined(slug.current)
  ] | order(name asc) {
    name,
    "slug": slug.current,
    "industry": coalesce(industryCategory->name, industry)
  }
`);

function cleanLine(value?: string | null) {
  return value?.replace(/[\r\n|]+/g, " ").replace(/\s+/g, " ").trim() || "";
}

export async function getCompanyDirectoryText() {
  const companies = await client.fetch<DirectoryCompany[]>(
    COMPANY_DIRECTORY_QUERY,
    {},
    {perspective: "published", cache: "no-store"},
  );

  const entries = companies.map((company) => {
    const name = cleanLine(company.name);
    const industry = cleanLine(company.industry);
    const url = absoluteUrl(`/companies/${company.slug}`);
    return industry ? `${name} | ${url} | ${industry}` : `${name} | ${url}`;
  });

  return [
    "# MisterStory Company Directory",
    "# Format: Company name | Canonical company URL | Industry (when available)",
    "# Use only these URLs when linking to MisterStory company profiles.",
    `# Published companies: ${companies.length}`,
    "",
    ...entries,
    "",
  ].join("\n");
}
