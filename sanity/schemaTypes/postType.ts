import { defineArrayMember, defineField, defineType } from "sanity";

export const postType = defineType({
  name: "post",
  title: "Article",
  type: "document",

  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "Enter the slug manually.",
      validation: (Rule) => Rule.required().custom((value) => {
        if (!value?.current) return "A slug is required before this article can be published.";
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current) || "Use lowercase letters, numbers and hyphens only.";
      }),
    }),

    defineField({
      name: "mainImage",
      title: "Hero Image",
      type: "image",
      description:
        "Optional. Business Model articles receive an automatic MisterStory thumbnail when this is empty.",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative Text",
          type: "string",
        }),
      ],
    }),

    defineField({
      name: "body",
      title: "Article Body",
      type: "blockContent",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "category",
      title: "Article Category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "company",
      title: "Companies",
      description: "Link every company that is substantially discussed in this article. Add at least one company.",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "company" }],
        }),
      ],
      validation: (Rule) => Rule.required().min(1).unique(),
    }),

    defineField({
      name: "people",
      title: "People featured",
      description: "Select only people who are directly discussed in this article. This controls which person profile pages show the article.",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "founder" }],
        }),
      ],
      validation: (Rule) => Rule.unique(),
    }),

    defineField({
      name: "concepts",
      title: "Concepts",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "concept" }],
        }),
      ],
      validation: (Rule) => Rule.unique(),
    }),

    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "publishedAt",
      title: "Publish Date",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "promotion",
      title: "Article promotion",
      description:
        "Mark an article as Popular only when you want it promoted in article sidebars. Leave Standard selected for normal articles.",
      type: "string",
      initialValue: "standard",
      options: {
        list: [
          { title: "Standard", value: "standard" },
          { title: "Popular", value: "popular" },
        ],
        layout: "radio",
      },
    }),

    defineField({
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
    }),

    defineField({
      name: "seoDescription",
      title: "SEO Meta Description",
      type: "text",
      rows: 3,
    }),

    defineField({
      name: "socialImage",
      title: "Social Image",
      type: "image",
    }),
  ],

  preview: {
    select: {
      title: "title",
      media: "mainImage",
    },

    prepare(selection) {
      return selection;
    },
  },
});
