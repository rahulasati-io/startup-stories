import { defineField } from "sanity";

export const editorialVerificationFields = [
  defineField({ name: "sourceDate", title: "Source date", type: "date", description: "Publication or reporting date of the source, when available." }),
  defineField({
    name: "verificationStatus",
    title: "Verification status",
    type: "string",
    options: {
      list: [
        { title: "Needs research", value: "needsResearch" },
        { title: "Source added", value: "sourceAdded" },
        { title: "Verified", value: "verified" },
        { title: "Needs updating", value: "needsUpdating" },
      ],
      layout: "radio",
    },
    initialValue: "needsResearch",
    validation: (Rule) => Rule.required(),
  }),
  defineField({ name: "internalNotes", title: "Internal editorial notes", type: "text", rows: 3, description: "Private research or review notes. These are never displayed publicly." }),
];
