export type SeoSettings = {
  companyTitleTemplate?: string;
  companyDescriptionTemplate?: string;
  founderTitleTemplate?: string;
  founderDescriptionTemplate?: string;
};

export const SEO_SETTINGS_QUERY = `*[_id == "seoSettings"][0]{
  companyTitleTemplate,
  companyDescriptionTemplate,
  founderTitleTemplate,
  founderDescriptionTemplate
}`;

export const DEFAULT_SEO_TEMPLATES: Required<SeoSettings> = {
  companyTitleTemplate: "{company_name}: Business Model, Founders & Strategy | MisterStory",
  companyDescriptionTemplate:
    "Learn how {company_name} works, its founders, business model, strategy and company history.",
  founderTitleTemplate: "{person_name}: Biography, Companies & Career | MisterStory",
  founderDescriptionTemplate:
    "Explore {person_name}'s biography, companies, career, ventures and entrepreneurial journey.",
};

export function fillSeoTemplate(template: string, values: Record<string, string | undefined>) {
  return template
    .replace(/\{([a-z_]+)\}/g, (token, key: string) => values[key]?.trim() || token)
    .replace(/\s+/g, " ")
    .trim();
}
