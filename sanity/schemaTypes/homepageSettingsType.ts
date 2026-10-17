import { CogIcon } from "@sanity/icons/Cog";
import { defineArrayMember, defineField, defineType } from "sanity";

export const homepageSettingsType = defineType({
  name: "homepageSettings",
  title: "Homepage Settings",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({
      name: "featuredArticle",
      title: "First Highlighted Story",
      type: "reference",
      to: [{ type: "post" }],
      description:
        "The first of two highlighted stories at the top of Featured Stories. Spreadsheet imports do not change this selection.",
    }),
    defineField({
      name: "secondFeaturedArticle",
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
