"use client";

import type {OnPasteFn, PortableTextInputProps} from "sanity";

type TableRow = {
  _key: string;
  _type: "articleTableRow";
  cells: string[];
};

function key() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
}

function cleanCell(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n+/g, " ").trim();
}

function normalizeRows(rows: string[][]) {
  const nonEmptyRows = rows
    .map((row) => row.map(cleanCell))
    .filter((row) => row.some(Boolean))
    .slice(0, 100);
  const width = Math.min(30, Math.max(0, ...nonEmptyRows.map((row) => row.length)));
  if (nonEmptyRows.length < 2 || width < 2) return null;

  return nonEmptyRows.map<TableRow>((row) => ({
    _key: key(),
    _type: "articleTableRow",
    cells: Array.from({length: width}, (_, index) => row[index] || ""),
  }));
}

function rowsFromHtml(html: string) {
  if (!html || typeof DOMParser === "undefined") return null;
  const document = new DOMParser().parseFromString(html, "text/html");
  const table = document.querySelector("table");
  if (!table) return null;

  const rows = Array.from(table.rows).map((row) => {
    const cells: string[] = [];
    for (const cell of Array.from(row.cells)) {
      cells.push(cleanCell(cell.innerText || cell.textContent || ""));
      for (let index = 1; index < Math.max(1, cell.colSpan); index += 1) cells.push("");
    }
    return cells;
  });
  return normalizeRows(rows);
}

function rowsFromTabs(text: string) {
  if (!text.includes("\t")) return null;
  const rows = text.replace(/\r\n?/g, "\n").split("\n").map((row) => row.split("\t"));
  return normalizeRows(rows);
}

export default function PasteAwareArticleBodyInput(props: PortableTextInputProps) {
  const onPaste: OnPasteFn = (data) => {
    const clipboard = data.event.clipboardData;
    const rows = rowsFromHtml(clipboard.getData("text/html")) || rowsFromTabs(clipboard.getData("text/plain"));
    if (!rows) return undefined;

    data.event.preventDefault();
    return {
      path: data.path,
      insert: [{
        _key: key(),
        _type: "articleTable",
        headerRow: true,
        rows,
      }],
    };
  };

  return props.renderDefault({...props, onPaste} as PortableTextInputProps);
}
