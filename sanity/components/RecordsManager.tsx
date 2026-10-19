"use client";

import {AddIcon} from "@sanity/icons/Add";
import {RefreshIcon} from "@sanity/icons/Refresh";
import {SearchIcon} from "@sanity/icons/Search";
import {Badge, Box, Button, Card, Flex, Spinner, Stack, Text, TextInput} from "@sanity/ui";
import {useEffect, useState} from "react";
import {useClient} from "sanity";
import {IntentLink} from "sanity/router";
import {toSearchMatch} from "../../lib/global-search";
import {formatIstDate} from "../../lib/display-dates.mjs";
import {managerQuery, MANAGER_PAGE_SIZE, type ManagerResult, type ManagerRow, type ManagerStatus, type ManagerType} from "../lib/manager-queries";

const filters: {value: ManagerStatus; label: string}[] = [
  {value: "all", label: "All"},
  {value: "draftOnly", label: "Draft only"},
  {value: "unpublishedChanges", label: "Live + changes"},
  {value: "publishedCurrent", label: "Published/current"},
];
const statusDetails = {
  draftOnly: {label: "Draft only", tone: "caution" as const},
  unpublishedChanges: {label: "Live + unpublished changes", tone: "primary" as const},
  publishedCurrent: {label: "Published/current", tone: "positive" as const},
};
const empty: ManagerResult = {rows: [], counts: {all: 0, draftOnly: 0, unpublishedChanges: 0, publishedCurrent: 0}};
const cellStyle = {borderBottom: "1px solid var(--card-border-color)", padding: 14};

export function RecordsManager({type}: {type: ManagerType}) {
  const client = useClient({apiVersion: "2025-01-01"});
  const [result, setResult] = useState<ManagerResult>(empty);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ManagerStatus>("all");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const title = type === "post" ? "Articles" : "Companies";
  const singular = type === "post" ? "article" : "company";

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await client.fetch<ManagerResult>(managerQuery(type, page, status), {q: search.trim(), search: toSearchMatch(search)}, {perspective: "raw", signal: controller.signal});
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(data.counts[status] / MANAGER_PAGE_SIZE));
        if (page > lastPage) setPage(lastPage);
        else setResult(data);
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "The list could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, search.trim() ? 300 : 0);
    return () => {window.clearTimeout(timer); controller.abort();};
  }, [client, page, refresh, search, status, type]);

  const columns: {key: keyof ManagerRow; label: string}[] = type === "post"
    ? [{key: "slug", label: "Slug"}, {key: "company", label: "Company"}, {key: "category", label: "Category"}]
    : [{key: "slug", label: "Slug"}, {key: "industry", label: "Industry"}, {key: "seoTitle", label: "Meta title"}, {key: "seoDescription", label: "Meta description"}];
  const total = result.counts[status];
  const pages = Math.max(1, Math.ceil(total / MANAGER_PAGE_SIZE));

  return <Card height="fill" overflow="auto" padding={4} tone="transparent">
    <Stack space={4}>
      <Flex align="center" gap={3} justify="space-between" wrap="wrap">
        <Box><Text size={2} weight="semibold">{title}</Text><Box marginTop={2}><Text muted size={1}>Search all {title.toLowerCase()}. Live + changes means newer edits are waiting to be published.</Text></Box></Box>
        <Flex gap={2} wrap="wrap">
          <Button disabled={loading} icon={RefreshIcon} loading={loading} mode="ghost" onClick={() => setRefresh((value) => value + 1)} text="Refresh list" />
          <IntentLink intent="create" params={{type}} style={{textDecoration: "none"}}><Button icon={AddIcon} text={`Create ${singular}`} tone="primary" /></IntentLink>
        </Flex>
      </Flex>
      <Flex gap={2} wrap="wrap">
        {filters.map((filter) => <Button key={filter.value} mode={status === filter.value ? "default" : "ghost"} tone={status === filter.value ? "primary" : "default"} onClick={() => {setStatus(filter.value); setPage(1);}} text={`${filter.label} (${result.counts[filter.value]})`} />)}
      </Flex>
      <TextInput aria-label={`Search ${title.toLowerCase()}`} icon={SearchIcon} onChange={(event) => {setSearch(event.currentTarget.value); setPage(1);}} placeholder={type === "post" ? "Search all articles by title, slug, company or category" : "Search all companies by name, slug, industry or SEO text"} value={search} />
      {error && <Card border padding={4} radius={2} tone="critical"><Stack space={3}><Text size={1}>The list could not be refreshed: {error}</Text><Box><Button onClick={() => setRefresh((value) => value + 1)} text="Try again" /></Box></Stack></Card>}
      {loading ? <Flex align="center" gap={3} justify="center" padding={6}><Spinner muted /><Text muted>Loading {title.toLowerCase()}…</Text></Flex> : <Card border radius={2} overflow="auto">
        <table style={{borderCollapse: "collapse", minWidth: type === "post" ? 980 : 1130, width: "100%"}}>
          <thead><tr>{[title, ...columns.map((column) => column.label), "Status", "Updated", "Actions"].map((label) => <th key={label} style={{...cellStyle, textAlign: "left"}}><Text muted size={1} weight="semibold">{label}</Text></th>)}</tr></thead>
          <tbody>{result.rows.map((row) => <tr key={row.documentId}>
            <td style={{...cellStyle, maxWidth: 360}}><IntentLink intent="edit" params={{id: row.documentId, type}} style={{color: "inherit", textDecoration: "none"}}><Text size={1} weight="semibold">{row.title || `Untitled ${singular}`}</Text></IntentLink></td>
            {columns.map((column) => <td key={column.key} style={{...cellStyle, maxWidth: 320}}><Text size={1} textOverflow="ellipsis">{row[column.key] || "—"}</Text></td>)}
            <td style={cellStyle}><Badge tone={statusDetails[row.status].tone}>{statusDetails[row.status].label}</Badge></td>
            <td style={cellStyle}><Text muted size={1}>{formatIstDate(row._updatedAt)}</Text></td>
            <td style={cellStyle}><IntentLink intent="edit" params={{id: row.documentId, type}} style={{textDecoration: "none"}}><Button mode="ghost" text="Edit" /></IntentLink></td>
          </tr>)}</tbody>
        </table>
        {!result.rows.length && <Box padding={6}><Text align="center" muted>No {title.toLowerCase()} match this view.</Text></Box>}
      </Card>}
      <Flex align="center" gap={3} justify="space-between" wrap="wrap">
        <Text muted size={1}>{total ? (page - 1) * MANAGER_PAGE_SIZE + 1 : 0}–{Math.min(page * MANAGER_PAGE_SIZE, total)} of {total} · Page {page} of {pages}</Text>
        <Flex gap={2}><Button disabled={loading || page <= 1} mode="ghost" onClick={() => setPage((value) => value - 1)} text="Previous" /><Button disabled={loading || page >= pages} mode="ghost" onClick={() => setPage((value) => value + 1)} text="Next" /></Flex>
      </Flex>
    </Stack>
  </Card>;
}
