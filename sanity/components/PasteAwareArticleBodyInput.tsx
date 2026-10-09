"use client";

import {PortableTextInput, type OnPasteFn, type PortableTextInputProps} from "sanity";

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

function rowsFromMarkdown(text: string) {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 3 || !lines[0].includes("|") || !lines[1].includes("|")) return null;

  const separatorCell = /^:?-{3,}:?$/;
  const splitRow = (line: string) => {
    const withoutEdges = line.replace(/^\|/, "").replace(/\|$/, "");
    return withoutEdges.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, "|").trim());
  };
  const separator = splitRow(lines[1]);
  if (separator.length < 2 || !separator.every((cell) => separatorCell.test(cell.replace(/\s/g, "")))) {
    return null;
  }

  return normalizeRows([splitRow(lines[0]), ...lines.slice(2).map(splitRow)]);
}

export default function PasteAwareArticleBodyInput(props: PortableTextInputProps) {
  const onPaste: OnPasteFn = (data) => {
    const clipboard = data.event.clipboardData;
    const plainText = clipboard.getData("text/plain");
    const rows = rowsFromHtml(clipboard.getData("text/html"))
      || rowsFromTabs(plainText)
      || rowsFromMarkdown(plainText);
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

  return <PortableTextInput {...props} onPaste={onPaste} />;
}
