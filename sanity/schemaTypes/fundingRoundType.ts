import { CreditCardIcon } from "@sanity/icons/CreditCard";
import { defineArrayMember, defineField, defineType } from "sanity";
import { editorialVerificationFields } from "./editorialVerificationFields";

export const fundingRoundType = defineType({
  name: "fundingRound",
  title: "Funding Round",
  type: "document",
  icon: CreditCardIcon,
  fields: [
    defineField({
      name: "company",
      title: "Company",
      type: "reference",
      to: [{ type: "company" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "round",
      title: "Round",
      type: "string",
      description: "For example: Seed, Series A, or Debt financing.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "date", title: "Announcement date", type: "date" }),
    defineField({
      name: "amount",
      title: "Amount",
      type: "number",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({ name: "currency", title: "Currency", type: "string", initialValue: "USD" }),
    defineField({
      name: "investors",
      title: "Investors",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({ name: "valuation", title: "Valuation", type: "number", validation: (Rule) => Rule.min(0) }),
    defineField({ name: "notes", title: "Notes", type: "text", rows: 3 }),
    defineField({
      name: "sourceUrl",
      title: "Internal source URL",
      type: "url",
      description: "Used for editorial verification and never displayed publicly.",
      validation: (Rule) => Rule.required().uri({ scheme: ["http", "https"] }),
    }),
    ...editorialVerificationFields,
  ],
  preview: {
    select: { title: "round", company: "company.name", date: "date" },
    prepare({ title, company, date }) {
      return { title, subtitle: [company, date].filter(Boolean).join(" · ") };
    },
  },
});
