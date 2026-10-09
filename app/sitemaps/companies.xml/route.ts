import {getContentSitemap} from "@/lib/sitemap-data";
import {createSitemapErrorResponse, createSitemapResponse} from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return createSitemapResponse(await getContentSitemap(["company"]));
  } catch (error) {
    console.error("Company sitemap generation failed", error);
    return createSitemapErrorResponse();
  }
}
