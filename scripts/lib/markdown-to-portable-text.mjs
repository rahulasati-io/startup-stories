import { createHash } from "node:crypto";

const key = (...parts) => createHash("sha1").update(parts.join(":"), "utf8").digest("hex").slice(0, 12);

export function portableTextWordCount(body) {
  return (body || []).flatMap(block => block._type === "articleTable"
    ? (block.rows || []).flatMap(row => row.cells || [])
    : (block.children || []).map(child => child.text || ""))
    .join(" ").split(/\s+/).filter(Boolean).length;
}

function inlineContent(text, articleSlug, blockIndex) {
  const children = [];
  const markDefs = [];
  const tokenPattern = /\[([^\]]+)]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g;
  let cursor = 0;
  let match;

  const addSpan = (value, marks = []) => {
    if (!value) return;
    children.push({
      _key: key(articleSlug, "span", blockIndex, children.length, value),
      _type: "span",
      text: value,
      marks,
    });
  };

  while ((match = tokenPattern.exec(text)) !== null) {
    addSpan(text.slice(cursor, match.index));
    if (match[1]) {
      const markKey = key(articleSlug, "link", blockIndex, markDefs.length, match[2]);
      markDefs.push({ _key: markKey, _type: "link", href: match[2] });
      addSpan(match[1], [markKey]);
    } else if (match[3] || match[4]) {
      addSpan(match[3] || match[4], ["strong"]);
    } else {
      addSpan(match[5] || match[6], ["em"]);
    }
    cursor = tokenPattern.lastIndex;
  }
  addSpan(text.slice(cursor));
  return { children, markDefs };
}

function tableCells(rawLine) {
  const line = rawLine.trim();
  const cells = [];
  let cell = "";
  let separators = 0;
  let trailingSeparator = false;
  for (const character of line) {
    if (character !== "|") {cell += character; trailingSeparator = false; continue;}
    const slashes = cell.match(/\\+$/)?.[0].length || 0;
    if (slashes % 2) {cell = cell.slice(0, -1) + "|"; trailingSeparator = false;}
    else {cells.push(cell.trim()); cell = ""; separators++; trailingSeparator = true;}
  }
  cells.push(cell.trim());
  if (line.startsWith("|")) cells.shift();
  if (trailingSeparator) cells.pop();
  return {cells, separators};
}

function tableSeparator(line) {
  const {cells, separators} = tableCells(line);
  return separators > 0 && cells.length >= 2 && cells.every(cell => /^:?-{3,}:?$/.test(cell)) ? cells : null;
}

export function markdownToPortableText(markdown, articleSlug, {tables = false} = {}) {
  const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let fence = null;

  const addBlock = (text, style = "normal", listItem) => {
    const normalized = text.trim();
    if (!normalized) return;
    const blockIndex = blocks.length;
    const inline = inlineContent(normalized, articleSlug, blockIndex);
    blocks.push({
      _key: key(articleSlug, "block", blockIndex, style, normalized),
      _type: "block",
      style,
      ...(listItem ? { listItem, level: 1 } : {}),
      ...inline,
    });
  };

  const flushParagraph = () => {
    addBlock(paragraph.join(" "));
    paragraph = [];
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex];
    const line = rawLine.trim();
    // Code examples are not real tables. Fenced code otherwise retains the
    // importer's existing plain-text behavior; it is not a new rich-code feature.
    const fenceLine = tables && /^(\x60{3,}|~{3,})/.exec(line);
    if (fenceLine) {
      if (!fence) fence = fenceLine[1];
      else if (fenceLine[1][0] === fence[0] && fenceLine[1].length >= fence.length) fence = null;
      paragraph.push(line);
      continue;
    }
    if (fence) {paragraph.push(line); continue;}
    if (!line) {
      flushParagraph();
      continue;
    }
    const header = tableCells(line);
    const separator = tables && lineIndex + 1 < lines.length ? tableSeparator(lines[lineIndex + 1]) : null;
    if (header.separators && header.cells.length >= 2 && separator) {
      const tableLine = lineIndex + 1;
      const fail = message => {throw new Error(`Article "${articleSlug}", table at line ${tableLine}: ${message}`);};
      if (header.cells.length !== separator.length) fail(`header has ${header.cells.length} columns but separator has ${separator.length}.`);
      flushParagraph();
      const rows = [header.cells];
      let next = lineIndex + 2;
      while (next < lines.length && lines[next].trim()) {
        const candidate = lines[next].trim();
        // A new heading/list/quote ends the table, even without a blank line.
        if (/^(?:#{1,6}\s|[-*+]\s|\d+[.)]\s|>)/.test(candidate)) break;
        if (next + 1 < lines.length && tableSeparator(lines[next + 1])) break;
        const row = tableCells(candidate);
        if (!row.separators) break;
        if (row.cells.length !== header.cells.length) fail(`line ${next + 1} has ${row.cells.length} columns; expected ${header.cells.length}. Use \\| for a literal pipe inside a cell.`);
        rows.push(row.cells);
        next++;
      }
      if (rows.length < 2) fail("add at least one data row below the separator.");
      const blockIndex = blocks.length;
      blocks.push({
        _key: key(articleSlug, "table", blockIndex, JSON.stringify(rows)),
        _type: "articleTable",
        headerRow: true,
        rows: rows.map((cells, index) => ({_key: key(articleSlug, "table-row", blockIndex, index, JSON.stringify(cells)), _type: "articleTableRow", cells})),
      });
      lineIndex = next - 1;
      continue;
    }
    const heading = /^(#{2,4})\s+(.+)$/.exec(line);
    const bullet = /^[-*+]\s+(.+)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.+)$/.exec(line);
    const quote = /^>\s?(.+)$/.exec(line);
    if (heading || bullet || numbered || quote) flushParagraph();
    if (heading) addBlock(heading[2], `h${heading[1].length}`);
    else if (bullet) addBlock(bullet[1], "normal", "bullet");
    else if (numbered) addBlock(numbered[1], "normal", "number");
    else if (quote) addBlock(quote[1], "blockquote");
    else paragraph.push(line);
  }
  flushParagraph();
  return blocks;
}
