import { TagIcon } from "@sanity/icons/Tag";
import { defineField, defineType } from "sanity";

export const industryType = defineType({
  name: "industry",
  title: "Industry",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({name: "taxonomyVersion", type: "number", hidden: true, readOnly: true}),
    defineField({
      name: "name",
      title: "Industry name",
      description: "Approved taxonomy. Request a reviewed taxonomy change instead of creating a naming variant.",
      readOnly: true,
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      readOnly: true,
      type: "slug",
      options: { source: "name" },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "name" },
  },
});
