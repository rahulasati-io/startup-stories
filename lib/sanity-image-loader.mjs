"use client";

// Let browsers fetch responsive variants directly from Sanity. This avoids the
// Next.js server image proxy and its earlier DNS/NAT64 failures.
export default function sanityImageLoader({src, width, quality}) {
  if (!src.startsWith("https://cdn.sanity.io/images/")) return src;

  const url = new URL(src);
  const previousWidth = Number(url.searchParams.get("w"));
  const previousHeight = Number(url.searchParams.get("h"));
  const targetWidth = Math.max(1, Math.round(width));
  url.searchParams.set("w", String(targetWidth));

  // Retain the existing crop's aspect ratio when producing a smaller variant.
  if (previousHeight && previousWidth) {
    url.searchParams.set("h", String(Math.max(1, Math.round(targetWidth * previousHeight / previousWidth))));
  }
  if (!url.searchParams.has("fit")) {
    url.searchParams.set("fit", previousHeight ? "min" : "max");
  }
  url.searchParams.set("auto", "format");
  url.searchParams.set("q", String(quality ?? 75));
  return url.href;
}
