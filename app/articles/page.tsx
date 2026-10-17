import type {Metadata} from "next";
import ArticleDirectory from "@/components/ArticleDirectory";
import type {ArticleCardData} from "@/lib/article-card-data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Newsletter from "@/components/Newsletter";
import {directoryMetadata, getPublicDirectory} from "@/lib/public-directories";
import type {DirectoryParams} from "@/lib/directory-pagination";

type Props = {searchParams: Promise<DirectoryParams>};

export async function generateMetadata({searchParams}: Props): Promise<Metadata> {
  return directoryMetadata("articles", await searchParams, "Business Articles | MisterStory", "Explore business models, company strategies, founder stories and detailed business analysis from MisterStory.");
}

export default async function DirectoryPage({searchParams}: Props) {
  const {items, pagination} = await getPublicDirectory<ArticleCardData>("articles", await searchParams);
  return <><Header /><main className="bg-[#f7f6f2]"><ArticleDirectory articles={items} pagination={pagination} /><Newsletter /></main><Footer /></>;
}
