import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/studio/", "/api/search", "/api/newsletter"],
    },
    sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/feed.xml")],
    host: SITE_URL,
  };
}
