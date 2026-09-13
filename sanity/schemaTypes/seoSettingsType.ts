import { CogIcon } from "@sanity/icons/Cog";
import { defineField, defineType } from "sanity";

export const seoSettingsType = defineType({
  name: "seoSettings",
  title: "SEO Settings",
  type: "document",
  icon: CogIcon,
  initialValue: {
    companyTitleTemplate: "{company_name}: Business Model, Founders & Strategy | MisterStory",
    companyDescriptionTemplate:
      "Learn how {company_name} works, its founders, business model, strategy and company history.",
    founderTitleTemplate: "{person_name}: Biography, Companies & Career | MisterStory",
    founderDescriptionTemplate:
      "Explore {person_name}'s biography, companies, career, ventures and entrepreneurial journey.",
  },
  fields: [
    defineField({
      name: "companyTitleTemplate",
      title: "Company meta-title template",
      description: "Available variables: {company_name}, {industry}.",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "companyDescriptionTemplate",
      title: "Company meta-description template",
      description: "Available variables: {company_name}, {industry}.",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "founderTitleTemplate",
      title: "Person meta-title template",
      description: "Available variables: {person_name}, {primary_role}.",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "founderDescriptionTemplate",
      title: "Person meta-description template",
      description: "Available variables: {person_name}, {primary_role}.",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({ title: "SEO Settings", subtitle: "Company and person metadata templates" }),
  },
});
