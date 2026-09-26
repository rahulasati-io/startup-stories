import path from "node:path";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import XLSX from "xlsx";
import { createClient } from "@sanity/client";
import { markdownToPortableText } from "./lib/markdown-to-portable-text.mjs";

const args = process.argv.slice(2);
const filePath = args.find((argument) => !argument.startsWith("--"));
const option = (name) => args.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
const articleFilter = option("article");
const companyFilter = option("company");
const dryRun = args.includes("--dry-run");
const allowPublish = args.includes("--publish");
if (!filePath) throw new Error('Usage: npm run import:articles -- "articles.xlsx" [--dry-run] [--article=slug] [--company=slug] [--publish]');

const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset, SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !dataset || (!token && !dryRun)) {
  throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, or SANITY_WRITE_TOKEN.");
}
const client = createClient({ projectId, dataset, token, apiVersion: "2026-08-23", useCdn: false, perspective: "raw" });
const workbook = XLSX.readFile(path.resolve(filePath), { cellDates: true });
const worksheet = workbook.Sheets.Articles;
if (!worksheet) throw new Error('The workbook needs an "Articles" sheet. Example and Instructions sheets are never imported.');

const clean = (value) => value === undefined || value === null ? "" : String(value).trim();
const split = (value) => clean(value).split(";").map(clean).filter(Boolean);
const reference = (id) => ({ _type: "reference", _ref: id });
const validSlug = (slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
const categoryAliases = new Map([
  ["business model", "business-model"],
  ["business-model", "business-model"],
  ["strategy", "strategy"],
  ["company story", "company-story"],
  ["company-story", "company-story"],
  ["people & leadership", "people-leadership"],
  ["people and leadership", "people-leadership"],
  ["people-leadership", "people-leadership"],
]);
const same = (left, right) => isDeepStrictEqual(left ?? null, right ?? null);
const controlledFields = ["importId", "title", "thumbnailTitle", "slug", "body", "category", "company", "author", "seoTitle", "seoDescription"];
const publicContentFields = ["title", "thumbnailTitle", "slug", "body", "category", "company", "author", "seoTitle", "seoDescription"];
const stripSystem = (document) => Object.fromEntries(Object.entries(document).filter(([field]) => !["_rev", "_createdAt", "_updatedAt"].includes(field)));
const changed = (document, values, fields = controlledFields) => fields.some((field) => !same(document?.[field], values[field]));
const progress = (done, total) => { if (done % 20 === 0 || done === total) console.log(`Articles: ${done}/${total} checked`); };

async function run() {
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: true });
  const filtered = rawRows.filter((row) =>
    (!articleFilter || clean(row.article_slug) === articleFilter) &&
    (!companyFilter || split(row.company_slug).includes(companyFilter))
  );
  if (!filtered.length) throw new Error("No matching rows were found on the Articles sheet.");

  const slugs = new Set();
  const importIds = new Set();
  const inputs = filtered.map((row, index) => {
    const rowNumber = index + 2;
    const importId = clean(row.import_id);
    const slug = clean(row.article_slug);
    const title = clean(row.title);
    const thumbnailTitle = clean(row.thumbnail_title) || undefined;
    const companySlugs = split(row.company_slug);
    const categoryInput = clean(row.article_tag) || clean(row.category_slug);
    const categorySlug = categoryAliases.get(categoryInput.toLowerCase()) || categoryInput;
    const authorSlug = clean(row.author_slug);
    const hasPeopleSlugs = clean(row.people_slugs) !== "";
    const peopleSlugs = split(row.people_slugs);
    const hasConceptSlugs = clean(row.concept_slugs) !== "";
    const conceptSlugs = split(row.concept_slugs);
    const bodyMarkdown = clean(row.article_body);
    const status = (clean(row.status) || "draft").toLowerCase();
    const missing = [["import_id", importId], ["article_slug", slug], ["company_slug", companySlugs.length], ["title", title], ["article_tag", categoryInput], ["author_slug", authorSlug], ["article_body", bodyMarkdown]].filter(([, value]) => !value).map(([name]) => name);
    if (missing.length) throw new Error(`Articles row ${rowNumber}: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required.`);
    if (!validSlug(importId)) throw new Error(`Articles row ${rowNumber}: import_id must use lowercase letters, numbers and hyphens only.`);
    if (!validSlug(slug)) throw new Error(`Articles row ${rowNumber}: article_slug must use lowercase letters, numbers and hyphens only.`);
    if (importIds.has(importId)) throw new Error(`Articles row ${rowNumber}: duplicate import_id "${importId}".`);
    if (slugs.has(slug)) throw new Error(`Articles row ${rowNumber}: duplicate article_slug "${slug}".`);
    if (!["draft", "published"].includes(status)) throw new Error(`Articles row ${rowNumber}: status must be draft or published.`);
    importIds.add(importId);
    slugs.add(slug);
    return { rowNumber, importId, slug, title, thumbnailTitle, companySlugs, categorySlug, authorSlug, hasPeopleSlugs, peopleSlugs, hasConceptSlugs, conceptSlugs, status, body: markdownToPortableText(bodyMarkdown, slug), seoTitle: clean(row.seo_title) || undefined, seoDescription: clean(row.seo_description) || undefined };
  });

  const companySlugs = [...new Set(inputs.flatMap((input) => input.companySlugs))];
  const categorySlugs = [...new Set(inputs.map((input) => input.categorySlug))];
  const authorSlugs = [...new Set(inputs.map((input) => input.authorSlug))];
  const peopleSlugs = [...new Set(inputs.flatMap((input) => input.peopleSlugs))];
  const conceptSlugs = [...new Set(inputs.flatMap((input) => input.conceptSlugs))];
  const [companies, categories, authors, people, concepts, articles] = await Promise.all([
    client.fetch(`*[_type == "company" && slug.current in $slugs]{_id,"slug":slug.current}`, { slugs: companySlugs }),
    client.fetch(`*[_type == "category" && slug.current in $slugs]{_id,"slug":slug.current}`, { slugs: categorySlugs }),
    client.fetch(`*[_type == "author" && slug.current in $slugs]{_id,"slug":slug.current}`, { slugs: authorSlugs }),
    peopleSlugs.length ? client.fetch(`*[_type == "founder" && slug.current in $slugs]{_id,"slug":slug.current}`, { slugs: peopleSlugs }) : [],
    conceptSlugs.length ? client.fetch(`*[_type == "concept" && slug.current in $slugs]{_id,"slug":slug.current}`, { slugs: conceptSlugs }) : [],
    client.fetch(`*[_type == "post" && (importId in $importIds || slug.current in $slugs)]|order(_updatedAt asc){...,"slugValue":slug.current}`, { importIds: [...importIds], slugs: [...slugs] }),
  ]);
  const companiesBySlug = new Map(companies.map((item) => [item.slug, item._id]));
  const categoriesBySlug = new Map(categories.map((item) => [item.slug, item._id]));
  const authorsBySlug = new Map(authors.map((item) => [item.slug, item._id]));
  const peopleBySlug = new Map(people.map((item) => [item.slug, item._id]));
  const conceptsBySlug = new Map(concepts.map((item) => [item.slug, item._id]));
  const articlesBySlug = new Map();
  const articlesByImportId = new Map();

  function addArticlePair(map, key, article, identityLabel) {
    if (!key) return;
    const baseId = article._id.replace(/^drafts\./, "");
    const pair = map.get(key) || { baseId };
    if (pair.baseId !== baseId) {
      throw new Error(`Sanity contains multiple article records with ${identityLabel} "${key}". Resolve the duplicate before importing.`);
    }
    pair[article._id.startsWith("drafts.") ? "draft" : "published"] = article;
    map.set(key, pair);
  }

  for (const article of articles) {
    addArticlePair(articlesBySlug, article.slugValue, article, "slug");
    addArticlePair(articlesByImportId, article.importId, article, "import_id");
  }

  const errors = [];
  for (const input of inputs) {
    for (const slug of input.companySlugs) if (!companiesBySlug.has(slug)) errors.push(`row ${input.rowNumber}: company_slug "${slug}" was not found in Sanity`);
    if (!categoriesBySlug.has(input.categorySlug)) errors.push(`row ${input.rowNumber}: article_tag "${input.categorySlug}" was not found in Sanity`);
    if (!authorsBySlug.has(input.authorSlug)) errors.push(`row ${input.rowNumber}: author_slug "${input.authorSlug}" was not found in Sanity`);
    for (const slug of input.peopleSlugs) if (!peopleBySlug.has(slug)) errors.push(`row ${input.rowNumber}: people_slugs value "${slug}" was not found in Sanity`);
    for (const slug of input.conceptSlugs) if (!conceptsBySlug.has(slug)) errors.push(`row ${input.rowNumber}: concept_slugs value "${slug}" was not found in Sanity`);
  }
  if (errors.length) throw new Error(`Reference validation failed:\n- ${errors.join("\n- ")}`);

  let written = 0;
  let skipped = 0;
  let heldAsDraft = 0;
  for (const [index, input] of inputs.entries()) {
    const existingById = articlesByImportId.get(input.importId);
    const existingBySlug = articlesBySlug.get(input.slug);
    if (existingById && existingBySlug && existingById.baseId !== existingBySlug.baseId) {
      throw new Error(`Articles row ${input.rowNumber}: import_id "${input.importId}" and article_slug "${input.slug}" point to different Sanity articles. Resolve the duplicate before importing.`);
    }
    const existing = existingById || existingBySlug || {};
    const values = {
      _type: "post",
      importId: input.importId,
      title: input.title,
      thumbnailTitle: input.thumbnailTitle,
      slug: { _type: "slug", current: input.slug },
      body: input.body,
      category: reference(categoriesBySlug.get(input.categorySlug)),
      company: input.companySlugs.map((slug) => ({ ...reference(companiesBySlug.get(slug)), _key: `company-${slug}` })),
      author: reference(authorsBySlug.get(input.authorSlug)),
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
    };
    const comparedFields = [...controlledFields];
    const comparedPublicFields = [...publicContentFields];
    if (input.hasPeopleSlugs) {
      values.people = input.peopleSlugs.map((slug) => ({ ...reference(peopleBySlug.get(slug)), _key: `person-${slug}` }));
      comparedFields.push("people");
      comparedPublicFields.push("people");
    }
    if (input.hasConceptSlugs) {
      values.concepts = input.conceptSlugs.map((slug) => ({ ...reference(conceptsBySlug.get(slug)), _key: `concept-${slug}` }));
      comparedFields.push("concepts");
      comparedPublicFields.push("concepts");
    }
    const shouldPublish = input.status === "published" && allowPublish;
    if (input.status === "published" && !allowPublish) heldAsDraft += 1;
    const comparison = shouldPublish ? existing.published : (existing.draft || existing.published);
    if (comparison && !changed(comparison, values, comparedFields) && (shouldPublish ? Boolean(existing.published) : Boolean(existing.draft))) {
      skipped += 1;
      progress(index + 1, inputs.length);
      continue;
    }
    if (!dryRun) {
      const baseId = existing.published?._id || existing.draft?._id.replace(/^drafts\./, "") || randomUUID();
      const source = stripSystem(existing.draft || existing.published || {});
      const now = new Date().toISOString();
      const dateValues = shouldPublish
        ? existing.published
          ? changed(existing.published, values, comparedPublicFields)
            ? { contentUpdatedAt: now }
            : {}
          : { publishedAt: source.publishedAt || now }
        : {};
      const document = { ...source, ...values, ...dateValues, _id: shouldPublish ? baseId : `drafts.${baseId}` };
      if (shouldPublish) {
        let transaction = client.transaction().createOrReplace(document);
        if (existing.draft) transaction = transaction.delete(existing.draft._id);
        await transaction.commit();
      } else {
        await client.createOrReplace(document);
      }
    }
    written += 1;
    progress(index + 1, inputs.length);
  }
  if (dryRun) console.log(`Dry run complete: ${written} row(s) would change and ${skipped} are unchanged.`);
  else console.log(`Import complete: ${written} row(s) changed and ${skipped} were unchanged.`);
  if (heldAsDraft) console.log(`${heldAsDraft} row(s) marked published were kept as drafts because --publish was not supplied.`);
  console.log("The source_urls column was ignored and no source URL was sent to Sanity.");
}

run().catch((error) => { console.error(`Article import failed: ${error.message}`); process.exit(1); });
