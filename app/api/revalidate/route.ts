import {revalidatePath, revalidateTag} from "next/cache";
import {PROFILE_CACHE_TAG} from "@/lib/profile-cache";
import {contentCacheTag, KNOWN_CONTENT_TYPES} from "@/lib/content-cache";
import {type NextRequest, NextResponse} from "next/server";
import {parseBody} from "next-sanity/webhook";

type SanityWebhookBody = {
  _type?: string;
  slug?: string | null;
};

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;

  if (!secret) {
    return NextResponse.json(
      {ok: false, error: "Revalidation is not configured"},
      {status: 503},
    );
  }

  if (!request.headers.get("sanity-webhook-signature")) {
    return NextResponse.json(
      {ok: false, error: "Missing webhook signature"},
      {status: 401},
    );
  }

  try {
    // Signature validation prevents anyone except Sanity from clearing the cache.
    // The consistency wait ensures the published document is queryable before refresh.
    const {body, isValidSignature} = await parseBody<SanityWebhookBody>(
      request,
      secret,
      true,
    );

    if (!isValidSignature) {
      return NextResponse.json(
        {ok: false, error: "Invalid webhook signature"},
        {status: 401},
      );
    }

    const type = body?._type;
    if (type && KNOWN_CONTENT_TYPES.has(type)) {
      // Every manual public read carries its document-type dependencies. This
      // also handles deletes, old slugs and empty/missing cached query results.
      revalidateTag(contentCacheTag(type), {expire: 0});
    } else {
      // Preserve compatibility with older/minimal webhook projections. Never
      // silently acknowledge a new content type without refreshing its pages.
      revalidateTag(PROFILE_CACHE_TAG, {expire: 0});
      revalidatePath("/", "layout");
    }

    return NextResponse.json({
      ok: true,
      revalidated: body?._type || "content",
      slug: body?.slug || null,
    });
  } catch (error) {
    console.error("Sanity revalidation failed", error);
    return NextResponse.json(
      {ok: false, error: "Revalidation failed"},
      {status: 500},
    );
  }
}
