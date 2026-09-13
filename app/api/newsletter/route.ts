const KIT_API_BASE_URL = "https://api.kit.com/v4";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

type Attempt = { count: number; expiresAt: number };

const attempts = new Map<string, Attempt>();

function json(message: string, status: number) {
  return Response.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function getClientAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(address: string) {
  const now = Date.now();
  const current = attempts.get(address);

  if (!current || current.expiresAt <= now) {
    attempts.set(address, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_ATTEMPTS;
}

function safeReferrer(value: unknown, fallback: string | null) {
  const candidate = typeof value === "string" ? value : fallback;

  if (!candidate || candidate.length > 2048) return null;

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

async function kitRequest(path: string, apiKey: string, body: object) {
  return fetch(`${KIT_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json("Please enter a valid email address.", 400);
  }

  // Bots commonly fill this hidden field. Return a neutral success response so
  // they cannot use the endpoint's response to adapt their submissions.
  if (typeof body.website === "string" && body.website.trim()) {
    return json("You're subscribed. Welcome aboard!", 200);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return json("Please enter a valid email address.", 400);
  }

  if (isRateLimited(getClientAddress(request))) {
    return json("Too many attempts. Please try again in a few minutes.", 429);
  }

  const apiKey = process.env.KIT_API_KEY;
  const formId = process.env.KIT_FORM_ID;

  if (!apiKey || !formId || !/^\d+$/.test(formId)) {
    return json("Newsletter signup is temporarily unavailable.", 503);
  }

  const referrer = safeReferrer(body.referrer, request.headers.get("referer"));

  try {
    const subscriberResponse = await kitRequest("/subscribers", apiKey, {
      email_address: email,
    });

    if (!subscriberResponse.ok) {
      return json("We couldn't complete your signup. Please try again.", 502);
    }

    const formResponse = await kitRequest(
      `/forms/${encodeURIComponent(formId)}/subscribers`,
      apiKey,
      { email_address: email, referrer },
    );

    if (!formResponse.ok) {
      return json("We couldn't complete your signup. Please try again.", 502);
    }

    return json("You're subscribed. Please check your inbox.", 200);
  } catch {
    return json("Newsletter signup is temporarily unavailable.", 502);
  }
}
