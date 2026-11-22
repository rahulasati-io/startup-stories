// Fetch 20 recent candidates so excluding up to 10 popular articles still fills 10 slots.
export function selectRecentSidebarArticles<T extends {_id: string}>(
  candidates: T[],
  popularArticles: {_id: string}[],
): T[] {
  const popularIds = new Set(popularArticles.map((article) => article._id));
  return candidates.filter((article) => !popularIds.has(article._id)).slice(0, 10);
}
