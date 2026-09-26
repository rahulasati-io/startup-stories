# Bulk article import

Use `outputs/article-importers/articles-template.xlsx` for every article type. Add articles only to the **Articles** sheet; the **Example** and **Instructions** sheets are never imported.

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

## Commands

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

`People featured` and `Concepts` can be managed either from the spreadsheet or in Sanity. A populated spreadsheet cell replaces that article's corresponding references. A blank cell preserves the references already stored in Sanity.
