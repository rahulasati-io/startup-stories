import path from "path";
import XLSX from "xlsx";
import { createClient } from "@sanity/client";

const filePath = process.argv[2];
const companyFilter = process.argv.find((argument) => argument.startsWith("--company="))?.split("=")[1];
const personFilter = process.argv.find((argument) => argument.startsWith("--person="))?.split("=")[1];
if (!filePath) throw new Error('Usage: node scripts/import-companies.mjs "companies.xlsx"');
const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset, SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !dataset || !token) throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, or SANITY_WRITE_TOKEN.");
const client = createClient({ projectId, dataset, token, apiVersion: "2026-08-23", useCdn: false });
const workbook = XLSX.readFile(path.resolve(filePath));
const clean = (value) => value === undefined || value === null ? "" : String(value).trim();
const rows = (sheet) => workbook.Sheets[sheet] ? XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval: "" }) : [];
const split = (value) => clean(value).split(";").map(clean).filter(Boolean);
const slugify = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const normalizeRelationship = (value) => {
  const relationship = clean(value).toLowerCase();
  if (relationship.includes("acquirer")) return "acquirer";
  if (relationship.includes("co-founder") || relationship.includes("cofounder")) return "coFounder";
  if (relationship.includes("founder")) return "founder";
  if (relationship.includes("promoter")) return "promoter";
  if (relationship.includes("chair")) return "chairperson";
  if (relationship.includes("managing director")) return "managingDirector";
  if (relationship.includes("chief executive") || relationship === "ceo") return "chiefExecutive";
  if (relationship.includes("owner")) return "owner";
  return "other";
};
const normalizeStatus = (value) => {
  const status = clean(value).toLowerCase();
  return ["current", "former", "historical"].includes(status) ? status : "current";
};
const inlinePortableText = (value, blockIndex, keyPrefix) => {
  const text = clean(value);
  const children = [];
  const markDefs = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let cursor = 0;
  let match;
  const addSpan = (spanText, marks = []) => {
    if (!spanText) return;
    children.push({ _key: `${keyPrefix}-span-${blockIndex}-${children.length}`, _type: "span", text: spanText, marks });
  };
  while ((match = pattern.exec(text)) !== null) {
    addSpan(text.slice(cursor, match.index));
    if (match[1]) {
      addSpan(match[1], ["strong"]);
    } else {
      const markKey = `${keyPrefix}-link-${blockIndex}-${markDefs.length}`;
      markDefs.push({ _key: markKey, _type: "link", href: match[3] });
      addSpan(match[2], [markKey]);
    }
    cursor = pattern.lastIndex;
  }
  addSpan(text.slice(cursor));
  return { children, markDefs };
};
const portableText = (value, keyPrefix = "content") => clean(value).split(/\r?\n\s*\r?\n/).map((text, index) => {
  const normalizedText = text.replace(/\r?\n/g, " ");
  const isHeading = /^##\s+/.test(normalizedText);
  const { children, markDefs } = inlinePortableText(normalizedText.replace(/^##\s+/, ""), index, keyPrefix);
  return { _key: `${keyPrefix}-${index}`, _type: "block", style: isHeading ? "h2" : "normal", children, markDefs };
}).filter((block) => block.children.length);
const plainPortableText = (value) => clean(value).split(/\r?\n\s*\r?\n/).map((text, index) => ({ _key: `overview-${index}`, _type: "block", style: "normal", children: [{ _key: `span-${index}`, _type: "span", text, marks: [] }], markDefs: [] })).filter((block) => block.children[0].text);
const required = (row, fields, sheet, rowNumber) => fields.forEach((field) => { if (!clean(row[field])) throw new Error(`${sheet} row ${rowNumber}: ${field} is required.`); });
const reference = (id) => ({ _type: "reference", _ref: id });
const verification = (row) => ({
  verificationStatus: clean(row.verification_status) || (clean(row.source_url) ? "sourceAdded" : "needsResearch"),
  sourceDate: clean(row.source_date) || undefined,
  internalNotes: clean(row.internal_notes) || undefined,
});
const sameValue = (left, right) => JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
const hasChanges = (existing, next) => Object.entries(next).some(([field, value]) => !sameValue(existing?.[field], value));
const chunk = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runWorker));
  return results;
}

async function batchReplace(documents, label) {
  if (!documents.length) return { changed: 0, skipped: 0 };
  const ids = documents.map(({ _id }) => _id);
  const existingDocuments = await client.fetch(`*[_id in $ids]`, { ids });
  const existingById = new Map(existingDocuments.map((document) => [document._id, document]));
  const changed = documents.filter((document) => !existingById.has(document._id) || hasChanges(existingById.get(document._id), document));
  for (const [batchIndex, batch] of chunk(changed, 50).entries()) {
    let transaction = client.transaction();
    for (const document of batch) transaction = transaction.createOrReplace(document);
    await transaction.commit();
    console.log(`${label}: ${Math.min((batchIndex + 1) * 50, changed.length)}/${changed.length} changed records written`);
  }
  return { changed: changed.length, skipped: documents.length - changed.length };
}

async function run() {
  const allPeopleRows = rows("People");
  const peopleRows = allPeopleRows.filter((row) =>
    (!companyFilter || clean(row.company_slug) === companyFilter) &&
    (!personFilter || clean(row.person_slug || row.founder_slug) === personFilter)
  );
  if (personFilter && !peopleRows.length) throw new Error(`No People row found for person_slug "${personFilter}".`);
  const personCompanySlugs = new Set(peopleRows.map((row) => clean(row.company_slug)).filter(Boolean));
  const companies = rows("Companies").filter((row) =>
    personFilter ? personCompanySlugs.has(clean(row.company_slug)) : (!companyFilter || clean(row.company_slug) === companyFilter)
  );
  if (!companies.length) throw new Error('The workbook needs a "Companies" sheet with at least one row.');
  const relatedRows = (sheet) => personFilter ? [] : rows(sheet).filter((row) => !companyFilter || clean(row.company_slug) === companyFilter);
  const peopleRoles = peopleRows
    .filter((row) => clean(row.company_slug) && (!companyFilter || clean(row.company_slug) === companyFilter))
    .map((row) => ({
      ...row,
      id: clean(row.id) || slugify(`${clean(row.company_slug)}-${clean(row.person_slug || row.founder_slug)}-${clean(row.relationship)}-${clean(row.role_title)}`),
    }));
  const funding = relatedRows("Funding Rounds");
  const timeline = relatedRows("Timeline Events");
  const metrics = relatedRows("Metrics");
  const industryNames = [...new Set(companies.map((row) => clean(row.industry)).filter(Boolean))];
  const industrySlugs = industryNames.map(slugify);
  const existingIndustries = industrySlugs.length
    ? await client.fetch(`*[_type == "industry" && slug.current in $slugs]{_id,name,slug}`, { slugs: industrySlugs })
    : [];
  const industryIdBySlug = new Map(existingIndustries.map((industry) => [industry.slug.current, industry._id]));
  await mapLimit(industryNames, 8, async (name) => {
    const slug = slugify(name);
    if (industryIdBySlug.has(slug)) return;
    const saved = await client.create({ _type: "industry", name, slug: { _type: "slug", current: slug } });
    industryIdBySlug.set(slug, saved._id);
  });
  const slugs = new Set();
  const companyIds = new Map();
  const companyInputs = companies.map((row, index) => {
    required(row, ["company_slug", "company_name"], "Companies", index + 2);
    const slug = clean(row.company_slug);
    if (slugs.has(slug)) throw new Error(`Companies row ${index + 2}: duplicate company_slug "${slug}".`);
    slugs.add(slug);
    const overview = plainPortableText(row.company_overview);
    const industryName = clean(row.industry);
    const industryId = industryName ? industryIdBySlug.get(slugify(industryName)) : undefined;
    const data = { _type: "company", name: clean(row.company_name), slug: { _type: "slug", current: slug }, industryCategory: industryId ? reference(industryId) : undefined, foundedYear: clean(row.founded_year) ? Number(row.founded_year) : undefined, founders: split(row.founders), description: clean(row.short_description) || undefined, seoTitle: clean(row.meta_title || row.seo_title) || undefined, seoDescription: clean(row.meta_description || row.seo_description) || undefined, ...(overview.length ? { body: overview } : {}) };
    return { row, slug, data };
  });
  const existingCompanies = companyInputs.length
    ? await client.fetch(`*[_type == "company" && slug.current in $slugs]{_id,name,slug,industry,industryCategory,foundedYear,founders,description,body,parentCompany,seoTitle,seoDescription}`, { slugs: [...slugs] })
    : [];
  const existingCompanyBySlug = new Map(existingCompanies.map((company) => [company.slug.current, company]));
  let companyProgress = 0;
  const savedCompanies = await mapLimit(companyInputs, 8, async ({ slug, data }) => {
    const existing = existingCompanyBySlug.get(slug);
    const saved = !existing ? await client.create(data) : hasChanges(existing, data) ? await client.patch(existing._id).set(data).commit() : existing;
    companyProgress += 1;
    if (companyProgress % 20 === 0 || companyProgress === companyInputs.length) console.log(`Companies: ${companyProgress}/${companyInputs.length} checked`);
    return { slug, saved };
  });
  for (const { slug, saved } of savedCompanies) companyIds.set(slug, saved._id);

  await mapLimit(companyInputs, 8, async ({ row, slug }, index) => {
    const parentSlug = clean(row.parent_company_slug);
    if (!parentSlug) return;
    if (parentSlug === slug) throw new Error(`Companies row ${index + 2}: a company cannot be its own parent.`);
    let parentId = companyIds.get(parentSlug);
    if (!parentId) {
      const parent = await client.fetch(`*[_type == "company" && slug.current == $slug][0]{_id}`, { slug: parentSlug });
      parentId = parent?._id;
    }
    if (!parentId) throw new Error(`Companies row ${index + 2}: parent_company_slug "${parentSlug}" was not found in the workbook or Sanity.`);
    const currentParentId = existingCompanyBySlug.get(slug)?.parentCompany?._ref;
    if (currentParentId !== parentId) await client.patch(companyIds.get(slug)).set({ parentCompany: reference(parentId) }).commit();
  });

  const people = [...peopleRows.reduce((unique, row, index) => {
    const slug = clean(row.person_slug || row.founder_slug);
    const name = clean(row.person_name || row.founder_name);
    if (!slug || !name) throw new Error(`People row ${index + 2}: person_slug and person_name are required.`);
    const existing = unique.get(slug);
    if (existing && clean(existing.person_name || existing.founder_name) !== name) throw new Error(`People row ${index + 2}: person_slug "${slug}" is used for more than one name.`);
    if (!existing) unique.set(slug, row);
    return unique;
  }, new Map()).values()];
  const profileBySlug = rows("Person Profiles").reduce((profiles, row, index) => {
    const slug = clean(row.person_slug);
    if (!slug) throw new Error(`Person Profiles row ${index + 2}: person_slug is required.`);
    if (profiles.has(slug)) throw new Error(`Person Profiles row ${index + 2}: duplicate person_slug "${slug}".`);
    profiles.set(slug, row);
    return profiles;
  }, new Map());
  const personIds = new Map();
  const personInputs = people.map((row, index) => {
    const slug = clean(row.person_slug || row.founder_slug);
    const name = clean(row.person_name || row.founder_name);
    if (!slug || !name) throw new Error(`People row ${index + 2}: person_slug and person_name are required.`);
    const profile = profileBySlug.get(slug);
    const profileName = clean(profile?.person_name);
    if (profileName && profileName !== name) throw new Error(`Person Profiles: person_name "${profileName}" does not match People name "${name}" for person_slug "${slug}".`);
    const biography = portableText(profile?.biography, `bio-${slug}`);
    const linkedinUrl = clean(profile?.linkedin_url) || clean(row.linkedin_url);
    const data = {
      _type: "founder",
      name,
      slug: { _type: "slug", current: slug },
      role: clean(profile?.primary_role) || clean(row.primary_role || row.role) || undefined,
      website: clean(row.website) || undefined,
      ...(linkedinUrl ? { linkedinUrl } : {}),
      ...(biography.length ? { bio: biography } : {}),
    };
    return { slug, data };
  });
  const personSlugs = personInputs.map(({ slug }) => slug);
  const existingPeople = personSlugs.length
    ? await client.fetch(`*[_type == "founder" && slug.current in $slugs]{_id,name,slug,role,website,linkedinUrl,bio}`, { slugs: personSlugs })
    : [];
  const existingPersonBySlug = new Map(existingPeople.map((person) => [person.slug.current, person]));
  let peopleProgress = 0;
  const savedPeople = await mapLimit(personInputs, 8, async ({ slug, data }) => {
    const existing = existingPersonBySlug.get(slug);
    const saved = !existing ? await client.create(data) : hasChanges(existing, data) ? await client.patch(existing._id).set(data).commit() : existing;
    peopleProgress += 1;
    if (peopleProgress % 20 === 0 || peopleProgress === personInputs.length) console.log(`People: ${peopleProgress}/${personInputs.length} checked`);
    return { slug, saved };
  });
  for (const { slug, saved } of savedPeople) personIds.set(slug, saved._id);

  const companyRef = (row, sheet, rowNumber) => { const slug = clean(row.company_slug); if (!slugs.has(slug)) throw new Error(`${sheet} row ${rowNumber}: company_slug "${slug}" is not on the Companies sheet.`); return reference(companyIds.get(slug)); };
  const prepareDocuments = (items, sheet, type, map) => items.map((row, index) => { required(row, ["company_slug"], sheet, index + 2); const key = clean(row.id) || `${clean(row.company_slug)}-${index + 2}`; return { _id: `${type}-${key}`, _type: type, company: companyRef(row, sheet, index + 2), ...map(row) }; });
  const roleDocuments = prepareDocuments(peopleRoles, "People", "companyPersonRole", (row) => {
    const personSlug = clean(row.person_slug);
    if (!personIds.has(personSlug)) throw new Error(`People: person_slug "${personSlug}" could not be imported.`);
    return { person: reference(personIds.get(personSlug)), relationship: normalizeRelationship(row.relationship), roleTitle: clean(row.role_title) || undefined, startDate: clean(row.start_date) || undefined, endDate: clean(row.end_date) || undefined, status: normalizeStatus(row.status), notes: clean(row.notes) || undefined, verificationStatus: clean(row.verification_status) || "needsResearch", sourceDate: clean(row.source_date) || undefined, internalNotes: clean(row.internal_notes) || undefined };
  });
  const fundingDocuments = prepareDocuments(funding, "Funding Rounds", "fundingRound", (row) => ({ round: clean(row.round), date: clean(row.date) || undefined, amount: clean(row.amount) ? Number(row.amount) : undefined, currency: clean(row.currency) || undefined, investors: split(row.investors), notes: clean(row.notes) || undefined, sourceUrl: clean(row.source_url) || undefined, ...verification(row) }));
  const timelineDocuments = prepareDocuments(timeline, "Timeline Events", "timelineEvent", (row) => ({ date: clean(row.date), title: clean(row.title), description: clean(row.description) || undefined, sourceUrl: clean(row.source_url) || undefined, ...verification(row) }));
  const metricDocuments = prepareDocuments(metrics, "Metrics", "companyMetric", (row) => ({ label: clean(row.label), value: clean(row.value), period: clean(row.period) || undefined, notes: clean(row.notes) || undefined, sourceUrl: clean(row.source_url) || undefined, ...verification(row) }));
  const roleResult = await batchReplace(roleDocuments, "People roles");
  const fundingResult = await batchReplace(fundingDocuments, "Funding rounds");
  const timelineResult = await batchReplace(timelineDocuments, "Timeline events");
  const metricResult = await batchReplace(metricDocuments, "Metrics");
  console.log(`Imported ${companies.length} companies, ${people.length} people, ${peopleRoles.length} company roles, ${funding.length} funding rounds, ${timeline.length} timeline events, and ${metrics.length} metrics.`);
  console.log(`Skipped unchanged related records: ${roleResult.skipped + fundingResult.skipped + timelineResult.skipped + metricResult.skipped}.`);
}
run().catch((error) => { console.error(`Import failed: ${error.message}`); process.exit(1); });
