import {getContentSitemap} from "@/lib/sitemap-data";
import {createSitemapErrorResponse, createSitemapResponse} from "@/lib/sitemap-xml";

export const revalidate = 3600;

export async function GET() {
  try {
    return createSitemapResponse(await getContentSitemap(["founder"]));
  } catch (error) {
    console.error("People sitemap generation failed", error);
    return createSitemapErrorResponse();
  }
}
