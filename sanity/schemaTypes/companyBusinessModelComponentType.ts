import { defineField, defineType } from "sanity";
import { editorialVerificationFields } from "./editorialVerificationFields";

export const companyBusinessModelComponentType = defineType({
  name: "companyBusinessModelComponent",
  title: "Business Model Component",
  type: "document",
  fields: [
    defineField({
      name: "sourceKey",
      title: "Import ID",
      type: "string",
      description: "Stable row ID used by the spreadsheet importer.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "company",
      title: "Company",
      type: "reference",
      to: [{ type: "company" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "componentType",
      title: "Component Type",
      type: "string",
      options: {
        list: [
          { title: "Products and services", value: "products" },
          { title: "Customers", value: "customers" },
          { title: "Revenue sources", value: "revenue" },
          { title: "Sales channels", value: "channels" },
          { title: "Pricing and positioning", value: "positioning" },
          { title: "Operations and manufacturing", value: "operations" },
          { title: "Suppliers and partners", value: "partners" },
          { title: "Geographic markets", value: "markets" },
          { title: "Cost structure", value: "costs" },
          { title: "Competitive advantages", value: "advantages" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "title", title: "Title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "description", title: "Explanation", type: "text", rows: 4, validation: (Rule) => Rule.required() }),
    defineField({ name: "displayOrder", title: "Display Order", type: "number" }),
    defineField({
      name: "sourceUrl",
      title: "Internal Source URL",
      type: "url",
      description: "Stored for editorial verification and not displayed on the public company page.",
      validation: (Rule) => Rule.required().uri({ scheme: ["http", "https"] }),
    }),
    ...editorialVerificationFields,
  ],
  preview: {
    select: { title: "title", company: "company.name", componentType: "componentType" },
    prepare({ title, company, componentType }) {
      return { title, subtitle: [company, componentType].filter(Boolean).join(" · ") };
    },
  },
});
