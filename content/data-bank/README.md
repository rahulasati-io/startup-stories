# Data library snapshot

Eight dataset routes are implemented locally. GST, UPI and mutual-fund AUM are excluded.

- `observations.json` contains normalized values, not page settings or approval flags.
- `lib/data-library.ts` owns titles, definitions, source limitations and publication review.
- Google Sheets is read-only during this implementation. The website uses a local snapshot; it does not live-sync with Google Sheets or store these observations in Sanity.
- The owner confirmed the supplied sheet is verified on 24 October 2026. All eight entries are approved, including the supplied 30-row IPO ranking.
- Approved pages allow indexing, participate in the sitemap and emit Dataset structured data. This approval is editorial, not a claim of independent external verification. The importer cannot change approval flags.
- Dataset pages use full-width charts/tables, without review warnings, category eyebrows or the Dataset information sidebar. The hub and cards omit eyebrow/frequency labels. Hover/touch and keyboard navigation expose chart values. Available source names are plain text, never hyperlinks; missing sources are omitted without using MisterStory as a fallback.
- Weeklies are observation dates, never inferred policy effective dates. CPI inflation compares the same month within the same base series. SIP financial-year totals are not imported as monthly observations. Nifty input is TRI, not a price-return series. Exchange rates are month-end INR per USD, not annual averages.

## Refresh checks

The importer accepts a downloaded Excel copy of the Data Bank or the read-only connector's raw row-array JSON. It requires the existing exact tab layout. It does not modify the input workbook, Sanity, source settings or publication approval.

```powershell
node scripts/import-data-bank.mjs "path-to-data-bank.xlsx"
node scripts/import-data-bank.mjs "path-to-data-bank.xlsx" --write
node --test scripts/data-bank.test.mjs
```

Without `--write`, no files change. With it, only the local observation snapshot changes. Nifty returns are calendar-year TRI returns; the visible title is Nifty 50 Annual Return and the methodology explains TRI. Existing URLs remain unchanged.
