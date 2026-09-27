import type { Metadata } from "next";
import { defineQuery } from "next-sanity";
import AuthorDirectory, { type DirectoryAuthor } from "@/components/AuthorDirectory";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Newsletter from "@/components/Newsletter";
import { absoluteUrl } from "@/lib/site-url";
import { client } from "@/sanity/lib/client";

export const metadata: Metadata = {
  title: "Authors | MisterStory",
  description: "Meet the authors researching and writing MisterStory's company analysis.",
  alternates: { canonical: absoluteUrl("/authors") },
};

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
  const authors = await client.fetch<DirectoryAuthor[]>(AUTHORS_QUERY, {}, { perspective: "published", cache: "no-store" });
  return <><Header /><main className="bg-[#f7f6f2]"><AuthorDirectory authors={authors} /><Newsletter /></main><Footer /></>;
}
