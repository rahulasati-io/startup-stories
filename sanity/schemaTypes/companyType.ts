import { ALL_FIELDS_GROUP, defineField, defineType } from "sanity";

export const companyType = defineType({
  name: "company",
  title: "Company",
  type: "document",
  __experimental_formPreviewTitle: false,

  groups: [
    {
      name: "overview",
      title: "Overview",
      default: true,
    },
    {
      name: "relationships",
      title: "People & group",
    },
    {
      name: "publishing",
      title: "SEO & media",
    },
    {
      ...ALL_FIELDS_GROUP,
      hidden: true,
    },
  ],

  fields: [
    defineField({
      name: "name",
      title: "Company Name",
      type: "string",
      group: "overview",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "publishing",
      description: "Manual and permanent company URL slug.",
      validation: (Rule) => Rule.required().custom((value) => {
        if (!value?.current) return "A slug is required before this company can be published.";
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current) || "Use lowercase letters, numbers and hyphens only.";
      }),
    }),

    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      group: "publishing",
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
      name: "industryCategory",
      title: "Industry",
      description: "Search existing industries or create a new one if it does not exist.",
      type: "reference",
      group: "overview",
      to: [{ type: "industry" }],
      options: { disableNew: false },
    }),

    defineField({
      name: "industry",
      title: "Legacy industry",
      type: "string",
      group: "overview",
      deprecated: { reason: "Kept temporarily for older imported records. Use Industry instead." },
      readOnly: true,
      hidden: true,
    }),

    defineField({
      name: "parentCompany",
      title: "Parent Company",
      description: "Optional. Use this when the company or brand is part of a larger company group.",
      type: "reference",
      group: "relationships",
      to: [{ type: "company" }],
      validation: (Rule) =>
        Rule.custom((value, context) =>
          value?._ref === context.document?._id ? "A company cannot be its own parent." : true,
        ),
    }),

    defineField({
      name: "foundedYear",
      title: "Founded Year",
      type: "number",
      group: "overview",
    }),

    defineField({
      name: "description",
      title: "Short Description",
      type: "text",
      group: "overview",
      rows: 2,
    }),

    defineField({
      name: "body",
      title: "Company Overview",
      type: "blockContent",
      group: "overview",
      description: "Tip: click inside the editor and press Ctrl+Enter to write in full-screen mode.",
    }),

    defineField({
      name: "businessModel",
      title: "Business Model",
      type: "blockContent",
      group: "overview",
    }),

    defineField({
      name: "founders",
      title: "Founder names",
      description: "Keeps names imported from Excel. Add a Founder profile below when a full profile is available.",
      type: "array",
      group: "relationships",
      of: [{ type: "string" }],
    }),

    defineField({
      name: "founderProfiles",
      title: "Founder profiles",
      type: "array",
      group: "relationships",
      of: [{ type: "reference", to: [{ type: "founder" }] }],
    }),

    defineField({
      name: "seoTitle",
      title: "SEO title override",
      description: "Optional. Excel can populate this; leave blank to use the global company template in SEO Settings.",
      type: "string",
      group: "publishing",
    }),

    defineField({
      name: "seoDescription",
      title: "SEO description override",
      description: "Optional. Excel can populate this; leave blank to use the global company template in SEO Settings.",
      type: "text",
      group: "publishing",
      rows: 3,
    }),

    defineField({
      name: "socialImage",
      title: "Social Image",
      type: "image",
      group: "publishing",
      options: {
        hotspot: true,
      },
    }),
  ],

  preview: {
    select: {
      title: "name",
      media: "logo",
      category: "industryCategory.name",
      legacyIndustry: "industry",
    },
    prepare({ title, media, category, legacyIndustry }) {
      return { title, media, subtitle: category || legacyIndustry };
    },
  },
});
