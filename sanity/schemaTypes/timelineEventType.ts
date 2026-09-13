import { CalendarIcon } from "@sanity/icons/Calendar";
import { defineField, defineType } from "sanity";
import { editorialVerificationFields } from "./editorialVerificationFields";

export const timelineEventType = defineType({
  name: "timelineEvent",
  title: "Timeline Event",
  type: "document",
  icon: CalendarIcon,
  fields: [
    defineField({ name: "company", title: "Company", type: "reference", to: [{ type: "company" }], validation: (Rule) => Rule.required() }),
    defineField({ name: "date", title: "Date", type: "date", validation: (Rule) => Rule.required() }),
    defineField({ name: "title", title: "Event title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
    defineField({ name: "sourceUrl", title: "Internal source URL", type: "url", description: "Used for editorial verification and never displayed publicly.", validation: (Rule) => Rule.required().uri({ scheme: ["http", "https"] }) }),
    ...editorialVerificationFields,
  ],
  preview: {
    select: { title: "title", company: "company.name", date: "date" },
    prepare({ title, company, date }) {
      return { title, subtitle: [company, date].filter(Boolean).join(" · ") };
    },
  },
});
