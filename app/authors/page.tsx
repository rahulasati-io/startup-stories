import type { Metadata } from "next";
import { defineQuery } from "next-sanity";
import AuthorDirectory, { type DirectoryAuthor } from "@/components/AuthorDirectory";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import DirectoryPageLayout from "@/components/DirectoryPageLayout";
import {getDirectoryPageSettings, directorySharing} from "@/lib/directory-page-settings";
import { absoluteUrl } from "@/lib/site-url";
import { client } from "@/sanity/lib/client";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getDirectoryPageSettings("authors");
  return {title: settings.seoTitle, description: settings.seoDescription, alternates: {canonical: absoluteUrl("/authors")}, ...directorySharing("authors", settings)};
}

const AUTHORS_QUERY = defineQuery(/* groq */ `
  *[_type == "author" && defined(name) && defined(slug.current)] {
    _id,
    name,
    "slug": slug.current,
    role,
    education,
    experience,
    "articleCount": count(*[
      _type == "post" &&
      author._ref == ^._id &&
      !(_id in path("drafts.**")) &&
      defined(slug.current)
    ])
  } | order(articleCount desc, name asc)
`);

export default async function AuthorsPage() {
  const [authors, settings] = await Promise.all([client.fetch<DirectoryAuthor[]>(AUTHORS_QUERY, {}, { perspective: "published", next: { revalidate: 60 } }), getDirectoryPageSettings("authors")]);
  return <><Header /><DirectoryPageLayout settings={settings}><AuthorDirectory authors={authors} title={settings.title} eyebrow={settings.eyebrow} description={settings.description} searchPlaceholder={settings.searchPlaceholder} /></DirectoryPageLayout><Footer /></>;
}
