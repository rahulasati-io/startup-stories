"use client";

import {
  PortableTextInput,
  type OnPasteFn,
  type PortableTextInputProps,
  type TypedObject,
} from "sanity";

type TableRow = {
  _key: string;
  _type: "articleTableRow";
  cells: string[];
};

type Span = {
  _key: string;
  _type: "span";
  text: string;
  marks: string[];
};

type MarkDef = {
  _key: string;
  _type: "link";
  href: string;
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

function tableBlock(rows: TableRow[]): TypedObject {
  return {_key: key(), _type: "articleTable", headerRow: true, rows};
}

function rowsFromTable(table: HTMLTableElement) {
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

function pushSpan(children: Span[], text: string, marks: string[]) {
  const normalized = text.replace(/\u00a0/g, " ").replace(/[ \t\f\v]+/g, " ");
  if (!normalized) return;
  const previous = children.at(-1);
  if (previous && previous.marks.join("|") === marks.join("|")) {
    previous.text += normalized;
    return;
  }
  children.push({_key: key(), _type: "span", text: normalized, marks});
}

function inlineContent(element: Element) {
  const children: Span[] = [];
  const markDefs: MarkDef[] = [];

  const visit = (node: Node, marks: string[]) => {
    if (node.nodeType === Node.TEXT_NODE) {
      pushSpan(children, node.textContent || "", marks);
      return;
    }
    if (!(node instanceof HTMLElement)) return;

    const tag = node.tagName.toLowerCase();
    if (tag === "br") {
      pushSpan(children, "\n", marks);
      return;
    }
    if (tag === "ul" || tag === "ol" || tag === "table") return;

    let nextMarks = marks;
    if (tag === "strong" || tag === "b") nextMarks = [...marks, "strong"];
    if (tag === "em" || tag === "i") nextMarks = [...marks, "em"];
    if (tag === "a") {
      const href = node.getAttribute("href");
      if (href) {
        const markKey = key();
        markDefs.push({_key: markKey, _type: "link", href});
        nextMarks = [...marks, markKey];
      }
    }
    node.childNodes.forEach((child) => visit(child, nextMarks));
  };

  element.childNodes.forEach((node) => visit(node, []));
  if (children.length === 0) return null;
  children[0].text = children[0].text.trimStart();
  children[children.length - 1].text = children[children.length - 1].text.trimEnd();
  if (!children.some((child) => child.text.trim())) return null;
  return {children, markDefs};
}

function textBlock(
  textOrElement: string | Element,
  options: {style?: string; listItem?: "bullet" | "number"; level?: number} = {},
): TypedObject | null {
  const content = typeof textOrElement === "string"
    ? {
        children: [{_key: key(), _type: "span" as const, text: textOrElement.trim(), marks: []}],
        markDefs: [] as MarkDef[],
      }
    : inlineContent(textOrElement);
  if (!content || !content.children.some((child) => child.text.trim())) return null;

  return {
    _key: key(),
    _type: "block",
    style: options.style || "normal",
    ...(options.listItem ? {listItem: options.listItem, level: options.level || 1} : {}),
    markDefs: content.markDefs,
    children: content.children,
  };
}

function blocksFromHtml(html: string) {
  if (!html || typeof DOMParser === "undefined") return null;
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document.querySelector("table")) return null;
  const blocks: TypedObject[] = [];

  const append = (block: TypedObject | null) => {
    if (block) blocks.push(block);
  };

  const visitContainer = (container: Element, listLevel = 1) => {
    container.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) append(textBlock(text));
        return;
      }
      if (!(node instanceof HTMLElement)) return;
      const tag = node.tagName.toLowerCase();

      if (tag === "table") {
        const rows = rowsFromTable(node as HTMLTableElement);
        if (rows) blocks.push(tableBlock(rows));
        return;
      }
      if (/^h[1-4]$/.test(tag)) {
        append(textBlock(node, {style: tag}));
        return;
      }
      if (tag === "p" || tag === "blockquote" || tag === "pre") {
        append(textBlock(node, {style: tag === "blockquote" ? "blockquote" : "normal"}));
        return;
      }
      if (tag === "ul" || tag === "ol") {
        const listItem = tag === "ol" ? "number" : "bullet";
        Array.from(node.children).forEach((child) => {
          if (child.tagName.toLowerCase() !== "li") return;
          append(textBlock(child, {listItem, level: listLevel}));
          Array.from(child.children)
            .filter((nested) => ["ul", "ol"].includes(nested.tagName.toLowerCase()))
            .forEach((nested) => visitContainer(nested, listLevel + 1));
        });
        return;
      }

      const hasBlockChildren = Array.from(node.children).some((child) =>
        /^(table|h[1-4]|p|blockquote|pre|ul|ol|div|section|article|main)$/i.test(child.tagName),
      );
      if (hasBlockChildren) visitContainer(node, listLevel);
      else append(textBlock(node));
    });
  };

  visitContainer(document.body);
  return blocks.some((block) => block._type === "articleTable") ? blocks : null;
}

function splitMarkdownRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replace(/\\\|/g, "|").trim());
}

function isMarkdownSeparator(line: string) {
  const cells = splitMarkdownRow(line);
  return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")));
}

function blocksFromMarkdown(text: string) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const hasTable = lines.some((line, index) =>
    index > 0 && line.includes("|") && lines[index - 1].includes("|") && isMarkdownSeparator(line),
  );
  if (!hasTable) return null;

  const blocks: TypedObject[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (index + 1 < lines.length && line.includes("|") && isMarkdownSeparator(lines[index + 1])) {
      const rows = [splitMarkdownRow(line)];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(splitMarkdownRow(lines[index]));
        index += 1;
      }
      const normalized = normalizeRows(rows);
      if (normalized) blocks.push(tableBlock(normalized));
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const block = textBlock(heading[2], {style: `h${heading[1].length}`});
      if (block) blocks.push(block);
      index += 1;
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      const block = textBlock((bullet || numbered)![1], {listItem: bullet ? "bullet" : "number"});
      if (block) blocks.push(block);
      index += 1;
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim()) {
      if (/^(#{1,4})\s+/.test(lines[index]) || /^[-*+]\s+/.test(lines[index]) || /^\d+[.)]\s+/.test(lines[index])) break;
      if (index + 1 < lines.length && lines[index].includes("|") && isMarkdownSeparator(lines[index + 1])) break;
      paragraph.push(lines[index].trim());
      index += 1;
    }
    const block = textBlock(paragraph.join(" "));
    if (block) blocks.push(block);
  }
  return blocks;
}

function rowsFromTabs(text: string) {
  if (!text.includes("\t")) return null;
  return normalizeRows(text.replace(/\r\n?/g, "\n").split("\n").map((row) => row.split("\t")));
}

export default function PasteAwareArticleBodyInput(props: PortableTextInputProps) {
  const onPaste: OnPasteFn = (data) => {
    const clipboard = data.event.clipboardData;
    const plainText = clipboard.getData("text/plain");
    const mixedBlocks = blocksFromHtml(clipboard.getData("text/html")) || blocksFromMarkdown(plainText);
    const tabularRows = mixedBlocks ? null : rowsFromTabs(plainText);
    const insert = mixedBlocks || (tabularRows ? [tableBlock(tabularRows)] : null);
    if (!insert) return undefined;

    data.event.preventDefault();
    return {path: data.path, insert};
  };

  return <PortableTextInput {...props} onPaste={onPaste} />;
}
