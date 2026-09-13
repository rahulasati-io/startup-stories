const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = (configuredSiteUrl || "https://misterstory.in").replace(
  /\/$/,
  "",
);

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
