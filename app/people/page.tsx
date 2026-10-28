import type {Metadata} from "next";
import PersonDirectory, {type DirectoryPerson} from "@/components/PersonDirectory";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DirectoryPageLayout from "@/components/DirectoryPageLayout";
import DirectoryBreadcrumbs from "@/components/DirectoryBreadcrumbs";
import {directoryMetadata, getPublicDirectory} from "@/lib/public-directories";
import {getDirectoryPageSettings, directorySharing} from "@/lib/directory-page-settings";
import type {DirectoryParams} from "@/lib/directory-pagination";

type Props = {searchParams: Promise<DirectoryParams>};

export async function generateMetadata({searchParams}: Props): Promise<Metadata> {
  const settings = await getDirectoryPageSettings("people");
  return {...directoryMetadata("people", await searchParams, settings.seoTitle, settings.seoDescription), ...directorySharing("people", settings)};
}

export default async function DirectoryPage({searchParams}: Props) {
  const [{items, pagination}, settings] = await Promise.all([
    getPublicDirectory<DirectoryPerson>("people", await searchParams),
    getDirectoryPageSettings("people"),
  ]);
  return <><Header /><DirectoryPageLayout settings={settings} breadcrumb={<DirectoryBreadcrumbs label="People" path="/people" pagination={pagination} />}>
    <PersonDirectory people={items} pagination={pagination} title={settings.title} eyebrow={settings.eyebrow} description={settings.description} searchPlaceholder={settings.searchPlaceholder} />
  </DirectoryPageLayout><Footer /></>;
}
