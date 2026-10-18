import {FINANCIAL_SNAPSHOT_QUERY, financialSnapshot} from '../../lib/financial-editor.mjs';
import {legacyFinancialLocked} from '../../lib/financial-protection.mjs';
import {metricCode, financialYear, financialBasis} from './company-financials.mjs';
import {isDeepStrictEqual} from 'node:util';
import {randomUUID} from 'node:crypto';

export function legacyMetricProtected(company, incoming, existing) {
  return [incoming, existing].filter(Boolean).some(record =>
    (record.metricCode || metricCode(record.label)) && legacyFinancialLocked(company, record.fiscalYear || financialYear(record.period), financialBasis(record)));
}

// Older long-form Metrics and Other Metrics must not bypass the yearly grid lock.
export async function saveLegacyFinancialMetrics(client, documents, {dryRun = false} = {}) {
  const groups = new Map();
  for (const document of documents) {
    const id = document.company._ref;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(document);
  }
  let changed = 0, skipped = 0;
  for (const [id, incoming] of groups) {
    if (dryRun && id.startsWith('dryrun-')) { changed += incoming.length; continue; }
    const snapshot = financialSnapshot(await client.fetch(FINANCIAL_SNAPSHOT_QUERY, {id}, {perspective:'raw'}));
    const updates = [];
    for (const document of incoming) {
      const existing = snapshot.metrics.find(record => record._id === document._id);
      if (legacyMetricProtected(snapshot.company, document, existing)) {
        skipped++;
        console.log(`Protected: ${snapshot.company.slug} ${document.period || existing?.period || ''} ${document.label}; Excel row skipped.`);
        continue;
      }
      if (existing?.financialImportKey) throw new Error(`${document.label}: this annual financial record is structured. Update it through the yearly Metrics grid or Financial Editor, not a legacy row.`);
      if (snapshot.metrics.some(record => record._id === `drafts.${document._id}`)) throw new Error(`${document.label}: resolve its Sanity draft before importing this metric.`);
      const differs = !existing || Object.entries(document).some(([key, value]) => !isDeepStrictEqual(existing[key] ?? null, value ?? null));
      if (differs) updates.push({document, existing});
      else skipped++;
    }
    changed += updates.length;
    if (dryRun || !updates.length) continue;
    let tx = client.transaction().patch(id, patch => patch.ifRevisionId(snapshot.company._rev).set({financialWriteVersion:randomUUID()}));
    if (snapshot.control) tx = tx.patch(snapshot.control._id, patch => patch.ifRevisionId(snapshot.control._rev).set({lastExcelImportAt:new Date().toISOString()}));
    for (const {document, existing} of updates) {
      const {_id, _type, ...data} = document;
      void _id; void _type;
      tx = existing ? tx.patch(existing._id, patch => patch.ifRevisionId(existing._rev).set(data)) : tx.create(document);
    }
    await tx.commit();
  }
  console.log(`Metrics: ${changed} ${dryRun ? 'would change' : 'changed'}; ${skipped} unchanged/protected.`);
  return {changed, skipped};
}
