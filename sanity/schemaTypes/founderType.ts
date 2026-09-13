import { UserIcon } from "@sanity/icons/User";
import { defineField, defineType } from "sanity";

export const founderType = defineType({
  name: "founder",
  title: "Person",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "Set this once; it becomes the person's permanent URL.",
      validation: (Rule) => Rule.required().custom((value) => {
        if (!value?.current) return "A slug is required before this person can be published.";
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current) || "Use lowercase letters, numbers and hyphens only.";
      }),
    }),
    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alternative text", type: "string" }),
      ],
    }),
    defineField({ name: "role", title: "Role", type: "string" }),
    defineField({ name: "bio", title: "Bio", type: "blockContent" }),
    defineField({
      name: "website",
      title: "Website",
      type: "url",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "linkedinUrl",
      title: "LinkedIn URL",
      type: "url",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "seoTitle",
      title: "SEO title override",
      description: "Optional. Leave blank to use the global person template in SEO Settings.",
      type: "string",
    }),
    defineField({
      name: "seoDescription",
      title: "SEO description override",
      description: "Optional. Leave blank to use the global person template in SEO Settings.",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "role", media: "photo" },
  },
});
