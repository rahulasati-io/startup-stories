# Company industry classification

Companies use one broad Industry and one matching Sub-industry. The shared approved list is in `lib/industry-taxonomy.mjs` (25 industries and 97 sub-industries).

## Entering companies

- In `companies.xlsx`, keep the broad industry in Companies column C (`industry`). Select the matching sub-industry in column K (`sub_industry`). Existing profile columns remain in place.
- The Industry Categories tab lists valid pairs. Dependent dropdowns cover rows 2–1001. The importer validates every selected company even outside that dropdown range or when pasted data bypasses Excel validation.
- In Sanity, choose Industry first, then its matching Sub-industry. An invalid or missing pair blocks publication. Creating spelling variants of an industry is disabled.
- Request an intentional taxonomy change when no existing category fits. Add the category to the shared list and regenerate workbook dropdowns before using it. Do not silently reuse an unrelated category.
- Profile URLs and company slugs do not change when classification changes.

## Existing companies: classification-only updates

Check first:

```powershell
node --env-file=.env.local scripts/migrate-company-industries.mjs companies.xlsx
```

Apply approved changes:

```powershell
node --env-file=.env.local scripts/migrate-company-industries.mjs companies.xlsx --apply
```

The migration backs up the CMS documents, checks revisions, updates only `industryCategory` and `subIndustry`, and verifies that profile text, SEO, relationships, financials and publication states are unchanged. It preserves draft/published pairs and does not publish drafts. Legacy industry documents are retained rather than deleted.

The normal company importer still updates other profile fields as before. Do not use it just to change classification on profiles edited more recently in Sanity.
