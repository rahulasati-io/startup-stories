import {defineQuery} from 'groq';
import {planAnnualFinancials} from './company-financials.mjs';
import {financialGroupLocked} from '../../lib/financial-protection.mjs';
import {randomUUID} from 'node:crypto';
import {FINANCIAL_SNAPSHOT_QUERY, financialSnapshot} from '../../lib/financial-editor.mjs';

const COMPANIES = defineQuery(`*[_type == "company" && slug.current in $slugs && !(_id in path("drafts.**"))]{_id,_rev,"slug":slug.current,
  "controls": *[_type == "companyFinancialControl" && company._ref == ^._id && !(_id in path("versions.**"))]{_id,_rev,lockedGroups}}
`);
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
  const companiesBySlug = new Map(companies.map(company => [company.slug, financialSnapshot({company, controls:company.controls, metrics:[]}).company]));
  const protectedInputs = observations.filter(input => financialGroupLocked(companiesBySlug.get(input.companySlug), input.fiscalYear, input.reportingBasis));
  const protectedKeys = new Set(protectedInputs.map(input => input.key));
  return [...planAnnualFinancials(observations.filter(input => !protectedKeys.has(input.key)), records), ...protectedInputs.map(input => ({input, protected: true, changed: false}))];
}

export async function saveAnnualFinancials(client, operations, {dryRun = false, companyIds} = {}) {
  const changed = operations.filter(operation => operation.changed);
  const protectedCount = operations.filter(operation => operation.protected).length;
  if (dryRun) {
    console.log(`Annual financials: ${changed.length} would change; ${operations.length - changed.length - protectedCount} unchanged; ${protectedCount} protected from Excel. Blank cells are ignored.`);
    for (const operation of operations.filter(item => item.protected)) console.log(`Protected: ${operation.input.key}. Allow Excel updates in Sanity's Financial Editor to change this year/basis.`);
    return;
  }
  const groups = new Map();
  for (const operation of operations) {
    const key = `${operation.input.companySlug}|${operation.input.fiscalYear}|${operation.input.reportingBasis}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(operation.input);
  }
  let written = 0, skipped = 0;
  for (const inputs of groups.values()) {
    const first = inputs[0];
    const companyId = companyIds.get(first.companySlug);
    if (!companyId) throw new Error(`Missing company ID for ${first.companySlug}.`);
    // Re-read at write time, not just preflight. A Studio edit after preflight must win.
    const snapshot = financialSnapshot(await client.fetch(FINANCIAL_SNAPSHOT_QUERY, {id: companyId}, {perspective: 'raw'}));
    if (!snapshot.company?._rev) throw new Error(`Company ${first.companySlug} changed or was removed. Retry the import.`);
    if (financialGroupLocked(snapshot.company, first.fiscalYear, first.reportingBasis)) {
      skipped += inputs.length;
      console.log(`Protected: ${first.companySlug} FY${first.fiscalYear} (${first.reportingBasis}); ${inputs.length} Excel figures skipped.`);
      continue;
    }
    const fresh = planAnnualFinancials(inputs, snapshot.metrics);
    const updates = fresh.filter(operation => operation.changed);
    if (!updates.length) continue;
    // Revision guard on the company serializes new metric creation with editor saves/locks.
    let transaction = client.transaction().patch(companyId, patch => patch.ifRevisionId(snapshot.company._rev).set({financialWriteVersion: randomUUID()}));
    if (snapshot.control) transaction = transaction.patch(snapshot.control._id, patch => patch.ifRevisionId(snapshot.control._rev).set({lastExcelImportAt:new Date().toISOString()}));
    for (const operation of updates) {
      if (operation.existing) {
        transaction = transaction.patch(operation.existing._id, patch => patch.ifRevisionId(operation.existing._rev).set(operation.data));
      } else {
        transaction = transaction.create({_type: 'companyMetric', company: {_type: 'reference', _ref: companyId}, ...operation.data});
      }
    }
    await transaction.commit();
    written += updates.length;
  }
  console.log(`Annual financials: ${written} changed; ${skipped} protected from Excel. Blank cells were left untouched.`);
}
