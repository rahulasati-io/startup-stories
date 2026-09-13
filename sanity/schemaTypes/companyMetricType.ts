import { ChartUpwardIcon } from "@sanity/icons/ChartUpward";
import { defineField, defineType } from "sanity";
import { editorialVerificationFields } from "./editorialVerificationFields";

export const companyMetricType = defineType({
  name: "companyMetric",
  title: "Company Metric",
  type: "document",
  icon: ChartUpwardIcon,
  fields: [
    defineField({ name: "company", title: "Company", type: "reference", to: [{ type: "company" }], validation: (Rule) => Rule.required() }),
    defineField({ name: "label", title: "Metric", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "value", title: "Value", type: "string", description: "Use a readable value, such as $250M, 48%, or 1,200 stores.", validation: (Rule) => Rule.required() }),
    defineField({ name: "period", title: "Period", type: "string", description: "For example: FY2025 or Q1 2026." }),
    defineField({ name: "notes", title: "Notes", type: "text", rows: 3 }),
    defineField({ name: "sourceUrl", title: "Internal source URL", type: "url", description: "Used for editorial verification and never displayed publicly.", validation: (Rule) => Rule.required().uri({ scheme: ["http", "https"] }) }),
    ...editorialVerificationFields,
  ],
  preview: {
    select: { title: "label", value: "value", company: "company.name" },
    prepare({ title, value, company }) {
      return { title, subtitle: [value, company].filter(Boolean).join(" · ") };
    },
  },
});
