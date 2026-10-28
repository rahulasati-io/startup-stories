import type {HomepageLink} from "./homepage-config";

export const DIRECTORY_PAGES = ["companies", "people", "articles", "authors"] as const;
export type DirectoryPageKind = typeof DIRECTORY_PAGES[number];
export type DirectoryPageSection = {
  _key: string; kind: "directory" | "text" | "links" | "articles" | "newsletter";
  enabled?: boolean; title?: string; description?: string; eyebrow?: string;
  href?: string; linkLabel?: string; links?: HomepageLink[]; articleIds?: string[];
};
export type DirectoryPageSettings = {
  seoTitle: string; seoDescription: string; title: string; description: string; eyebrow: string;
  searchPlaceholder: string; socialImageUrl?: string; sections: DirectoryPageSection[];
};
export const DEFAULT_DIRECTORY_SECTIONS: DirectoryPageSection[] = [
  {_key: "directory", kind: "directory", enabled: true},
  {_key: "newsletter", kind: "newsletter", enabled: true, title: "Get MisterStory in your inbox", description: "Subscribe for business stories, company analysis and funding updates.", linkLabel: "Subscribe"},
];
export const DIRECTORY_PAGE_DEFAULTS: Record<DirectoryPageKind, Omit<DirectoryPageSettings, "sections">> = {
  companies: {seoTitle: "Companies | MisterStory", seoDescription: "Explore company profiles, articles, people and key numbers.", title: "All Companies", description: "Search the complete MisterStory company directory by name or industry.", eyebrow: "Company directory", searchPlaceholder: "Search by company or industry"},
  people: {seoTitle: "People | MisterStory", seoDescription: "Explore founders, executives and the people behind companies covered by MisterStory.", title: "People behind the companies", description: "Explore founders, executives and business leaders covered by MisterStory.", eyebrow: "People directory", searchPlaceholder: "Search by person, role or company"},
  articles: {seoTitle: "Business Articles | MisterStory", seoDescription: "Explore business models, company strategies, founder stories and detailed business analysis from MisterStory.", title: "Articles", description: "Explore business models, strategies, founder stories and the decisions that shaped interesting companies.", eyebrow: "MisterStory library", searchPlaceholder: "Search by article, company or topic"},
  authors: {seoTitle: "Authors | MisterStory", seoDescription: "Meet the authors researching and writing MisterStory's company analysis.", title: "MisterStory authors", description: "Meet the people researching and writing MisterStory's company analysis.", eyebrow: "Editorial team", searchPlaceholder: "Search by author, role, education or experience"},
};

export function resolveDirectorySettings(kind: DirectoryPageKind, value?: Partial<DirectoryPageSettings> | null): DirectoryPageSettings {
  const defaults = DIRECTORY_PAGE_DEFAULTS[kind];
  const sections = value?.sections ?? DEFAULT_DIRECTORY_SECTIONS;
  let hasDirectory = false;
  const visible = sections.filter(section => {
    if (section.kind === "directory") {
      if (hasDirectory) return false;
      hasDirectory = true;
      return true; // The directory cannot be accidentally hidden, including via API-written data.
    }
    return section.enabled !== false;
  });
  if (!hasDirectory) visible.unshift(DEFAULT_DIRECTORY_SECTIONS[0]);
  return {
    ...defaults,
    seoTitle: value?.seoTitle?.trim() || defaults.seoTitle,
    seoDescription: value?.seoDescription?.trim() || defaults.seoDescription,
    title: value?.title?.trim() || defaults.title,
    description: value?.description ?? defaults.description,
    eyebrow: value?.eyebrow ?? defaults.eyebrow,
    searchPlaceholder: value?.searchPlaceholder?.trim() || defaults.searchPlaceholder,
    socialImageUrl: value?.socialImageUrl || undefined,
    sections: visible,
  };
}
