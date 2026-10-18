import {defineField, defineType} from "sanity";
import {LockIcon} from "@sanity/icons/Lock";

// Ordinary generated-ID records, one per company, managed only by the Financial Editor.
// Separate from company drafts so publishing an older company profile cannot erase locks.
export const companyFinancialControlType = defineType({
  name: "companyFinancialControl", title: "Financial import protection", type: "document", icon: LockIcon,
  readOnly: true,
  fields: [
    defineField({name: "company", title: "Company", type: "reference", to: [{type: "company"}]}),
    defineField({name: "lockedGroups", title: "Years protected from Excel", type: "array", of: [{type: "string"}]}),
    defineField({name: "lastEditedAt", type: "datetime"}),
    defineField({name: "excelPermissionUpdatedAt", type: "datetime"}),
    defineField({name: "lastExcelImportAt", type: "datetime"}),
  ],
  preview: {select: {title: "company.name"}, prepare: ({title}) => ({title: `${title || "Company"} — Excel protection`})},
});
