# Bulk article import

Use `outputs/article-importers/articles-template.xlsx` for every article type. Add articles only to the **Articles** sheet; the **Example** and **Instructions** sheets are never imported.

The last two columns are automatic helpers:

- `audit_status` shows `PASS`, `REVIEW`, or `BLOCKED` as the row is edited.
- `audit_warnings` explains missing fields, duplicate permanent IDs or slugs, article-structure issues, and SEO-length guidance.

Do not type over those formula columns. They are prefilled for 200 rows and are never imported into Sanity. Fix `BLOCKED` rows before importing; assess `REVIEW` messages editorially. The spreadsheet checks are deliberately fast and local. Run `npm run audit:articles` before publishing for deeper checks against live Sanity documents, links, references, and publication state.

## Before importing

- `company_slug` must already exist in Sanity. Separate multiple companies with semicolons; the first is treated as the primary company.
- `article_tag` is required. Choose Business Model, Strategy, Company Story, or People & Leadership from the spreadsheet dropdown. The importer maps that selection to the matching Sanity category.
- `article_tag` is the article's one primary browsing category. `concept_slugs` can hold multiple optional topic tags.
- `author_slug` must already exist in Sanity.
- `people_slugs` is optional. Use semicolon-separated person slugs that already exist in Sanity. When the cell is blank, the importer preserves the article's current people links.
- `concept_slugs` is optional. Use semicolon-separated concept slugs that already exist in Sanity. When the cell is blank, the importer preserves the article's current concept links.
- Write the article in `article_body` using Markdown: `##`/`###` headings, paragraphs separated by blank lines, `**bold**`, `*italics*`, links, bullets, numbered lists, and blockquotes.
- `thumbnail_title` is optional. Use it only when the full article title is too long for the automatic thumbnail; it does not replace the article heading or SEO title.
- `source_urls` is private working evidence. The importer deliberately ignores it and never sends it to Sanity.
- Leave `status` as `draft` while reviewing.
- Publication dates are automatic. The first live import records `Published`; later imports that change article content record `Updated`. Unchanged imports do not move either date.

## Tables inside article_body

Both the regular and temporary draft importer support Markdown pipe tables. Paste the entire article, including the table, into the same `article_body` cell:

```markdown
## Financial performance

The following figures compare the two years.

| Metric | FY25 | FY26 |
| --- | --- | --- |
| Revenue | ₹100 crore | ₹150 crore |
| Net profit / loss | -10 | 15 |

Continue the article here.
```

- Use at least two columns: a heading row, a separator row with at least three hyphens per column, and at least one data row.
- Keep the same number of columns in every row. Malformed recognised tables stop the import before writes and report the article slug and Markdown line number.
- Leave a blank line before and after each table. Multiple tables can appear between normal paragraphs/headings/lists.
- Use `\|` for a literal pipe inside a cell. Empty cells are supported; never omit their separating pipes.
- Outer pipes are optional. Alignment separators such as `:---` or `---:` are accepted, but the existing website table style controls alignment.
- Cells currently contain plain text, not rich Markdown formatting, HTML or merged cells. Do not wrap a real table in triple-backtick code fences; fenced examples are not imported as tables.
- Tables become the existing editable Sanity Table blocks. Audits include their cell text in word counts. Duplicate-slug checks, draft-only protection and publish commands are unchanged.

An existing article with pipe text is not changed automatically. Re-import it deliberately through the regular update workflow to convert its table. The temporary draft importer still refuses an already-used slug.

## Import commands

### Automatic company and people links

Regular and temporary draft article imports automatically add up to **three internal body links total**, counting internal links already present in the cell. There is no minimum: a single safe mention results in one link. Only names already written in the article are linked to existing published company/person profiles. No wording is added and each destination is linked at most once by the automatic rule.

Existing links and text formatting are preserved. Shared person names are skipped rather than guessed. Matching uses exact display names and a small reviewed list of company-name variants. Ordinary-word/product names such as Jupiter require that company in the article's company selections, preventing a scooter mention from linking to the fintech company. Headings, tables and code are not automatically linked. Existing hand-written links above the limit are not silently deleted, but no further automatic links are added.

The workbook cells remain readable text/Markdown. Links are generated during import, so plain text in Excel does not remove the automatic linking feature. This does not change the general overwrite rules: importing an older body can still replace newer Sanity wording. Articles entered directly in Sanity are not automatically scanned by this importer.

A link-only backfill of articles listed in a workbook is available without importing their spreadsheet text or publishing drafts:

```powershell
node --env-file=.env.local scripts/interlink-workbook-articles.mjs "outputs/article-importers/articles-template.xlsx"
```

The default is a dry run. Add `--write` only after reviewing its plan. The write mode saves the original bodies under ignored `outputs/article-interlinks-<timestamp>/before.json`, applies revision-guarded body-only patches, and verifies the saved result. Published and draft versions are handled independently; draft changes are never published. Publication dates, editorial update dates and metadata fields are not patched (Sanity's system modification timestamps necessarily change).

Check everything without writing:

```powershell
npm run import:articles:check -- "outputs/article-importers/articles-template.xlsx"
```

Import as drafts:

```powershell
npm run import:articles -- "outputs/article-importers/articles-template.xlsx"
```

Import only one article or company:

```powershell
node --env-file=.env.local scripts/import-articles.mjs --article=how-zomato-makes-money "outputs/article-importers/articles-template.xlsx"
node --env-file=.env.local scripts/import-articles.mjs --company=zomato "outputs/article-importers/articles-template.xlsx"
```

Publish rows whose `status` is `published`:

```powershell
npm run import:articles:publish -- "outputs/article-importers/articles-template.xlsx"
```

Use the dedicated `:check` and `:publish` commands exactly as shown. This keeps the safety mode inside the command instead of relying on trailing flags that Windows may omit. Without the publish command, even rows marked `published` are safely imported as drafts. Existing articles are matched by permanent `import_id` first, manually uploaded images and other fields are preserved, and unchanged articles are skipped.

Rows containing only prefilled audit formulas are ignored by the importer, so unused prepared rows cannot create empty or phantom articles.

Article slugs must match `^[a-z0-9]+(?:-[a-z0-9]+)*$` exactly. Spaces (including at either end), uppercase letters, repeated hyphens, and leading/trailing hyphens block import before any writes, even for drafts. Slugs are never trimmed or repaired automatically. Studio Publish also blocks invalid slugs and other schema errors. Google Sheets exports must pass this same importer; this repository has no direct Sheets publisher. Sanity API credentials can bypass Studio schema rules, so any external publisher must validate before sending mutations.

`People featured` and `Concepts` can be managed either from the spreadsheet or in Sanity. A populated spreadsheet cell replaces that article's corresponding references. A blank cell preserves the references already stored in Sanity.
