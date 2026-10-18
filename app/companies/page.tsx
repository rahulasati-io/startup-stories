import type {Metadata} from "next";
import CompanyDirectory, {type Company} from "@/components/CompanyDirectory";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DirectoryPageLayout from "@/components/DirectoryPageLayout";
import {directoryMetadata, getPublicDirectory} from "@/lib/public-directories";
import {getDirectoryPageSettings, directorySharing} from "@/lib/directory-page-settings";
import type {DirectoryParams} from "@/lib/directory-pagination";

type Props = {searchParams: Promise<DirectoryParams>};

export async function generateMetadata({searchParams}: Props): Promise<Metadata> {
  const settings = await getDirectoryPageSettings("companies");
  return {...directoryMetadata("companies", await searchParams, settings.seoTitle, settings.seoDescription), ...directorySharing("companies", settings)};
}

export default async function DirectoryPage({searchParams}: Props) {
  const [{items, pagination}, settings] = await Promise.all([
    getPublicDirectory<Company>("companies", await searchParams),
    getDirectoryPageSettings("companies"),
  ]);
  return <><Header /><DirectoryPageLayout settings={settings}>
    <CompanyDirectory companies={items} pagination={pagination} title={settings.title} eyebrow={settings.eyebrow} description={settings.description} searchPlaceholder={settings.searchPlaceholder} />
  </DirectoryPageLayout><Footer /></>;
}
