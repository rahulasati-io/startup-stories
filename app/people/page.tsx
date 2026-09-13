import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Newsletter from "@/components/Newsletter";
import PersonDirectory, { type DirectoryPerson } from "@/components/PersonDirectory";
import { PEOPLE_DIRECTORY_QUERY } from "@/components/PeopleRow";
import { client } from "@/sanity/lib/client";

export const metadata: Metadata = {
  title: "People | MisterStory",
  description: "Explore founders, executives and the people behind companies covered by MisterStory.",
};

export default async function PeoplePage() {
  const people = await client.fetch<DirectoryPerson[]>(PEOPLE_DIRECTORY_QUERY, {}, { cache: "no-store" });
  return <><Header /><main className="bg-[#f7f6f2]"><PersonDirectory people={people} /><Newsletter /></main><Footer /></>;
}
