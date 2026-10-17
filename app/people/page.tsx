import type {Metadata} from "next";
import PersonDirectory from "@/components/PersonDirectory";
import type {DirectoryPerson} from "@/components/PersonDirectory";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Newsletter from "@/components/Newsletter";
import {directoryMetadata, getPublicDirectory} from "@/lib/public-directories";
import type {DirectoryParams} from "@/lib/directory-pagination";

type Props = {searchParams: Promise<DirectoryParams>};

export async function generateMetadata({searchParams}: Props): Promise<Metadata> {
  return directoryMetadata("people", await searchParams, "People | MisterStory", "Explore founders, executives and the people behind companies covered by MisterStory.");
}

export default async function DirectoryPage({searchParams}: Props) {
  const {items, pagination} = await getPublicDirectory<DirectoryPerson>("people", await searchParams);
  return <><Header /><main className="bg-[#f7f6f2]"><PersonDirectory people={items} pagination={pagination} /><Newsletter /></main><Footer /></>;
}
