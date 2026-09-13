import type { Metadata } from "next";
import CompanyDirectory, { type Company } from "@/components/CompanyDirectory";
import { COMPANIES_QUERY } from "@/components/CompanyRow";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Newsletter from "@/components/Newsletter";
import { client } from "@/sanity/lib/client";

export const metadata: Metadata = {
  title: "Companies | MisterStory",
  description: "Explore company profiles, business models, strategies, founders and key numbers.",
};

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const query = (await searchParams).q;
  const initialSearch = Array.isArray(query) ? query[0] : query || "";
  const companies = await client.fetch<Company[]>(COMPANIES_QUERY, {}, { cache: "no-store" });
  return <><Header /><main className="bg-[#f7f6f2]"><CompanyDirectory companies={companies} title="All Companies" description="Search the complete MisterStory company directory by name or industry." initialSearch={initialSearch} /><Newsletter /></main><Footer /></>;
}
