import {defineQuery} from 'groq';
import {parseCompanyFinancials, financialColumnHeaders, planAnnualFinancials, metricCode, financialYear, financialBasis} from '../scripts/lib/company-financials.mjs';
import {changedFinancialLocks} from './financial-protection.mjs';

export const FINANCIAL_SNAPSHOT_QUERY = defineQuery(`{
  "company": *[_type == "company" && _id == $id][0]{_id,_rev,name,"slug":slug.current},
  "controls": *[_type == "companyFinancialControl" && company._ref == $id && !(_id in path("versions.**"))]{_id,_rev,lockedGroups},
  "metrics": *[_type == "companyMetric" && company._ref == $id && !(_id in path("versions.**"))]{_id,_rev,_type,company,label,value,period,notes,sourceUrl,verificationStatus,sourceDate,internalNotes,metricCode,fiscalYear,numericValue,currency,unit,reportingBasis,financialImportKey,"companySlug":company->slug.current}
}`);

export function financialSnapshot(value) {
  if (!value?.company?._rev) throw new Error('Published company not found. Refresh and choose a published company.');
  if ((value.controls || []).some(control => control._id.startsWith('drafts.')) || (value.controls || []).length > 1) throw new Error('Financial protection records have duplicates or drafts. Resolve these before editing/importing.');
  const control = value.controls?.[0];
  return {...value, control, company:{...value.company, financialExcelLocks:control?.lockedGroups || []}};
}

export function financialGroupRecords(records, year, basis) {
  const result = {};
  for (const record of records) {
    const code = record.metricCode || metricCode(record.label);
    if (!code || (record.fiscalYear || financialYear(record.period)) !== Number(year)) continue;
    const savedBasis = financialBasis(record);
    if (savedBasis && savedBasis !== basis.toLowerCase()) continue;
    if (!savedBasis) throw new Error(`${record.label} has no clear reporting basis. Resolve it in Company metrics before editing this year.`);
    if (record._id.startsWith('drafts.')) throw new Error(`${record.label} has unpublished changes. Resolve its draft in Company metrics first.`);
    if (result[code]) throw new Error(`Multiple ${record.label} records exist for this year/basis. Resolve duplicates first.`);
    result[code] = record;
  }
  return result;
}

export function editorFinancialPlan(snapshot, form) {
  if (!Number.isInteger(Number(form.year)) || Number(form.year) < 2000 || Number(form.year) > 2099) throw new Error('Choose a financial year between 2000 and 2099.');
  financialGroupRecords(snapshot.metrics, form.year, form.basis);
  const row = {company_slug:snapshot.company.slug};
  for (const key of ['currency','unit','reporting_basis','source_url']) row[`fy${form.year}_${key}`] = {currency:form.currency, unit:form.unit, reporting_basis:form.basis, source_url:form.sourceUrl}[key];
  for (const code of ['revenue','ebitda','net_profit_loss']) row[`fy${form.year}_${code}`] = form.amounts[code];
  const inputs = parseCompanyFinancials([row], financialColumnHeaders(form.year));
  if (!inputs.length) throw new Error('Enter at least one amount. Blank amounts preserve existing figures; they do not delete them.');
  return planAnnualFinancials(inputs, snapshot.metrics);
}

// All figures + permission changes commit atomically. Company/control revisions serialize
// first-time control creation and stop an older import/editor session overwriting a newer save.
export async function saveEditorFinancials(client, snapshot, form) {
  const operations = editorFinancialPlan(snapshot, form);
  const now = new Date().toISOString();
  let tx = client.transaction().patch(snapshot.company._id, patch => patch.ifRevisionId(snapshot.company._rev).set({financialWriteVersion:globalThis.crypto.randomUUID()}));
  const controlData = {lockedGroups:changedFinancialLocks(snapshot.company, form.year, form.basis, true), lastEditedAt:now};
  tx = snapshot.control
    ? tx.patch(snapshot.control._id, patch => patch.ifRevisionId(snapshot.control._rev).set(controlData))
    : tx.create({_type:'companyFinancialControl', company:{_type:'reference', _ref:snapshot.company._id}, ...controlData});
  for (const operation of operations) {
    const data = {...operation.data, financialEditedInStudio:true, financialEditedAt:now};
    tx = operation.existing
      ? tx.patch(operation.existing._id, patch => patch.ifRevisionId(operation.existing._rev).set(data))
      : tx.create({_type:'companyMetric', company:{_type:'reference', _ref:snapshot.company._id}, ...data});
  }
  await tx.commit();
}

export async function allowExcelFinancials(client, snapshot, year, basis) {
  if (!snapshot.control) return;
  await client.transaction()
    .patch(snapshot.control._id, patch => patch.ifRevisionId(snapshot.control._rev).set({lockedGroups:changedFinancialLocks(snapshot.company, year, basis, false), excelPermissionUpdatedAt:new Date().toISOString()}))
    .commit();
}
