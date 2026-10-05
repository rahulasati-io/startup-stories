import {absoluteUrl} from "@/lib/site-url";
import {createSitemapIndexResponse} from "@/lib/sitemap-xml";

export const revalidate = 3600;

export function GET() {
  return createSitemapIndexResponse([
    absoluteUrl("/sitemaps/pages.xml"),
    absoluteUrl("/sitemaps/companies.xml"),
    absoluteUrl("/sitemaps/articles.xml"),
    absoluteUrl("/sitemaps/people.xml"),
    absoluteUrl("/sitemaps/authors-topics.xml"),
  ]);
}
