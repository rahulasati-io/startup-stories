export const FINANCIAL_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY', 'CNY', 'CHF', 'HKD'];
export const FINANCIAL_UNITS = ['Units', 'Thousand', 'Lakh', 'Million', 'Crore', 'Billion'];
export const FINANCIAL_BASES = ['Consolidated', 'Standalone'];
export const FINANCIAL_METRICS = {revenue: 'Revenue from operations', ebitda: 'EBITDA', net_profit_loss: 'Net profit / loss'};
const fields = new Set(['currency', 'unit', ...Object.keys(FINANCIAL_METRICS), 'reporting_basis', 'source_url']);
const clean = value => value === undefined || value === null ? '' : String(value).trim();
const present = value => clean(value) !== '';
const yearNumber = value => value.length === 2 ? 2000 + Number(value) : Number(value);

export function financialColumnHeaders(year) {
  return [...fields].map(field => `fy${year}_${field}`);
}

export function metricCode(label) {
  const text = clean(label).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (['revenue', 'revenue from operations', 'operating revenue'].includes(text)) return 'revenue';
  if (text === 'ebitda') return 'ebitda';
  if (['net profit', 'net loss', 'net profit loss', 'profit after tax', 'pat'].includes(text)) return 'net_profit_loss';
  return null;
}

export function financialYear(value) {
  const match = clean(value).match(/^FY\s*(\d{4}|\d{2})(?:\s*[-–/]\s*(\d{4}|\d{2}))?(?:\b|\s|,|\()/i);
  return match ? yearNumber(match[2] || match[1]) : null;
}

export function financialBasis(record) {
  const explicit = clean(record.reportingBasis || record.reporting_basis).toLowerCase();
  if (explicit) return explicit;
  return `${record.period || ''} ${record.notes || ''}`.toLowerCase().match(/\b(consolidated|standalone)\b/)?.[1] || null;
}

function amount(value, location) {
  if (typeof value === 'boolean') throw new Error(`${location}: enter a number, not TRUE/FALSE.`);
  const text = clean(value);
  // Accept ordinary numbers and unambiguous Western/Indian comma grouping, not currency strings.
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) &&
      !/^[+-]?(?:\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d+)?$/.test(text)) {
    throw new Error(`${location}: enter numbers only (for example 1250.5 or -60). Select currency/unit in their separate columns.`);
  }
  const number = Number(text.replaceAll(',', ''));
  if (!Number.isFinite(number)) throw new Error(`${location}: the amount must be finite.`);
  return number;
}

export function parseCompanyFinancials(rows, headers, {sheetName = 'Metrics'} = {}) {
  const groups = new Map();
  for (const header of headers) {
    const match = clean(header).match(/^fy(\d{2}|\d{4})_(.+)$/i);
    if (!match) continue;
    const year = yearNumber(match[1]);
    const field = match[2].toLowerCase();
    if (!fields.has(field)) throw new Error(`Unknown financial column "${header}". Use currency, unit, revenue, ebitda, net_profit_loss, reporting_basis or source_url.`);
    if (year < 2000 || year > 2099) throw new Error(`Financial year in "${header}" must be between FY2000 and FY2099.`);
    if (!groups.has(year)) groups.set(year, {});
    const group = groups.get(year);
    if (group[field]) throw new Error(`Duplicate financial column for FY${year} ${field}.`);
    group[field] = header;
  }
  const observations = [];
  const keys = new Set();
  for (const [index, row] of rows.entries()) {
    const companySlug = clean(row.company_slug);
    for (const [year, columns] of groups) {
      const enteredMetrics = Object.keys(FINANCIAL_METRICS).filter(field => present(row[columns[field]]));
      if (!enteredMetrics.length) continue; // Currency selections or blank values never create/delete metrics.
      const location = `${sheetName} row ${row.__rowNumber || index + 2}, ${companySlug || 'missing company_slug'}, FY${year}`;
      if (!companySlug) throw new Error(`${location}: company_slug is required.`);
      const currency = clean(row[columns.currency]).toUpperCase();
      const unit = clean(row[columns.unit]).toLowerCase();
      const basis = clean(row[columns.reporting_basis]).toLowerCase();
      if (!FINANCIAL_CURRENCIES.includes(currency)) throw new Error(`${location}: select a supported currency in the year's currency column.`);
      if (!FINANCIAL_UNITS.some(value => value.toLowerCase() === unit)) throw new Error(`${location}: select Units, Thousand, Lakh, Million, Crore or Billion in the year's unit column.`);
      if (!FINANCIAL_BASES.some(value => value.toLowerCase() === basis)) throw new Error(`${location}: select Consolidated or Standalone in reporting_basis. No accounting basis is assumed.`);
      const sourceUrl = clean(row[columns.source_url]);
      try {if (!['http:', 'https:'].includes(new URL(sourceUrl).protocol)) throw new Error();}
      catch {throw new Error(`${location}: add an http/https source URL for this year's figures.`);}
      for (const code of enteredMetrics) {
        const key = `${companySlug}|FY${year}|${basis}|${code}`;
        if (keys.has(key)) throw new Error(`${location}: duplicate company/year/metric/basis entry.`);
        keys.add(key);
        const numericValue = amount(row[columns[code]], `${location}, ${code}`);
        observations.push({companySlug, key, fiscalYear: year, metricCode: code, reportingBasis: basis,
          numericValue, currency, unit, label: FINANCIAL_METRICS[code], period: `FY${year} (${basis === 'consolidated' ? 'Consolidated' : 'Standalone'})`,
          value: `${currency} ${numericValue.toLocaleString('en-IN', {maximumFractionDigits: 12})}${unit === 'units' ? '' : ` ${unit}`}`,
          sourceUrl, financialImportKey: `annual:FY${year}:${basis}:${code}`});
      }
    }
  }
  return observations;
}

export function checkLegacyFinancialOverlap(observations, legacyRows) {
  const byMetric = new Map();
  for (const input of observations) {
    const key = `${input.companySlug}|${input.fiscalYear}|${input.metricCode}`;
    if (!byMetric.has(key)) byMetric.set(key, []);
    byMetric.get(key).push(input);
  }
  for (const row of legacyRows) {
    const matching = byMetric.get(`${clean(row.company_slug)}|${financialYear(row.period)}|${metricCode(row.label)}`)?.find(input => !financialBasis(row) || financialBasis(row) === input.reportingBasis);
    if (matching) throw new Error(`${matching.companySlug} ${matching.period} ${matching.label} is entered in both the annual financial grid and legacy/Other Metrics. Keep this observation in only one sheet before importing; no records were written.`);
  }
}

export function planAnnualFinancials(observations, records) {
  const operations = [];
  const byCompany = new Map();
  for (const record of records) {
    if (!byCompany.has(record.companySlug)) byCompany.set(record.companySlug, []);
    byCompany.get(record.companySlug).push(record);
  }
  const suppliedKeys = new Set(observations.map(input => input.key));
  for (const input of observations) {
    const related = byCompany.get(input.companySlug) || [];
    const matches = related.filter(record => record.financialImportKey === input.financialImportKey ||
      ((record.metricCode || metricCode(record.label)) === input.metricCode &&
       (record.fiscalYear || financialYear(record.period)) === input.fiscalYear &&
       (!financialBasis(record) || financialBasis(record) === input.reportingBasis)));
    if (matches.some(record => record._id.startsWith('drafts.'))) throw new Error(`${input.key}: an existing metric has a Sanity draft. Resolve its unpublished changes before importing.`);
    if (matches.length > 1) throw new Error(`${input.key}: multiple matching Sanity metrics found. Resolve duplicates before importing.`);
    const existing = matches[0];
    if (existing && !financialBasis(existing)) throw new Error(`${input.key}: a matching legacy metric has no known standalone/consolidated basis. Review it in Sanity before updating; no duplicate was created.`);
    // A year-level unit/currency must not reinterpret a metric omitted from a partial update.
    for (const record of related) {
      const code = record.metricCode || metricCode(record.label);
      if (!code || (record.fiscalYear || financialYear(record.period)) !== input.fiscalYear || financialBasis(record) !== input.reportingBasis) continue;
      const supplied = suppliedKeys.has(`${input.companySlug}|FY${input.fiscalYear}|${input.reportingBasis}|${code}`);
      if (!supplied && (record.currency !== input.currency || record.unit !== input.unit)) {
        throw new Error(`${input.companySlug} ${input.period}: currency/unit differs from a saved ${code} left blank in the sheet. Supply all saved figures in the new currency/unit, or keep the original currency/unit.`);
      }
    }
    const data = {...input};
    delete data.companySlug;
    delete data.key;
    const changed = !existing || Object.entries(data).some(([field, value]) => JSON.stringify(existing[field] ?? null) !== JSON.stringify(value));
    operations.push({input, existing, data, changed});
  }
  return operations;
}
