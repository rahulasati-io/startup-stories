import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { createClient } from "@sanity/client";

const args = process.argv.slice(2);
const option = (name) => args.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
const includeAllCategories = args.includes("--all");
const showPassed = args.includes("--show-passed");
const strict = args.includes("--strict");
const articleFilter = option("article");
const workbookPath = path.resolve(option("workbook") || "outputs/article-importers/articles-template.xlsx");
const reportPath = path.resolve(option("report") || "outputs/audits/article-audit-report.xlsx");
const categoryFilter = includeAllCategories ? null : "business-model";

const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset, SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !dataset) throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET.");

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2026-08-23",
  useCdn: false,
  perspective: "published",
});

const clean = (value) => value === undefined || value === null ? "" : String(value).trim();
const split = (value) => clean(value).split(/[;\n]+/).map(clean).filter(Boolean);
const normalizedCategory = (value) => {
  const category = clean(value).toLowerCase();
  if (category === "business model") return "business-model";
  if (category === "company story") return "company-story";
  if (category === "people & leadership" || category === "people and leadership") return "people-leadership";
  return category;
};
const validSlug = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean(value));
const countWords = (body) => (body || [])
  .flatMap((block) => block.children || [])
  .map((child) => clean(child.text))
  .join(" ")
  .split(/\s+/)
  .filter(Boolean)
  .length;
const countH2s = (body) => (body || []).filter((block) => block._type === "block" && block.style === "h2").length;
const issue = (severity, code, message) => ({ severity, code, message });
const addToMap = (map, key, value) => {
  if (!key) return;
  map.set(key, [...(map.get(key) || []), value]);
};

const workbook = XLSX.readFile(workbookPath, { cellDates: true });
const worksheet = workbook.Sheets.Articles;
if (!worksheet) throw new Error('The workbook needs an "Articles" sheet.');

const sheetRows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: true })
  .map((row, index) => ({ ...row, _rowNumber: index + 2 }))
  .filter((row) => clean(row.status).toLowerCase() === "published")
  .filter((row) => !categoryFilter || normalizedCategory(row.article_tag) === categoryFilter)
  .filter((row) => !articleFilter || clean(row.article_slug) === articleFilter);

const articles = await client.fetch(/* groq */ `
  *[
    _type == "post" &&
    !(_id in path("drafts.**")) &&
    (!defined($category) || category->slug.current == $category) &&
    (!defined($article) || slug.current == $article)
  ] | order(publishedAt desc) {
    _id,
    importId,
    title,
    "slug": slug.current,
    publishedAt,
    seoTitle,
    seoDescription,
    body[]{ _type, style, children[]{ text } },
    "category": category->{ _id, title, "slug": slug.current },
    "author": author->{ _id, name, "slug": slug.current },
    "companies": company[]->{ _id, name, "slug": slug.current }
  }
`, { category: categoryFilter, article: articleFilter || null });

const rowsByImportId = new Map();
const rowsBySlug = new Map();
for (const row of sheetRows) {
  addToMap(rowsByImportId, clean(row.import_id), row);
  addToMap(rowsBySlug, clean(row.article_slug), row);
}

const articlesByImportId = new Map();
const articlesBySlug = new Map();
const articlesByTitle = new Map();
for (const article of articles) {
  addToMap(articlesByImportId, clean(article.importId), article);
  addToMap(articlesBySlug, clean(article.slug), article);
  addToMap(articlesByTitle, clean(article.title).toLowerCase(), article);
}

const results = [];
const matchedSheetRows = new Set();

for (const article of articles) {
  const problems = [];
  const importId = clean(article.importId);
  const slug = clean(article.slug);
  const matchingRows = importId ? (rowsByImportId.get(importId) || []) : (rowsBySlug.get(slug) || []);
  const row = matchingRows[0];
  if (row) matchedSheetRows.add(row._rowNumber);

  if (!importId) problems.push(issue("ERROR", "missing_import_id", "Sanity article has no permanent import_id."));
  if (importId && (articlesByImportId.get(importId)?.length || 0) > 1) problems.push(issue("ERROR", "duplicate_import_id", `More than one published Sanity article uses import_id ${importId}.`));
  if (!slug || !validSlug(slug)) problems.push(issue("ERROR", "invalid_slug", "Article slug is missing or invalid."));
  if (slug && (articlesBySlug.get(slug)?.length || 0) > 1) problems.push(issue("ERROR", "duplicate_slug", `More than one published Sanity article uses slug ${slug}.`));
  if (!clean(article.title)) problems.push(issue("ERROR", "missing_title", "Article title is missing."));
  if (clean(article.title) && (articlesByTitle.get(clean(article.title).toLowerCase())?.length || 0) > 1) problems.push(issue("WARNING", "duplicate_title", "Another published article has the same title."));
  if (!article.category?.slug) problems.push(issue("ERROR", "missing_category", "Article category is missing or unresolved."));
  if (!article.author?.slug || !article.author?.name) problems.push(issue("ERROR", "missing_author", "Author is missing or unresolved."));
  if (!Array.isArray(article.companies) || article.companies.length === 0) problems.push(issue("ERROR", "missing_company", "No company is linked."));
  if ((article.companies || []).some((company) => !company?.slug || !company?.name)) problems.push(issue("ERROR", "unresolved_company", "At least one linked company is unresolved."));

  const publicationDate = article.publishedAt ? new Date(article.publishedAt) : null;
  if (!publicationDate || Number.isNaN(publicationDate.getTime())) problems.push(issue("ERROR", "missing_date", "Published date is missing or invalid."));
  else if (publicationDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) problems.push(issue("ERROR", "future_date", "Published date is in the future."));

  const wordCount = countWords(article.body);
  const h2Count = countH2s(article.body);
  if (wordCount < 150) problems.push(issue("ERROR", "incomplete_body", `Article has only ${wordCount} words.`));
  else if (wordCount < 600) problems.push(issue("WARNING", "short_body", `Article has ${wordCount} words; review whether it is complete.`));
  if (h2Count === 0) problems.push(issue("ERROR", "missing_h2", "Article has no H2 section headings."));
  else if (h2Count < 3) problems.push(issue("WARNING", "few_h2", `Article has only ${h2Count} H2 section headings.`));

  const seoTitle = clean(article.seoTitle);
  const seoDescription = clean(article.seoDescription);
  if (!seoTitle) problems.push(issue("WARNING", "missing_seo_title", "SEO title is blank; the page will fall back to the article title."));
  else if (seoTitle.length < 30 || seoTitle.length > 65) problems.push(issue("WARNING", "seo_title_length", `SEO title is ${seoTitle.length} characters; review the search-result display.`));
  if (!seoDescription) problems.push(issue("ERROR", "missing_seo_description", "SEO description is blank."));
  else if (seoDescription.length < 120 || seoDescription.length > 170) problems.push(issue("WARNING", "seo_description_length", `SEO description is ${seoDescription.length} characters; aim for roughly 140–160.`));

  if (!row) {
    problems.push(issue("ERROR", "missing_sheet_row", "Published article was not found in the master spreadsheet."));
  } else {
    if ((rowsByImportId.get(clean(row.import_id))?.length || 0) > 1) problems.push(issue("ERROR", "duplicate_sheet_import_id", `Spreadsheet import_id ${clean(row.import_id)} appears more than once.`));
    if ((rowsBySlug.get(clean(row.article_slug))?.length || 0) > 1) problems.push(issue("ERROR", "duplicate_sheet_slug", `Spreadsheet slug ${clean(row.article_slug)} appears more than once.`));
    if (clean(row.article_slug) !== slug) problems.push(issue("ERROR", "slug_mismatch", `Spreadsheet slug is ${clean(row.article_slug)} but Sanity slug is ${slug}.`));
    if (clean(row.title) !== clean(article.title)) problems.push(issue("ERROR", "title_mismatch", "Spreadsheet title does not match the published Sanity title."));
  }

  const errorCount = problems.filter((problem) => problem.severity === "ERROR").length;
  const warningCount = problems.filter((problem) => problem.severity === "WARNING").length;
  results.push({
    status: errorCount ? "BLOCKED" : warningCount ? "REVIEW" : "PASS",
    slug,
    title: clean(article.title) || "Untitled article",
    companies: (article.companies || []).map((company) => company?.name || company?.slug).filter(Boolean).join(", "),
    wordCount,
    h2Count,
    problems,
  });
}

for (const row of sheetRows) {
  if (matchedSheetRows.has(row._rowNumber)) continue;
  results.push({
    status: "BLOCKED",
    slug: clean(row.article_slug),
    title: clean(row.title) || "Untitled spreadsheet row",
    companies: split(row.company_slug).join(", "),
    wordCount: 0,
    h2Count: 0,
    problems: [issue("ERROR", "not_live", `Spreadsheet row ${row._rowNumber} is marked published but no matching live Sanity article was found.`)],
  });
}

const rank = { BLOCKED: 0, REVIEW: 1, PASS: 2 };
results.sort((left, right) => rank[left.status] - rank[right.status] || left.title.localeCompare(right.title));
const blocked = results.filter((result) => result.status === "BLOCKED");
const review = results.filter((result) => result.status === "REVIEW");
const passed = results.filter((result) => result.status === "PASS");
const errors = results.flatMap((result) => result.problems).filter((problem) => problem.severity === "ERROR");
const warnings = results.flatMap((result) => result.problems).filter((problem) => problem.severity === "WARNING");

const reportRows = (items) => items.map((result) => ({
  Status: result.status,
  Title: result.title,
  "Article slug": result.slug,
  Companies: result.companies,
  "Word count": result.wordCount,
  "H2 headings": result.h2Count,
  Errors: result.problems.filter((problem) => problem.severity === "ERROR").map((problem) => problem.message).join(" | "),
  Warnings: result.problems.filter((problem) => problem.severity === "WARNING").map((problem) => problem.message).join(" | "),
}));

const makeSheet = (items) => {
  const columns = ["Status", "Title", "Article slug", "Companies", "Word count", "H2 headings", "Errors", "Warnings"];
  const sheet = XLSX.utils.json_to_sheet(reportRows(items), { header: columns });
  sheet["!autofilter"] = { ref: `A1:H${Math.max(items.length + 1, 1)}` };
  sheet["!cols"] = [
    { wch: 11 }, { wch: 55 }, { wch: 42 }, { wch: 28 },
    { wch: 12 }, { wch: 12 }, { wch: 85 }, { wch: 85 },
  ];
  return sheet;
};

const reportWorkbook = XLSX.utils.book_new();
const summarySheet = XLSX.utils.aoa_to_sheet([
  ["MisterStory article content audit"],
  ["Generated", new Date().toISOString()],
  ["Scope", categoryFilter || "all categories"],
  ["Source workbook", workbookPath],
  ["Articles checked", results.length],
  ["Passed", passed.length],
  ["Needs review", review.length],
  ["Blocked", blocked.length],
  ["Errors", errors.length],
  ["Warnings", warnings.length],
  [],
  ["How to use"],
  ["1", "Fix every item on the Blocked sheet before launch."],
  ["2", "Review the Review sheet; these are improvements, not publishing failures."],
  ["3", "Rerun npm run audit:articles after updating the spreadsheet or Sanity."],
]);
summarySheet["!cols"] = [{ wch: 22 }, { wch: 100 }];
XLSX.utils.book_append_sheet(reportWorkbook, summarySheet, "Summary");
XLSX.utils.book_append_sheet(reportWorkbook, makeSheet(blocked), "Blocked");
XLSX.utils.book_append_sheet(reportWorkbook, makeSheet(review), "Review");
XLSX.utils.book_append_sheet(reportWorkbook, makeSheet(passed), "Passed");
XLSX.utils.book_append_sheet(reportWorkbook, makeSheet(results), "All articles");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
XLSX.writeFile(reportWorkbook, reportPath);

console.log(`\nMisterStory article content audit`);
console.log(`Scope: ${categoryFilter || "all categories"}`);
console.log(`Workbook: ${workbookPath}`);
console.log(`Articles checked: ${results.length}`);
console.log(`PASS: ${passed.length}  REVIEW: ${review.length}  BLOCKED: ${blocked.length}`);
console.log(`Errors: ${errors.length}  Warnings: ${warnings.length}\n`);
console.log(`Excel report: ${reportPath}\n`);

for (const result of results) {
  if (result.status === "PASS" && !showPassed) continue;
  console.log(`${result.status}  ${result.title}`);
  console.log(`  /articles/${result.slug || "missing-slug"} | ${result.companies || "No company"} | ${result.wordCount} words | ${result.h2Count} H2s`);
  for (const problem of result.problems) console.log(`  ${problem.severity}: ${problem.message}`);
  console.log("");
}

if (!blocked.length && !review.length) console.log("All checked articles passed the launch-content checks.");
else if (blocked.length) console.log("Fix BLOCKED articles first. REVIEW items are improvements rather than publishing failures.");
else console.log("No publishing blockers were found. Review the warning items before launch where practical.");

if (strict && blocked.length) process.exitCode = 1;
