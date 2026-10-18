# Annual financials in Metrics

Open the existing `companies.xlsx` workbook and select **Metrics**. Company slug and name are in A:B. FY25 financials are in C:I; FY26 financials are in J:P. One company stays on one row. The **Companies** tab keeps its original profile fields without financial columns.

Each year has these columns, in this order:

1. `fy25_currency` — select INR, USD, EUR, GBP, AED, SGD, AUD, CAD, JPY, CNY, CHF or HKD.
2. `fy25_unit` — select Units, Thousand, Lakh, Million, Crore or Billion.
3. `fy25_revenue` — revenue from operations, as a number.
4. `fy25_ebitda` — reported EBITDA, as a number. Do not substitute adjusted EBITDA or another profit measure.
5. `fy25_net_profit_loss` — net profit/loss, as a number. A loss is negative; zero is a valid value.
6. `fy25_reporting_basis` — select Consolidated or Standalone.
7. `fy25_source_url` — the report or filing supporting the entered figures. Use one source covering the entered year figures; if the figures require different incompatible sources/definitions, review them before import rather than silently combining them.

FY25 means the financial year ending in 2025; use the company's actual reporting calendar. Currency, unit and accounting basis apply to every entered monetary figure in that year's group. Enter only numbers in amount cells, not currency symbols or words. Currency is preserved; there is no FX conversion. Blank amounts are ignored and do not delete saved financials. A blank year group does nothing. No sample company financials have been entered for you.

## Check first

```powershell
npm run import:financials:check
```

## Import only financials

```powershell
npm run import:financials
```

This mode writes only financial companyMetric records. It does not write company profiles, people, roles, biographies, SEO, funding or timelines. The company must already be published in Sanity.

For one company:

```powershell
node --env-file=.env.local scripts/import-companies.mjs companies.xlsx --financials-only --company=company-slug --dry-run
node --env-file=.env.local scripts/import-companies.mjs companies.xlsx --financials-only --company=company-slug
```

The normal company importer also reads these financial columns, but it retains its existing broader company/people update behaviour. Use financials-only when you intend to update numbers and nothing else.

## Later years

Copy the seven-column FY26 group to the right and rename every `fy26_` prefix to `fy27_`, `fy28_`, etc. The importer recognises additional year groups without a code change. Preserve exact suffix names. Copy the cells/dropdowns as well as their headers; do not simply label an unrelated metric with an existing field name.

## Safe updates and old Metrics rows

- Re-importing the same company/year/metric/basis reuses its record and skips unchanged values. New records receive Sanity-generated IDs.
- Financial metadata stores the numeric amount, currency, unit, year and basis separately, alongside a readable value for the existing website Key Metrics section.
- If a saved amount is left blank in a partial update, do not change that year's currency/unit. Supply all saved figures in the new currency/unit if you intentionally change them.
- The same observation must not be entered in both the annual financial grid and Other Metrics. The importer reports a conflict instead of silently choosing a version. Other metrics, such as store counts or occupancy, can remain on Other Metrics. The old long-format Metrics layout is still supported for older workbooks; annual financials in Companies are recognised only as a legacy fallback when Metrics has no year-group headers.
- Multiple matching Sanity metrics, draft metric changes or unknown legacy accounting basis require review before import. A company must have a unique published slug.
- Sources and all entered context are validated before normal-import writes begin. Revision checks protect updates to existing financial metrics.

The workbook contains dropdowns through row 1001. If extending well beyond that, copy the existing validation cells into the new company rows. Server-side importer validation still applies to every entered row.
