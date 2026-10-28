export type HomepageLink = {_key: string; title: string; description?: string; href: string; action?: string; categorySlug?: string; search?: string};
export type HomepageSection = {
  _key: string;
  kind: "featured" | "articles" | "explore" | "topics" | "companies" | "newsletter" | "text";
  enabled?: boolean;
  title?: string;
  eyebrow?: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  categorySlug?: string;
  excludeFunding?: boolean;
  limit?: number;
  articleIds?: string[];
  links?: HomepageLink[];
};

export const DEFAULT_HOME_SECTIONS: HomepageSection[] = [
  {_key: "featured", kind: "featured", enabled: true, eyebrow: "Editor's selection", title: "Featured Stories", href: "/articles", linkLabel: "View all"},
  {_key: "funding", kind: "articles", enabled: true, eyebrow: "Capital and ownership", title: "Funding & Deals", description: "Funding rounds, acquisitions, rights issues and the ownership moves shaping companies.", categorySlug: "funding-news", href: "/topics/funding-news", limit: 4},
  {_key: "business", kind: "articles", enabled: true, eyebrow: "Business models", title: "How Companies Make Money", description: "Clear breakdowns of the revenue engines, costs and economics behind interesting companies.", categorySlug: "business-model", href: "/topics/business-model", limit: 4},
  {_key: "latest", kind: "articles", enabled: true, eyebrow: "Fresh from MisterStory", title: "Latest Stories", href: "/articles", limit: 4},
  {_key: "explore", kind: "explore", enabled: true, eyebrow: "Explore MisterStory", title: "What do you want to explore?"},
  {_key: "topics", kind: "topics", enabled: true, eyebrow: "Explore by idea", title: "Topics worth following"},
  {_key: "companies", kind: "companies", enabled: true, eyebrow: "Company directory", title: "Explore Companies", description: "Find company profiles, articles, people and key numbers.", href: "/companies", linkLabel: "View all companies", limit: 6},
  {_key: "newsletter", kind: "newsletter", enabled: true, title: "Get MisterStory in your inbox", description: "Subscribe for business stories, company analysis and funding updates.", linkLabel: "Subscribe"},
];

export const DEFAULT_HOME_TITLE = "MisterStory: Business News, Startup Funding and Company Analysis";
export const DEFAULT_HOME_DESCRIPTION = "Explore Indian business news, startup funding, company financials and clear breakdowns of how businesses make money.";
export const DEFAULT_HOME_HEADING = "Company News & Business Stories";

export function resolveHomepageSeo(settings?: {seoTitle?: string | null; seoDescription?: string | null} | null) {
  const title = settings?.seoTitle?.trim();
  const description = settings?.seoDescription?.trim();
  // Existing Sanity documents can still contain the previous standard defaults.
  // Replace only those exact values, leaving future custom SEO copy editable.
  const legacyTitles = [
    "MisterStory — Company News, Financials & Business Stories",
    "MisterStory: Company News, Financials & Business Stories",
  ];
  return {
    title: !title || legacyTitles.includes(title) ? DEFAULT_HOME_TITLE : title,
    description: !description || description === "Understand companies through business news, financial results, funding updates and clear explanations of how they make money."
      ? DEFAULT_HOME_DESCRIPTION : description,
  };
}

export function selectFeaturedHomepageArticles<T extends {_id:string}>(articles:T[], settings:{featuredArticleId?:string|null; secondFeaturedArticleId?:string|null; supportingFeaturedArticleIds?:string[]}|null|undefined):T[]{
  // New uploads never replace configured picks. The legacy second highlight
  // fills a spare side slot only; its stored selection is not removed.
  const ids=[...new Set([settings?.featuredArticleId,...(settings?.supportingFeaturedArticleIds||[]),settings?.secondFeaturedArticleId].filter((id):id is string=>Boolean(id)))];
  if(!ids.length)return articles.slice(0,5);
  const byId=new Map(articles.map(article=>[article._id,article]));
  return ids.flatMap(id=>byId.get(id)?[byId.get(id)!]:[]).slice(0,5);
}

// Only relative, same-site links are accepted, even for API-written settings.
export function homepageHref(value: string | undefined, fallback: string) {
  return value && /^\/(?!\/)/.test(value) && !/[\\\s\u0000-\u001f]/.test(value) ? value : fallback;
}

export function homepageSections(value: HomepageSection[] | null | undefined) {
  return (value ?? DEFAULT_HOME_SECTIONS).filter((section) => section.enabled !== false);
}

// The built-in Latest Stories shelf is a second discovery route, not an
// exclusive category shelf. Its stable key survives Studio title/order edits.
export function selectHomepageArticles<T extends {_id: string; categorySlug: string}>(section: HomepageSection, articles: T[], used: Set<string>): T[] {
  const latest = section._key === "latest";
  const manual = Boolean(section.articleIds?.length);
  const byId = new Map(articles.map(article => [article._id, article]));
  const candidates = manual
    ? section.articleIds!.flatMap(id => byId.get(id) ? [byId.get(id)!] : [])
    : articles;
  const limit = Math.min(12, Math.max(1, Math.trunc(section.limit || 4)));
  const selected: T[] = [];
  const localIds = new Set<string>();
  for (const article of candidates) {
    if (localIds.has(article._id)) continue;
    if (latest) {
      // Intentionally supersedes the historical excludeFunding setting stored
      // on this shelf. Business Model is the only category excluded here.
      if (article.categorySlug === "business-model") continue;
    } else {
      if (!manual && ((section.categorySlug && article.categorySlug !== section.categorySlug) || (section.excludeFunding && article.categorySlug === "funding-news"))) continue;
      if (used.has(article._id)) continue;
    }
    selected.push(article);
    localIds.add(article._id);
    // Latest must not claim stories from category shelves moved below it.
    if (!latest) used.add(article._id);
    if (selected.length === limit) break;
  }
  return selected;
}
