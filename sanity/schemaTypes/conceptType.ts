import { defineField, defineType } from "sanity";

export const conceptType = defineType({
  name: "concept",
  title: "Concept",
  type: "document",

  fields: [
    defineField({
      name: "name",
      title: "Concept Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
  ],

  preview: {
    select: {
      title: "name",
    },
  },
});