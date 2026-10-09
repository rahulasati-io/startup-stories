import {revalidatePath} from "next/cache";
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

    // A company, person, article, author or category can affect several directories,
    // cards and relationship sections. Refreshing the root layout keeps them in sync.
    revalidatePath("/", "layout");

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
