import { createHash } from "node:crypto";

const key = (...parts) => createHash("sha1").update(parts.join(":"), "utf8").digest("hex").slice(0, 12);

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

export function markdownToPortableText(markdown, articleSlug) {
  const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];

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

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
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
