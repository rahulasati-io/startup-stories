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

This mode writes financial companyMetric records plus hidden concurrency/audit fields on the company and its financial protection record. It does not change company profile text, people, roles, biographies, SEO, funding or timelines. The company must already be published in Sanity.

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

## Sanity Financial Editor and Excel protection

After deploying the new Studio code, open **Financial Editor** in Sanity. Search for a published company, select financial year and Standalone/Consolidated, then edit currency, unit, revenue, EBITDA, net profit/loss and the internal source URL. Numbers are not converted between units/currencies. Legacy values without numeric metadata show their saved readable amount; re-enter numeric amounts to adopt them safely. Existing metric drafts, duplicates and ambiguous reporting basis must be resolved first.

**Save & publish figures** asks for confirmation, publishes the entered figures and protects the entire company/year/basis from Excel. Blank amount cells preserve old values; zero and negative losses are supported. The source URL applies to entered amounts. This does not retroactively lock financials you have not saved through the editor.

Normal company imports, financials-only imports and legacy/Other Metrics imports all honour protection. Protected figures are logged and skipped, including an attempted new metric in a locked year. Other years and nonfinancial metrics remain independent. Protected values are not silently synchronized back into Excel.

To explicitly permit Excel again, select that company/year/basis and click **Allow Excel updates for this year**, then confirm. Current figures do not change at permission time. Excel stays permitted for that year/basis until another editor save protects it again. There is no bulk force-overwrite flag. Use the current importer code: older copied scripts that predate this protection cannot enforce it. This is a safeguard in the provided workflows, not a restriction against arbitrary external API clients with write permission.

Protection is stored in a separate generated-ID companyFinancialControl record, not in company-profile drafts, so publishing an older profile cannot erase it. Company/control/metric revision checks prevent concurrent saves/imports from overwriting each other. Failed or stale saves leave typed inputs visible; reload saved records before retrying. The website refreshes through the existing metric/company publication webhook and cache fallback.

The editor does not autosave or delete financial records. Its save publishes data directly after confirmation; it is not an unpublished financial-draft workflow. No existing values are changed merely by deploying/opening the editor.

Tests:

```powershell
node --test scripts/company-financials.test.mjs scripts/financial-editor.test.mjs
```
