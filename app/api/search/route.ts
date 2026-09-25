import { NextResponse, type NextRequest } from "next/server";
import { EMPTY_SEARCH_RESULTS, GLOBAL_SEARCH_QUERY, toSearchMatch, type GlobalSearchResults } from "@/lib/global-search";
import { client } from "@/sanity/lib/client";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) || "";
  if (query.length < 2) return NextResponse.json(EMPTY_SEARCH_RESULTS);

  try {
    const results = await client.fetch<GlobalSearchResults>(
      GLOBAL_SEARCH_QUERY,
      { search: toSearchMatch(query) },
      { perspective: "published", cache: "no-store", signal: AbortSignal.timeout(5000) },
    );
    return NextResponse.json(results, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
  } catch (error) {
    console.error("Global search request failed", error);
    return NextResponse.json({ ...EMPTY_SEARCH_RESULTS, error: "Search is temporarily unavailable." }, { status: 503 });
  }
}
