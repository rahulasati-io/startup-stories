import type {Metadata} from "next";
import ArticleDirectory from "@/components/ArticleDirectory";
import type {ArticleCardData} from "@/lib/article-card-data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DirectoryPageLayout from "@/components/DirectoryPageLayout";
import {directoryMetadata, getPublicDirectory} from "@/lib/public-directories";
import {getDirectoryPageSettings, directorySharing} from "@/lib/directory-page-settings";
import type {DirectoryParams} from "@/lib/directory-pagination";

type Props = {searchParams: Promise<DirectoryParams>};

export async function generateMetadata({searchParams}: Props): Promise<Metadata> {
  const settings = await getDirectoryPageSettings("articles");
  return {...directoryMetadata("articles", await searchParams, settings.seoTitle, settings.seoDescription), ...directorySharing("articles", settings)};
}

export default async function DirectoryPage({searchParams}: Props) {
  const [{items, pagination}, settings] = await Promise.all([
    getPublicDirectory<ArticleCardData>("articles", await searchParams),
    getDirectoryPageSettings("articles"),
  ]);
  return <><Header /><DirectoryPageLayout settings={settings}>
    <ArticleDirectory articles={items} pagination={pagination} title={settings.title} eyebrow={settings.eyebrow} description={settings.description} searchPlaceholder={settings.searchPlaceholder} />
  </DirectoryPageLayout><Footer /></>;
}
