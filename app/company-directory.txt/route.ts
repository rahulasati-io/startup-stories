import {getCompanyDirectoryText} from "@/lib/ai-content-directory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return new Response(await getCompanyDirectoryText(), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
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
