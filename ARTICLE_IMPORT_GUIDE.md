# Bulk Business Model article import

Use `outputs/article-importers/business-model-articles-template.xlsx`. Add articles only to the **Articles** sheet; the **Example** and **Instructions** sheets are never imported.

## Before importing

- `company_slug` must already exist in Sanity. Separate multiple companies with semicolons; the first is treated as the primary company.
- `category_slug` defaults to `business-model` when blank and must already exist in Sanity.
- Approved primary category slugs are `business-model`, `strategy`, `company-story`, and `people-leadership`.
- `author_slug` must already exist in Sanity.
- `people_slugs` is optional. Use semicolon-separated person slugs that already exist in Sanity. When the cell is blank, the importer preserves the article's current people links.
- `concept_slugs` is optional. Use semicolon-separated concept slugs that already exist in Sanity. When the cell is blank, the importer preserves the article's current concept links.
- Write the article in `article_body` using Markdown: `##`/`###` headings, paragraphs separated by blank lines, `**bold**`, `*italics*`, links, bullets, numbered lists, and blockquotes.
- `source_urls` is private working evidence. The importer deliberately ignores it and never sends it to Sanity.
- Leave `status` as `draft` while reviewing.

## Commands

Check everything without writing:

```powershell
npm run import:articles -- "outputs/article-importers/business-model-articles-template.xlsx" --dry-run
```

Import as drafts:

```powershell
npm run import:articles -- "outputs/article-importers/business-model-articles-template.xlsx"
```

Import only one article or company:

```powershell
npm run import:articles -- "outputs/article-importers/business-model-articles-template.xlsx" --article=how-zomato-makes-money
npm run import:articles -- "outputs/article-importers/business-model-articles-template.xlsx" --company=zomato
```

Publish rows whose `status` is `published`:

```powershell
npm run import:articles -- "outputs/article-importers/business-model-articles-template.xlsx" --publish
```

Without `--publish`, even rows marked `published` are safely imported as drafts. Existing articles are matched by slug, manually uploaded images and other fields are preserved, and unchanged articles are skipped.

`People featured` and `Concepts` can be managed either from the spreadsheet or in Sanity. A populated spreadsheet cell replaces that article's corresponding references. A blank cell preserves the references already stored in Sanity.
