"use client";

import {Badge, Box, Button, Card, Flex, Grid, Select, Spinner, Stack, Text, TextInput} from "@sanity/ui";
import {useEffect, useMemo, useState} from "react";
import {useClient} from "sanity";
import {defineQuery} from "groq";
import {FINANCIAL_CURRENCIES, FINANCIAL_UNITS, FINANCIAL_METRICS} from "../../scripts/lib/company-financials.mjs";
import {FINANCIAL_SNAPSHOT_QUERY, financialSnapshot, financialGroupRecords, editorFinancialPlan, saveEditorFinancials, allowExcelFinancials} from "../../lib/financial-editor.mjs";
import {financialGroupLocked} from "../../lib/financial-protection.mjs";
import {istCalendarYear} from "../../lib/display-dates.mjs";

const COMPANY_SEARCH = defineQuery(`*[_type == "company" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && defined(slug.current) && ($q == "" || name match $search || slug.current match $search)] | order(name asc)[0...50]{_id,name,"slug":slug.current}`);
type Company = {_id: string; _rev: string; name: string; slug: string; financialExcelLocks: string[]};
type Metric = {_id: string; _rev: string; label: string; value: string; numericValue?: number; currency?: string; unit?: string; sourceUrl?: string};
type Snapshot = {company: Company; metrics: Metric[]; control?: {_id: string; _rev: string}};
type Amounts = {revenue: string; ebitda: string; net_profit_loss: string};
const EMPTY: Amounts = {revenue: "", ebitda: "", net_profit_loss: ""};
const label = {display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600} as const;

export function FinancialEditor() {
  const studioClient = useClient({apiVersion: "2026-08-23"});
  const client = useMemo(() => studioClient.withConfig({useCdn: false, perspective: "raw"}), [studioClient]);
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<{_id: string; name: string; slug: string}[]>([]);
  const [searching, setSearching] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [year, setYear] = useState(() => istCalendarYear());
  const [basis, setBasis] = useState("consolidated");
  const [currency, setCurrency] = useState("INR");
  const [unit, setUnit] = useState("crore");
  const [sourceUrl, setSourceUrl] = useState("");
  const [amounts, setAmounts] = useState<Amounts>(EMPTY);
  const [saved, setSaved] = useState<Record<string, Metric>>({});
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [message, setMessage] = useState("");
  const selectionKey = `${companyId}|${year}|${basis}`;
  const locked = Boolean(snapshot && financialGroupLocked(snapshot.company, Number(year), basis));
  const ready = Boolean(snapshot && loadedKey === selectionKey && !loading && !saving);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const clean = search.trim().replace(/[^\p{L}\p{N}\s-]/gu, "");
        const result = await client.fetch(COMPANY_SEARCH, {q: clean, search: `*${clean}*`}, {perspective: "published", signal: controller.signal});
        if (!controller.signal.aborted) setCompanies(result);
      } catch (caught) {
        if (!controller.signal.aborted) setSearchError(caught instanceof Error ? caught.message : "Companies could not be loaded.");
      } finally {if (!controller.signal.aborted) setSearching(false);}
    }, search.trim() ? 250 : 0);
    return () => {window.clearTimeout(timer); controller.abort();};
  }, [client, search]);

  useEffect(() => {
    if (!companyId) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        const next = financialSnapshot(await client.fetch(FINANCIAL_SNAPSHOT_QUERY, {id: companyId}, {perspective: "raw", signal: controller.signal})) as Snapshot;
        const group = financialGroupRecords(next.metrics, Number(year), basis) as Record<string, Metric>;
        if (controller.signal.aborted) return;
        const values = Object.values(group);
        setSnapshot(next); setSaved(group);
        setCurrency(values.find(item => item.currency)?.currency || "INR");
        setUnit(values.find(item => item.unit)?.unit?.toLowerCase() || "crore");
        setSourceUrl(values.find(item => item.sourceUrl)?.sourceUrl || "");
        setAmounts(Object.fromEntries(Object.keys(EMPTY).map(code => [code, typeof group[code]?.numericValue === "number" ? String(group[code].numericValue) : ""])) as Amounts);
        setLoadedKey(`${companyId}|${year}|${basis}`); setDirty(false);
      } catch (caught) {
        if (!controller.signal.aborted) {setError(caught instanceof Error ? caught.message : "Financials could not be loaded."); setLoadedKey("");}
      } finally {if (!controller.signal.aborted) setLoading(false);}
    }
    void load();
    return () => controller.abort();
  }, [client, companyId, year, basis, refresh]);

  function discard() {return !dirty || window.confirm("Discard unsaved financial changes and load the selected records?");}

  async function save() {
    if (!ready || !snapshot) return;
    const form = {year: Number(year), basis, currency, unit, sourceUrl, amounts};
    try {
      editorFinancialPlan(snapshot, form);
      if (!window.confirm(`Publish these FY${year} ${basis} figures for ${snapshot.company.name}? This updates public metrics and protects the entire year/basis from Excel.`)) return;
      setSaving(true); setError(""); setMessage("");
      await saveEditorFinancials(client, snapshot, form);
      setMessage("Figures published and protected from Excel. Reloading saved values…");
      setDirty(false); setRefresh(value => value + 1);
    } catch (caught) {
      // Preserve typed values on errors. Refresh is explicit so a conflict cannot silently overwrite another edit.
      setMessage(""); setError(`${caught instanceof Error ? caught.message : "Save failed."} Your inputs have not been cleared. Use Reload saved figures if another edit changed these records.`);
    } finally {setSaving(false);}
  }

  async function allowExcel() {
    if (!ready || !snapshot || !locked || dirty) return;
    if (!window.confirm(`Allow future Excel imports to replace FY${year} ${basis} figures for ${snapshot.company.name}? Current figures will not change now. Other years remain protected.`)) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await allowExcelFinancials(client, snapshot, Number(year), basis);
      setMessage("Excel updates are now allowed for this year/basis. Current values were not changed.");
      setRefresh(value => value + 1);
    } catch (caught) {setError(caught instanceof Error ? caught.message : "Could not change Excel permission. Reload and try again.");}
    finally {setSaving(false);}
  }

  const options = companies.some(item => item._id === companyId) || !snapshot ? companies : [{_id: snapshot.company._id, name: snapshot.company.name, slug: snapshot.company.slug}, ...companies];
  return <Card height="fill" overflow="auto" padding={4} tone="transparent"><Stack space={4}>
    <Stack space={3}><Text size={3} weight="semibold">Financial Editor</Text><Text muted size={1}>Choose a company and financial year. Save revenue, EBITDA and profit/loss together. Saving protects the whole year and reporting basis from Excel imports.</Text></Stack>
    <Card border radius={2} padding={4}><Stack space={4}>
      <Box><label htmlFor="finance-company-search" style={label}>Find company {searching ? "(searching…)" : ""}</label><TextInput id="finance-company-search" placeholder="Search any published company by name or slug" value={search} onChange={event => setSearch(event.currentTarget.value)} /></Box>
      {searchError && <Text size={1}>{searchError}</Text>}
      <Grid columns={[1, 1, 3]} gap={3}>
        <Box><label htmlFor="finance-company" style={label}>Company</label><Select id="finance-company" value={companyId} disabled={saving} onChange={event => {if (discard()) {setCompanyId(event.currentTarget.value); setMessage(""); setDirty(false);}}}><option value="">Select company</option>{options.map(item => <option key={item._id} value={item._id}>{item.name} ({item.slug})</option>)}</Select></Box>
        <Box><label htmlFor="finance-year" style={label}>Financial year ending</label><Select id="finance-year" value={year} disabled={saving} onChange={event => {if (discard()) {setYear(event.currentTarget.value); setMessage(""); setDirty(false);}}}>{Array.from({length:100}, (_, index) => 2099 - index).map(value => <option key={value} value={value}>FY{value}</option>)}</Select></Box>
        <Box><label htmlFor="finance-basis" style={label}>Reporting basis</label><Select id="finance-basis" value={basis} disabled={saving} onChange={event => {if (discard()) {setBasis(event.currentTarget.value); setMessage(""); setDirty(false);}}}><option value="consolidated">Consolidated</option><option value="standalone">Standalone</option></Select></Box>
      </Grid>
    </Stack></Card>
    {error && <Card border padding={3} tone="critical"><Text size={1}>{error}</Text></Card>}
    {message && <Card border padding={3} tone="positive"><Text size={1}>{message}</Text></Card>}
    {loading && <Flex align="center" gap={3}><Spinner /><Text>Loading saved figures…</Text></Flex>}
    {companyId && <Card border radius={2} padding={4}><Stack space={4}>
      <Flex align="center" gap={3} wrap="wrap"><Badge tone={locked ? "positive" : "caution"}>{locked ? "Protected from Excel" : "Excel updates allowed"}</Badge><Text size={1}>FY{year} · {basis}</Text></Flex>
      <Grid columns={[1, 2]} gap={3}>
        <Box><label htmlFor="finance-currency" style={label}>Currency</label><Select id="finance-currency" value={currency} disabled={!ready} onChange={event => {setCurrency(event.currentTarget.value); setDirty(true);}}>{FINANCIAL_CURRENCIES.map(value => <option key={value} value={value}>{value}</option>)}</Select></Box>
        <Box><label htmlFor="finance-unit" style={label}>Unit</label><Select id="finance-unit" value={unit} disabled={!ready} onChange={event => {setUnit(event.currentTarget.value); setDirty(true);}}>{FINANCIAL_UNITS.map(value => <option key={value} value={value.toLowerCase()}>{value}</option>)}</Select></Box>
      </Grid>
      <Grid columns={[1, 1, 3]} gap={3}>{(Object.keys(EMPTY) as (keyof Amounts)[]).map(code => <Box key={code}>
        <label htmlFor={`finance-${code}`} style={label}>{FINANCIAL_METRICS[code]}</label>
        <TextInput id={`finance-${code}`} inputMode="decimal" value={amounts[code]} disabled={!ready} placeholder="Blank = preserve saved value" onChange={event => {setAmounts(value => ({...value, [code]: event.currentTarget.value})); setDirty(true);}} />
        <Box marginTop={2}><Text muted size={1}>Saved: {saved[code]?.value || "Not entered"}</Text></Box>
      </Box>)}</Grid>
      <Box><label htmlFor="finance-source" style={label}>Source URL (internal, required)</label><TextInput id="finance-source" type="url" value={sourceUrl} disabled={!ready} placeholder="https://… annual report or filing" onChange={event => {setSourceUrl(event.currentTarget.value); setDirty(true);}} /></Box>
      <Text muted size={1}>Amounts are in the selected currency/unit; there is no automatic conversion. Zero is valid, losses are negative. Blanks preserve values. Source URL applies to the entered figures. Legacy values without numeric metadata must be re-entered as numbers.</Text>
      <Text muted size={1}>Save & publish updates public metrics immediately; the website may take a short time to refresh. This editor does not autosave.</Text>
      <Flex gap={3} wrap="wrap"><Button text="Save & publish figures" tone="primary" loading={saving} disabled={!ready || !dirty} onClick={save} /><Button text="Reload saved figures" mode="ghost" disabled={saving || loading} onClick={() => {if (discard()) {setError(""); setMessage(""); setRefresh(value => value + 1);}}} /><Button text="Allow Excel updates for this year" tone="caution" mode="ghost" disabled={!ready || !locked || dirty} onClick={allowExcel} /></Flex>
      {dirty && <Text size={1}>Unsaved changes. Save or reload before changing Excel permission.</Text>}
    </Stack></Card>}
  </Stack></Card>;
}
