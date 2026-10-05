import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";
import {
  misterStoryOrganizationJsonLd,
  misterStoryWebsiteJsonLd,
} from "@/lib/structured-data";
import { SanityLive } from "@/sanity/lib/live";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MisterStory",
  description:
    "Stories, strategy and numbers that explain how interesting businesses work.",
  alternates: {
    types: {
      "application/rss+xml": absoluteUrl("/feed.xml"),
    },
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <JsonLd
          data={[
            misterStoryOrganizationJsonLd(),
            misterStoryWebsiteJsonLd(),
          ]}
        />
        {children}
        <SanityLive />
        <Analytics />
      </body>
    </html>
  );
}
