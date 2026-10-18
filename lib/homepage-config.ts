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
  {_key: "latest", kind: "articles", enabled: true, eyebrow: "Fresh from MisterStory", title: "Latest Stories", href: "/articles", excludeFunding: true, limit: 4},
  {_key: "explore", kind: "explore", enabled: true, eyebrow: "Explore MisterStory", title: "What do you want to explore?"},
  {_key: "topics", kind: "topics", enabled: true, eyebrow: "Explore by idea", title: "Topics worth following"},
  {_key: "companies", kind: "companies", enabled: true, eyebrow: "Company directory", title: "Explore Companies", description: "Find company profiles, articles, people and key numbers.", href: "/companies", linkLabel: "View all companies", limit: 6},
  {_key: "newsletter", kind: "newsletter", enabled: true, title: "One business story every week.", description: "Interesting companies, smart strategies and the numbers behind them.", linkLabel: "Subscribe"},
];

export const DEFAULT_HOME_TITLE = "MisterStory — Company News, Financials & Business Stories";
export const DEFAULT_HOME_DESCRIPTION = "Understand companies through business news, financial results, funding updates and clear explanations of how they make money.";

// Only relative, same-site links are accepted, even for API-written settings.
export function homepageHref(value: string | undefined, fallback: string) {
  return value && /^\/(?!\/)/.test(value) && !/[\\\s\u0000-\u001f]/.test(value) ? value : fallback;
}

export function homepageSections(value: HomepageSection[] | null | undefined) {
  return (value ?? DEFAULT_HOME_SECTIONS).filter((section) => section.enabled !== false);
}
