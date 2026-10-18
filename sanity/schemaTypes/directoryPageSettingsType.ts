import {CogIcon} from "@sanity/icons/Cog";
import {defineArrayMember, defineField, defineType} from "sanity";
import {DEFAULT_DIRECTORY_SECTIONS} from "../../lib/directory-page-config";

const pathField = (name: string, title: string) => defineField({name, title, type: "string", description: "Same-site path beginning with /.", validation: rule => rule.custom(value => !value || (/^\/(?!\/)/.test(value) && !/[\\\s\u0000-\u001f]/.test(value)) || "Use a same-site path such as /companies or /articles.")});

export const directoryPageSettingsType = defineType({
  name: "directoryPageSettings", title: "Directory page settings", type: "document", icon: CogIcon,
  groups: [{name: "seo", title: "SEO & sharing"}, {name: "intro", title: "Heading & search"}, {name: "sections", title: "Page sections", default: true}],
  initialValue: {sections: DEFAULT_DIRECTORY_SECTIONS.map(section => ({...section, _type: "directorySection"}))},
  fields: [
    defineField({name: "seoTitle", title: "SEO title", type: "string", group: "seo", description: "Blank uses this page's existing title.", validation: rule => rule.max(70).warning("Long titles may be shortened in search results.")}),
    defineField({name: "seoDescription", title: "Meta description", type: "text", rows: 3, group: "seo", validation: rule => rule.max(170).warning("Keep this concise; Google may choose a different snippet.")}),
    defineField({name: "socialImage", title: "Social sharing image", type: "image", options: {hotspot: true}, group: "seo"}),
    defineField({name: "title", title: "Main heading (the only H1)", type: "string", group: "intro", validation: rule => rule.max(150)}),
    defineField({name: "eyebrow", title: "Small label above the heading", type: "string", group: "intro"}),
    defineField({name: "description", title: "Introduction", type: "text", rows: 4, group: "intro"}),
    defineField({name: "searchPlaceholder", title: "Search placeholder", type: "string", group: "intro", description: "Changes wording only; search continues to work across the full directory."}),
    defineField({name: "sections", title: "Page sections — drag to reorder", type: "array", group: "sections", description: "Keep exactly one Directory section. Add or hide supporting sections without hiding your company, people, article or author links.", of: [defineArrayMember({name: "directorySection", title: "Page section", type: "object", icon: CogIcon, initialValue: {kind: "text", enabled: true}, fields: [
      defineField({name: "kind", title: "Section type", type: "string", options: {list: [{title: "Directory (required, once)", value: "directory"}, {title: "Text introduction", value: "text"}, {title: "Shortcut link cards", value: "links"}, {title: "Selected articles", value: "articles"}, {title: "Newsletter signup", value: "newsletter"}]}, validation: rule => rule.required()}),
      defineField({name: "enabled", title: "Show this section", type: "boolean", hidden: ({parent}) => parent?.kind === "directory"}),
      defineField({name: "title", title: "Section heading (H2)", type: "string", hidden: ({parent}) => parent?.kind === "directory", validation: rule => rule.custom((value, context) => (context.parent as {kind?: string})?.kind === "directory" || Boolean(value?.trim()) || "Give this section a heading.")}),
      defineField({name: "eyebrow", title: "Small label", type: "string", hidden: ({parent}) => parent?.kind === "directory"}),
      defineField({name: "description", title: "Description / text", type: "text", rows: 4, hidden: ({parent}) => parent?.kind === "directory"}),
      {...pathField("href", "View-all destination"), hidden: ({parent}) => parent?.kind !== "articles"},
      defineField({name: "linkLabel", title: "View-all / subscribe button label", type: "string", hidden: ({parent}) => !["articles", "newsletter"].includes(parent?.kind)}),
      defineField({name: "articles", title: "Selected articles in display order", type: "array", hidden: ({parent}) => parent?.kind !== "articles", of: [defineArrayMember({type: "reference", to: [{type: "post"}]})], validation: rule => rule.unique().max(12), description: "Only published articles appear. Drafts are not replaced with unrelated stories."}),
      defineField({name: "links", title: "Shortcut cards", type: "array", hidden: ({parent}) => parent?.kind !== "links", of: [defineArrayMember({name: "directoryShortcut", type: "object", fields: [defineField({name: "title", type: "string", validation: rule => rule.required()}), defineField({name: "description", type: "text", rows: 2}), {...pathField("href", "Destination"), validation: rule => rule.required().custom(value => (typeof value === "string" && /^\/(?!\/)/.test(value) && !/[\\\s\u0000-\u001f]/.test(value)) || "Use a same-site path beginning with /." )}, defineField({name: "action", title: "Button label", type: "string"})], preview: {select: {title: "title", subtitle: "href"}}})], validation: rule => rule.max(12)}),
    ], preview: {select: {title: "title", kind: "kind", enabled: "enabled"}, prepare: ({title, kind, enabled}) => ({title: kind === "directory" ? "Directory (main H1, search and listings)" : title || "Untitled section", subtitle: `${kind}${enabled === false && kind !== "directory" ? " · Hidden" : ""}`})}})], validation: rule => rule.required().max(20).custom(value => ((value || []) as {kind?: string}[]).filter(section => section.kind === "directory").length === 1 || "Keep exactly one Directory section.")}),
  ],
  preview: {select: {title: "title"}, prepare: ({title}) => ({title: title || "Directory page settings"})},
});
