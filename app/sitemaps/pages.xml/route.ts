import {getStaticSitemap} from "@/lib/sitemap-data";
import {createSitemapResponse} from "@/lib/sitemap-xml";

export const revalidate = 3600;

export function GET() {
  return createSitemapResponse(getStaticSitemap());
}
