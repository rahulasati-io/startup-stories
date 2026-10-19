import { CogIcon } from "@sanity/icons/Cog";
import { defineArrayMember, defineField, defineType } from "sanity";
import {DEFAULT_HOME_SECTIONS, DEFAULT_HOME_TITLE, DEFAULT_HOME_DESCRIPTION} from "../../lib/homepage-config";

const internalLink = (name: string, title: string) => defineField({name, title, type: "string", description: "Same-site path, for example /articles or /companies/zomato.", validation: (rule) => rule.custom((value) => !value || (/^\/(?!\/)/.test(value) && !/[\\\s\u0000-\u001f]/.test(value)) || "Use a same-site path beginning with one /.")});

export const homepageSettingsType = defineType({
  name: "homepageSettings",
  title: "Homepage Settings",
  type: "document",
  icon: CogIcon,
  groups: [
    {name: "seo", title: "SEO & sharing"},
    {name: "intro", title: "Heading & search"},
    {name: "sections", title: "Page sections", default: true},
    {name: "featured", title: "Featured stories"},
  ],
  initialValue: {seoTitle: DEFAULT_HOME_TITLE, seoDescription: DEFAULT_HOME_DESCRIPTION, heroTitle: "No BS Business Breakdown", heroDescription: "Discover interesting companies, the decisions that shaped them, and the strategies behind their success.", showSearch: true, sections: DEFAULT_HOME_SECTIONS.map((section) => ({...section, _type: "homepageSection"}))},
  fields: [
    defineField({name: "seoTitle", title: "Homepage SEO title", type: "string", group: "seo", description: `Fallback: ${DEFAULT_HOME_TITLE}`, validation: (rule) => rule.max(70).warning("Long titles may be shortened in search results.")}),
    defineField({name: "seoDescription", title: "Homepage meta description", type: "text", rows: 3, group: "seo", description: `Fallback: ${DEFAULT_HOME_DESCRIPTION}`, validation: (rule) => rule.max(170).warning("Keep the description concise; Google may choose a different snippet.")}),
    defineField({name: "socialImage", title: "Homepage social sharing image", type: "image", group: "seo", options: {hotspot: true}}),
    defineField({name: "heroTitle", title: "Main homepage heading (the only H1)", type: "string", group: "intro", description: "Fallback: No BS Business Breakdown. Section titles are always H2.", validation: (rule) => rule.max(150)}),
    defineField({name: "heroDescription", title: "Introduction below the heading", type: "text", rows: 3, group: "intro"}),
    defineField({name: "showSearch", title: "Show homepage company search", type: "boolean", initialValue: true, group: "intro"}),
    defineField({name: "searchPlaceholder", title: "Search placeholder", type: "string", group: "intro"}),
    defineField({name: "popularCompanies", title: "Popular company shortcuts", type: "array", group: "intro", description: "Select companies in display order. An empty list hides shortcuts; unset uses the current defaults.", of: [defineArrayMember({type: "reference", to: [{type: "company"}]})], validation: (rule) => rule.unique().max(10)}),
    defineField({
      name: "sections", title: "Homepage sections — drag to reorder", type: "array", group: "sections",
      description: "Add, hide or reorder sections. Empty sections/topics stay hidden. Category shelves avoid repeating stories. The built-in Latest Stories can repeat stories shown elsewhere, includes funding, and excludes Business Model articles.",
      initialValue: DEFAULT_HOME_SECTIONS.map((section) => ({...section, _type: "homepageSection"})),
      of: [defineArrayMember({name: "homepageSection", title: "Homepage section", type: "object", icon: CogIcon,
        initialValue: {enabled: true, kind: "articles", limit: 4},
        fields: [
          defineField({name: "kind", title: "Section type", type: "string", options: {list: [{title: "Featured stories (2 highlights + 4 supporting)", value: "featured"}, {title: "Article collection", value: "articles"}, {title: "Explore cards", value: "explore"}, {title: "Topic links", value: "topics"}, {title: "Company directory preview", value: "companies"}, {title: "Newsletter signup", value: "newsletter"}, {title: "Text introduction", value: "text"}]}, validation: (rule) => rule.required()}),
          defineField({name: "enabled", title: "Show this section", type: "boolean", initialValue: true}),
          defineField({name: "title", title: "Section heading (H2)", type: "string", validation: (rule) => rule.required()}),
          defineField({name: "eyebrow", title: "Small label above heading", type: "string"}),
          defineField({name: "description", title: "Description / text", type: "text", rows: 4}),
          internalLink("href", "View-all link"),
          defineField({name: "linkLabel", title: "Link / subscribe button label", type: "string"}),
          defineField({name: "category", title: "Article category", type: "reference", to: [{type: "category"}], hidden: ({parent}) => parent?.kind !== "articles" || parent?._key === "latest", description: "Choose a category to override the fallback category slug below."}),
          defineField({name: "categorySlug", title: "Fallback category slug", type: "string", hidden: ({parent}) => parent?.kind !== "articles" || parent?._key === "latest", description: "For example funding-news or business-model. Leave both category fields empty for all articles."}),
          defineField({name: "excludeFunding", title: "Exclude funding news", type: "boolean", hidden: ({parent}) => parent?.kind !== "articles" || parent?._key === "latest"}),
          defineField({name: "articles", title: "Manually selected articles (optional)", type: "array", of: [defineArrayMember({type: "reference", to: [{type: "post"}]})], hidden: ({parent}) => parent?.kind !== "articles", description: "When selected, these replace automatic selection in your chosen order. Only published articles appear. Latest Stories still excludes Business Model and may repeat stories shown elsewhere.", validation: (rule) => rule.unique().max(12)}),
          defineField({name: "limit", title: "Number of articles / companies", type: "number", hidden: ({parent}) => !["articles", "companies"].includes(parent?.kind), validation: (rule) => rule.integer().min(1).max(12)}),
          defineField({name: "links", title: "Explore cards / topic links", type: "array", hidden: ({parent}) => !["explore", "topics"].includes(parent?.kind), description: "Unset uses existing choices. Topic links require a matching category slug or search phrase to avoid linking to empty collections.", of: [defineArrayMember({type: "object", name: "homepageLink", fields: [
            defineField({name: "title", title: "Title", type: "string", validation: (rule) => rule.required()}),
            defineField({name: "description", type: "text", rows: 2}), internalLink("href", "Destination"),
            defineField({name: "action", title: "Button label", type: "string"}),
            defineField({name: "categorySlug", title: "Require articles in category slug", type: "string"}),
            defineField({name: "search", title: "Matching search phrase (topic links)", type: "string"}),
          ], preview: {select: {title: "title", subtitle: "href"}}})]}),
        ], preview: {select: {title: "title", kind: "kind", enabled: "enabled"}, prepare: ({title, kind, enabled}) => ({title: title || "Untitled section", subtitle: `${kind || "Choose a type"}${enabled === false ? " · Hidden" : ""}`})},
      })],
      validation: (rule) => rule.max(20).custom((value) => {
        const sections = (value || []) as {kind?: string; enabled?: boolean}[];
        const singletons = sections.filter((item) => item.enabled !== false && !["articles", "text"].includes(item.kind || "")).map((item) => item.kind);
        return new Set(singletons).size === singletons.length || "Use only one visible section of each type, except Article collections and Text introductions.";
      }),
    }),
    defineField({
      name: "featuredArticle",
      group: "featured",
      title: "First Highlighted Story",
      type: "reference",
      to: [{ type: "post" }],
      description:
        "The first of two highlighted stories at the top of Featured Stories. Spreadsheet imports do not change this selection.",
    }),
    defineField({
      name: "secondFeaturedArticle",
      group: "featured",
      title: "Second Highlighted Story",
      type: "reference",
      to: [{ type: "post" }],
      description: "Shown beside the first highlighted story on desktop and below it on mobile.",
      validation: (rule) => rule.custom((value, context) => {
        const first = context.document?.featuredArticle as {_ref?: string} | undefined;
        return !value?._ref || value._ref !== first?._ref || "Choose a different article for the second highlighted story.";
      }),
    }),
    defineField({
      name: "supportingFeaturedArticles",
      group: "featured",
      title: "Supporting Featured Stories",
      type: "array",
      description:
        "Up to four smaller stories below the two highlights. Their order here controls their order on the homepage. Choose different articles from the two highlights.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "post" }] })],
      validation: (rule) => rule.unique().max(4).custom((value, context) => {
        const highlights = [context.document?.featuredArticle, context.document?.secondFeaturedArticle] as Array<{_ref?: string} | undefined>;
        const highlightedIds = new Set(highlights.map((item) => item?._ref).filter(Boolean));
        const supporting = (value || []) as Array<{_ref?: string}>;
        return !supporting.some((item) => highlightedIds.has(item._ref)) || "Supporting stories must be different from the two highlighted stories.";
      }),
    }),
  ],
  preview: {
    prepare: () => ({ title: "Homepage Settings" }),
  },
});
