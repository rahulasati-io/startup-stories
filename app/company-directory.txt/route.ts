import {getCompanyDirectoryText} from "@/lib/ai-content-directory";

export const revalidate = 3600;

export async function GET() {
  try {
    return new Response(await getCompanyDirectoryText(), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("AI company directory generation failed", error);
    return new Response("Company directory temporarily unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "300",
      },
    });
  }
}

