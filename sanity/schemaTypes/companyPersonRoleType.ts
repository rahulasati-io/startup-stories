import { UsersIcon } from "@sanity/icons/Users";
import { defineField, defineType } from "sanity";
import { editorialVerificationFields } from "./editorialVerificationFields";

export const companyPersonRoleType = defineType({
  name: "companyPersonRole",
  title: "Company Person Role",
  type: "document",
  icon: UsersIcon,
  fields: [
    defineField({
      name: "company",
      title: "Company",
      type: "reference",
      to: [{ type: "company" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "person",
      title: "Person",
      type: "reference",
      to: [{ type: "founder" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "relationship",
      title: "Relationship",
      type: "string",
      options: {
        list: [
          { title: "Founder", value: "founder" },
          { title: "Co-founder", value: "coFounder" },
          { title: "Promoter", value: "promoter" },
          { title: "Acquirer", value: "acquirer" },
          { title: "Chairperson", value: "chairperson" },
          { title: "Managing Director", value: "managingDirector" },
          { title: "Chief Executive Officer", value: "chiefExecutive" },
          { title: "Owner", value: "owner" },
          { title: "Other", value: "other" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "roleTitle", title: "Displayed role title", type: "string" }),
    defineField({ name: "startDate", title: "Start date", type: "date" }),
    defineField({ name: "endDate", title: "End date", type: "date" }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Current", value: "current" },
          { title: "Former", value: "former" },
          { title: "Historical", value: "historical" },
        ],
        layout: "radio",
      },
      initialValue: "current",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "notes", title: "Notes", type: "text", rows: 3 }),
    defineField({
      name: "sourceUrl",
      title: "Internal source URL (deprecated)",
      type: "url",
      description: "Sources for people are now kept only in the private spreadsheet.",
      deprecated: { reason: "This field is no longer imported or used." },
      readOnly: true,
      hidden: ({ value }) => value === undefined,
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    ...editorialVerificationFields,
  ],
  preview: {
    select: {
      person: "person.name",
      company: "company.name",
      role: "roleTitle",
      relationship: "relationship",
    },
    prepare({ person, company, role, relationship }) {
      return {
        title: person || "Unnamed person",
        subtitle: `${role || relationship || "Role"}${company ? ` · ${company}` : ""}`,
      };
    },
  },
});
