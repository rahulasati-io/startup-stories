// Keep the short time-based safety net even if a publishing webhook is missed.
// The signed webhook expires this tag after Sanity's consistency wait.
export const PROFILE_CACHE_TAG = "published-profiles";
export const PROFILE_FETCH_OPTIONS = {
  perspective: "published" as const,
  stega: false,
  cache: "force-cache" as const,
  next: { revalidate: 60, tags: [PROFILE_CACHE_TAG] },
};
