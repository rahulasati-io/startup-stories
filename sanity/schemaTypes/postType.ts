import { ALL_FIELDS_GROUP, defineArrayMember, defineField, defineType } from "sanity";
import OptimizedArticleImageInput from "../components/OptimizedArticleImageInput";
import PasteAwareArticleBodyInput from "../components/PasteAwareArticleBodyInput";
import { ARTICLE_SLUG_ERROR, isValidArticleSlug } from "../../lib/article-slug.mjs";
import {apiVersion} from "../env";

export const postType = defineType({
  name: "post",
  title: "Article",
  type: "document",
  __experimental_formPreviewTitle: false,
  initialValue: async (_, context) => {
    const authorId = await context.getClient({apiVersion}).fetch<string | null>(/* groq */ `
      *[
        _type == "author" &&
        slug.current == "rahul" &&
        !(_id in path("drafts.**"))
      ][0]._id
    `);

    return authorId
      ? {author: {_type: "reference", _ref: authorId}}
      : {};
  },

  groups: [
    {
      name: "writing",
      title: "Writing",
      default: true,
    },
    {
      name: "connections",
      title: "Connections",
    },
    {
      name: "publishing",
      title: "SEO & publishing",
    },
    {
      ...ALL_FIELDS_GROUP,
      hidden: true,
    },
  ],

  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "writing",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "thumbnailTitle",
      title: "Thumbnail Title",
      type: "string",
      group: "writing",
      description:
        "Optional shorter title used only inside the automatic thumbnail. The article heading and SEO title stay unchanged.",
      validation: (Rule) =>
        Rule.max(80).warning("Keep the thumbnail title under 80 characters for the clearest artwork."),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "publishing",
      description: "Enter the slug manually.",
      validation: (Rule) => Rule.required().custom((value) => {
        if (!value?.current) return "A slug is required before this article can be published.";
        return isValidArticleSlug(value.current) || ARTICLE_SLUG_ERROR;
      }),
    }),

    defineField({
      name: "importId",
      title: "Spreadsheet Import ID",
      description: "Internal stable identity used by the Excel importer. It stays unchanged when the public article slug changes.",
      type: "string",
      readOnly: true,
      hidden: true,
      group: "publishing",
    }),

    defineField({
      name: "mainImage",
      title: "Hero Image",
      type: "image",
      group: "publishing",
      description:
        "Optional. Articles receive an automatic MisterStory thumbnail when no custom image is supplied.",
      options: {
        hotspot: true,
      },
      components: {
        input: OptimizedArticleImageInput,
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
      group: "writing",
      description: "Paste tables directly from Excel, Google Sheets, Word or Google Docs. Press Ctrl+Enter for full-screen writing.",
      components: {
        input: PasteAwareArticleBodyInput,
      },
      validation: (Rule) => Rule.required().min(1),
    }),

    defineField({
      name: "category",
      title: "Article Category",
      type: "reference",
      group: "connections",
      to: [{ type: "category" }],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "company",
      title: "Companies",
      description: "Optional. Link every company that is substantially discussed. Leave this blank when the article is not about a specific company.",
      type: "array",
      group: "connections",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "company" }],
        }),
      ],
      validation: (Rule) => Rule.unique(),
    }),

    defineField({
      name: "people",
      title: "People featured",
      description: "Select only people who are directly discussed in this article. This controls which person profile pages show the article.",
      type: "array",
      group: "connections",
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
      group: "connections",
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
      group: "connections",
      to: [{ type: "author" }],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "publishedAt",
      title: "First Published",
      type: "datetime",
      group: "publishing",
      description: "Set automatically the first time this article goes live.",
      readOnly: true,
    }),

    defineField({
      name: "contentUpdatedAt",
      title: "Last Content Update",
      type: "datetime",
      group: "publishing",
      description: "Set automatically when a previously published article is changed and published again.",
      readOnly: true,
    }),

    defineField({
      name: "promotion",
      title: "Article promotion",
      description:
        "Mark an article as Popular only when you want it promoted in article sidebars. Leave Standard selected for normal articles.",
      type: "string",
      group: "publishing",
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
      group: "publishing",
    }),

    defineField({
      name: "seoDescription",
      title: "SEO Meta Description",
      type: "text",
      group: "publishing",
      rows: 3,
      description: "Required before publishing. Summarise the article accurately in natural language; avoid keyword stuffing.",
      validation: (Rule) => [
        Rule.required().error("Add an SEO meta description before publishing."),
        Rule.min(120).max(170).warning("Aim for roughly 120–170 characters so the description reads well in search results."),
      ],
    }),

    defineField({
      name: "seoKeywords",
      title: "SEO Keywords",
      type: "string",
      group: "publishing",
      description: "Optional. Enter 3–8 specific topic phrases separated by commas. Use natural variations and avoid repeating the same keyword.",
      validation: (Rule) => Rule.custom((value) => {
        if (!value) return true;
        const keywords = value.split(",").map((keyword) => keyword.trim()).filter(Boolean);
        const unique = new Set(keywords.map((keyword) => keyword.toLowerCase()));
        if (keywords.length > 10) return "Use no more than 10 focused keyword phrases.";
        if (unique.size !== keywords.length) return "Remove repeated keyword phrases.";
        return true;
      }).warning(),
    }),

    defineField({
      name: "socialImage",
      title: "Social Image",
      type: "image",
      group: "publishing",
      description: "Optional. Use the optimizer below to prepare a lightweight 16:9 image.",
      options: {
        hotspot: true,
      },
      components: {
        input: OptimizedArticleImageInput,
      },
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
