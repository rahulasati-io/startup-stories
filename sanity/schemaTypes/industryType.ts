import { TagIcon } from "@sanity/icons/Tag";
import { defineField, defineType } from "sanity";

export const industryType = defineType({
  name: "industry",
  title: "Industry",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "name",
      title: "Industry name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "name" },
  },
});
