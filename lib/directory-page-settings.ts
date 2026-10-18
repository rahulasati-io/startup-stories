import "server-only";
import {cache} from "react";
import type {Metadata} from "next";
import {defineQuery} from "next-sanity";
import {client} from "@/sanity/lib/client";
import {resolveDirectorySettings, type DirectoryPageKind, type DirectoryPageSettings} from "@/lib/directory-page-config";
import {absoluteUrl} from "@/lib/site-url";

export const DIRECTORY_PAGE_SETTINGS_QUERY = defineQuery(/* groq */ `*[_type == "directoryPageSettings" && _id == $id][0]{
  seoTitle, seoDescription, title, description, eyebrow, searchPlaceholder,
  "socialImageUrl": socialImage.asset->url,
  sections[]{_key, kind, enabled, title, description, eyebrow, href, linkLabel,
    links[]{_key, title, description, href, action}, "articleIds": articles[]._ref}
}`);

export const getDirectoryPageSettings = cache(async (kind: DirectoryPageKind) => {
  try {
    const value = await client.fetch<Partial<DirectoryPageSettings> | null>(DIRECTORY_PAGE_SETTINGS_QUERY, {id: `directoryPageSettings-${kind}`}, {perspective: "published", stega: false, next: {revalidate: 60}, signal: AbortSignal.timeout(6000)});
    return resolveDirectorySettings(kind, value);
  } catch {
    return resolveDirectorySettings(kind);
  }
});

export function directorySharing(kind: DirectoryPageKind, settings: DirectoryPageSettings): Pick<Metadata, "openGraph" | "twitter"> {
  const title = settings.seoTitle, description = settings.seoDescription;
  const images = settings.socialImageUrl ? [{url: settings.socialImageUrl}] : undefined;
  return {
    openGraph: {title, description, url: absoluteUrl(`/${kind}`), type: "website", siteName: "MisterStory", ...(images ? {images} : {})},
    twitter: {card: "summary_large_image", title, description, ...(images ? {images: images.map(image => image.url)} : {})},
  };
}
