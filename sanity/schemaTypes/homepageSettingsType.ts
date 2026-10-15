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
      title: "Featured Story",
      type: "reference",
      to: [{ type: "post" }],
      description:
        "The main story highlighted on the homepage. Spreadsheet imports do not change this selection.",
    }),
    defineField({
      name: "supportingFeaturedArticles",
      title: "Supporting Featured Stories",
      type: "array",
      description:
        "Optional stories shown below the main feature. Add up to three; their order here controls their order on the homepage.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "post" }] })],
      validation: (rule) => rule.unique().max(3),
    }),
  ],
  preview: {
    prepare: () => ({ title: "Homepage Settings" }),
  },
});
