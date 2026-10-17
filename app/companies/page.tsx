import type {Metadata} from "next";
import CompanyDirectory from "@/components/CompanyDirectory";
import type {Company} from "@/components/CompanyDirectory";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Newsletter from "@/components/Newsletter";
import {directoryMetadata, getPublicDirectory} from "@/lib/public-directories";
import type {DirectoryParams} from "@/lib/directory-pagination";

type Props = {searchParams: Promise<DirectoryParams>};

export async function generateMetadata({searchParams}: Props): Promise<Metadata> {
  return directoryMetadata("companies", await searchParams, "Companies | MisterStory", "Explore company profiles, articles, people and key numbers.");
}

export default async function DirectoryPage({searchParams}: Props) {
  const {items, pagination} = await getPublicDirectory<Company>("companies", await searchParams);
  return <><Header /><main className="bg-[#f7f6f2]"><CompanyDirectory companies={items} title="All Companies" description="Search the complete MisterStory company directory by name or industry." pagination={pagination} /><Newsletter /></main><Footer /></>;
}
