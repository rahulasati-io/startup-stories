import { BulbOutlineIcon } from "@sanity/icons/BulbOutline";
import { defineField, defineType } from "sanity";
import { editorialVerificationFields } from "./editorialVerificationFields";

export const companyStrategyType = defineType({
  name: "companyStrategy",
  title: "Company Strategy",
  type: "document",
  icon: BulbOutlineIcon,
  fields: [
    defineField({ name: "company", title: "Company", type: "reference", to: [{ type: "company" }], validation: (Rule) => Rule.required() }),
    defineField({
      name: "strategyType",
      title: "Strategy type",
      type: "string",
      options: {
        list: [
          { title: "Product", value: "product" },
          { title: "Pricing", value: "pricing" },
          { title: "Distribution", value: "distribution" },
          { title: "Brand and marketing", value: "brand" },
          { title: "Manufacturing", value: "manufacturing" },
          { title: "Technology", value: "technology" },
          { title: "Acquisition", value: "acquisition" },
          { title: "Geographic expansion", value: "geographicExpansion" },
          { title: "Cost reduction", value: "costReduction" },
          { title: "Partnerships", value: "partnerships" },
          { title: "Capital allocation", value: "capitalAllocation" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "title", title: "Strategy title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "description", title: "Explanation", type: "blockContent", validation: (Rule) => Rule.required() }),
    defineField({ name: "startYear", title: "Start year", type: "number", validation: (Rule) => Rule.min(1800).max(2100) }),
    defineField({ name: "endYear", title: "End year", type: "number", validation: (Rule) => Rule.min(1800).max(2100).custom((endYear, context) => { const startYear = context.document?.startYear; return !endYear || !startYear || Number(endYear) >= Number(startYear) || "End year must be after the start year."; }) }),
    defineField({
      name: "status",
      title: "Strategy status",
      type: "string",
      options: { list: [{ title: "Planned", value: "planned" }, { title: "Current", value: "current" }, { title: "Completed", value: "completed" }, { title: "Historical", value: "historical" }], layout: "radio" },
      initialValue: "current",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "sourceUrl", title: "Internal source URL", type: "url", description: "Used for editorial verification and never displayed publicly.", validation: (Rule) => Rule.required().uri({ scheme: ["http", "https"] }) }),
    ...editorialVerificationFields,
  ],
  preview: {
    select: { title: "title", company: "company.name", strategyType: "strategyType", status: "status" },
    prepare({ title, company, strategyType, status }) {
      return { title, subtitle: [company, strategyType, status].filter(Boolean).join(" · ") };
    },
  },
});
