import {getContentSitemap} from "@/lib/sitemap-data";
import {createSitemapErrorResponse, createSitemapResponse} from "@/lib/sitemap-xml";

export const revalidate = 3600;

export async function GET() {
  try {
    return createSitemapResponse(await getContentSitemap(["author", "category"]));
  } catch (error) {
    console.error("Author and topic sitemap generation failed", error);
    return createSitemapErrorResponse();
  }
}
