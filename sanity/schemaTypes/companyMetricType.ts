import { ChartUpwardIcon } from "@sanity/icons/ChartUpward";
import { defineField, defineType } from "sanity";
import { editorialVerificationFields } from "./editorialVerificationFields";

export const companyMetricType = defineType({
  name: "companyMetric",
  title: "Company Metric",
  type: "document",
  icon: ChartUpwardIcon,
  fields: [
    defineField({name: "financialEditedInStudio", title: "Edited in Financial Editor", type: "boolean", readOnly: true, hidden: ({value}) => !value}),
    defineField({name: "financialEditedAt", title: "Last Financial Editor save", type: "datetime", readOnly: true, hidden: ({value}) => !value}),
    defineField({ name: "financialImportKey", title: "Annual financial import key", type: "string", readOnly: true, hidden: ({value}) => !value, description: "Stable observation key used by the Metrics-sheet financial importer; not a public URL." }),
    defineField({ name: "metricCode", title: "Financial metric code", type: "string", readOnly: true, hidden: ({value}) => !value }),
    defineField({ name: "fiscalYear", title: "Financial year ending", type: "number", readOnly: true, hidden: ({value}) => !value }),
    defineField({ name: "numericValue", title: "Numeric amount", type: "number", readOnly: true, hidden: ({value}) => value === undefined, description: "Edit annual figures in Financial Editor, or use Excel when that year is not protected." }),
    defineField({ name: "currency", title: "Currency", type: "string", readOnly: true, hidden: ({value}) => !value }),
    defineField({ name: "unit", title: "Unit", type: "string", readOnly: true, hidden: ({value}) => !value }),
    defineField({ name: "reportingBasis", title: "Reporting basis", type: "string", readOnly: true, hidden: ({value}) => !value }),
    defineField({ name: "company", title: "Company", type: "reference", to: [{ type: "company" }], validation: (Rule) => Rule.required() }),
    defineField({ name: "label", title: "Metric", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "value", title: "Value", type: "string", readOnly: ({document}) => Boolean(document?.financialImportKey), description: "Use Financial Editor for annual figures. Other metrics may use values such as 48% or 1,200 stores.", validation: (Rule) => Rule.required() }),
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
