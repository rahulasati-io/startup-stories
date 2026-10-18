import {defineQuery} from 'groq';
import {planAnnualFinancials} from './company-financials.mjs';

const COMPANIES = defineQuery(`*[_type == "company" && slug.current in $slugs && !(_id in path("drafts.**"))]{_id,"slug":slug.current}`);
const METRICS = defineQuery(`*[_type == "companyMetric" && company._ref in $ids && !(_id in path("versions.**"))]{...,"companySlug":company->slug.current}`);

export async function prepareAnnualFinancials(client, observations, {allowMissingCompanies = false} = {}) {
  if (!observations.length) return [];
  const companies = await client.fetch(COMPANIES, {slugs: [...new Set(observations.map(row => row.companySlug))]}, {perspective: 'published'});
  const counts = new Map();
  for (const company of companies) counts.set(company.slug, (counts.get(company.slug) || 0) + 1);
  for (const input of observations) {
    if ((counts.get(input.companySlug) || 0) > 1) throw new Error(`Multiple company records use slug "${input.companySlug}". Resolve them before importing financials.`);
    if (!counts.has(input.companySlug) && !allowMissingCompanies) throw new Error(`Company "${input.companySlug}" is not published in Sanity. Import the company first; financials-only does not create profiles.`);
  }
  const records = companies.length ? await client.fetch(METRICS, {ids: companies.map(row => row._id)}, {perspective: 'raw'}) : [];
  return planAnnualFinancials(observations, records);
}

export async function saveAnnualFinancials(client, operations, {dryRun = false, companyIds} = {}) {
  const changed = operations.filter(operation => operation.changed);
  if (dryRun) {
    console.log(`Annual financials: ${changed.length} would change; ${operations.length - changed.length} unchanged. Blank cells are ignored.`);
    return;
  }
  for (let offset = 0; offset < changed.length; offset += 50) {
    let transaction = client.transaction();
    for (const operation of changed.slice(offset, offset + 50)) {
      if (operation.existing) {
        transaction = transaction.patch(operation.existing._id, patch => patch.ifRevisionId(operation.existing._rev).set(operation.data));
      } else {
        const companyId = companyIds.get(operation.input.companySlug);
        if (!companyId) throw new Error(`Missing company ID for ${operation.input.companySlug}.`);
        transaction = transaction.create({_type: 'companyMetric', company: {_type: 'reference', _ref: companyId}, ...operation.data});
      }
    }
    await transaction.commit();
  }
  console.log(`Annual financials: ${changed.length} changed; ${operations.length - changed.length} unchanged. Blank cells were left untouched.`);
}
