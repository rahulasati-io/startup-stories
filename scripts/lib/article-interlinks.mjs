import {createHash} from "node:crypto";

export const LINK_TARGETS_QUERY = `*[_type in ["company", "founder"] && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && defined(slug.current)]{_id,_type,name,"slug":slug.current}`;
const origin = "https://misterstory.in";
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hash = value => createHash("sha1").update(value).digest("hex").slice(0, 12);
// Reviewed display variants only, never invented by removing arbitrary words.
const companyAliases = {
  "eternal": ["Eternal"], "blue-tokai": ["Blue Tokai"],
  "cg-power": ["CG Power"], "tvs-motor": ["TVS Motor"],
  "snitch": ["Snitch"], "solar-industries-india": ["Solar Industries"],
  "skyroot-aerospace": ["Skyroot"], "digit-insurance": ["Digit"],
  "dixon-technologies": ["Dixon"],
};
// Ordinary words, places or products need an explicit article-company association.
const contextRequired = new Set(["jupiter", "bounce", "leap", "minimalist", "navi", "plum", "porter", "postman", "pronto", "scaler", "slice", "trent", "boat", "skyroot-aerospace", "digit-insurance", "dixon-technologies", "eternal"]);

export function internalDestination(href) {
  try {
    const url = new URL(href, origin);
    if (!["misterstory.in", "www.misterstory.in"].includes(url.hostname) || !["https:", "http:"].includes(url.protocol)) return null;
    return url.pathname.replace(/\/$/, "") || "/";
  } catch {return null;}
}

// Exact published display names only. No guessed aliases or fuzzy matches.
// Case-insensitive ambiguity detection also protects duplicate person names.
export function buildLinkTargets(documents) {
  const names = new Map();
  for (const doc of documents) {
    const name = doc.name?.trim();
    if (!name || name.length < 3 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doc.slug || "") || doc._id?.startsWith("drafts.")) continue;
    if (!["company", "founder"].includes(doc._type)) continue;
    const href = `${origin}/${doc._type === "company" ? "companies" : "people"}/${doc.slug}`;
    for (const variant of [name, ...(doc._type === "company" ? companyAliases[doc.slug] || [] : [])]) {
      const group = names.get(variant.toLowerCase()) || new Map();
      const variants = group.get(href) || [];
      if (!variants.some(item => item.name === variant)) variants.push({name: variant, href, companySlug: doc._type === "company" ? doc.slug : undefined});
      group.set(href, variants);
      names.set(variant.toLowerCase(), group);
    }
  }
  const ambiguous = [...names].filter(([, group]) => group.size > 1).map(([name]) => name);
  const targets = [...names.values()].filter(group => group.size === 1).flatMap(group => [...group.values()][0]);
  targets.sort((a,b) => b.name.length - a.name.length || a.href.localeCompare(b.href));
  const byName = new Map(targets.map(target => [target.name, target]));
  const pattern = targets.length ? new RegExp(`(?<![\\p{L}\\p{N}_])(?:${targets.map(t => escapeRegex(t.name)).join("|")})(?![\\p{L}\\p{N}_])`, "gu") : null;
  return {byName, pattern, ambiguous};
}

export function interlinkArticle(body, catalog, {maxLinks = 3, companySlugs = []} = {}) {
  if (!Array.isArray(body)) return {body, added: [], existingInternalLinks: 0};
  const used = new Set();
  let existingInternalLinks = 0;
  for (const block of body) {
    const defs = new Map((block.markDefs || []).map(def => [def._key, def]));
    let previous = new Set();
    for (const child of block.children || []) {
      const current = new Set();
      for (const mark of child.marks || []) {
        const def = defs.get(mark);
        const destination = def?._type === "link" && def.href ? internalDestination(def.href) : null;
        if (destination) {
          current.add(mark);
          used.add(destination);
          if (!previous.has(mark)) existingInternalLinks++;
        }
      }
      previous = current;
    }
  }
  const added = [];
  if (!catalog.pattern || existingInternalLinks >= maxLinks) return {body, added, existingInternalLinks};
  const result = body.map(block => {
    if (existingInternalLinks + added.length >= maxLinks || block._type !== "block" || ![undefined, "normal", "blockquote"].includes(block.style)) return block;
    if (!block.children?.every(child => child._type === "span" && typeof child.text === "string")) return block;
    const defs = [...(block.markDefs || [])];
    const annotations = new Map(defs.map(def => [def._key, def]));
    let position = 0;
    const spans = block.children.map(child => {
      const span = {child, start: position, end: position + child.text.length};
      position = span.end;
      return span;
    });
    const text = spans.map(span => span.child.text).join("");
    const protectedRanges = [...text.matchAll(/https?:\/\/\S+|www\.\S+|\S+@\S+|`[^`]*`/g)].map(match => [match.index, match.index + match[0].length]);
    const matches = [];
    catalog.pattern.lastIndex = 0;
    for (const match of text.matchAll(catalog.pattern)) {
      if (existingInternalLinks + added.length >= maxLinks) break;
      const target = catalog.byName.get(match[0]);
      if (contextRequired.has(target.companySlug) && !companySlugs.includes(target.companySlug)) continue;
      const destination = internalDestination(target.href);
      const start = match.index;
      const end = start + match[0].length;
      if (used.has(destination) || protectedRanges.some(([a,b]) => start < b && end > a)) continue;
      const covered = spans.filter(span => start < span.end && end > span.start);
      // Preserve every existing annotation, including external/internal links.
      if (covered.some(span => (span.child.marks || []).some(mark => mark === "code" || annotations.has(mark)))) continue;
      let markKey = `auto-${hash(`${block._key}:${start}:${target.href}`)}`;
      while (defs.some(def => def._key === markKey)) markKey += "x";
      defs.push({_type: "link", _key: markKey, href: target.href});
      matches.push({start, end, markKey});
      added.push({name: match[0], href: target.href});
      used.add(destination);
    }
    if (!matches.length) return block;
    const children = spans.flatMap(({child, start, end}) => {
      const overlaps = matches.filter(match => match.start < end && match.end > start);
      if (!overlaps.length) return [child];
      const cuts = [...new Set([start, end, ...overlaps.flatMap(match => [Math.max(start, match.start), Math.min(end, match.end)])])].sort((a,b) => a-b);
      return cuts.slice(0,-1).map((a,index) => {
        const b = cuts[index+1];
        const link = overlaps.find(match => a >= match.start && b <= match.end);
        return {...child, _key: `span-${hash(`${child._key}:${a}:${b}:${child.text}`)}`, text: child.text.slice(a-start,b-start), marks: [...(child.marks || []), ...(link ? [link.markKey] : [])]};
      });
    });
    return {...block, children, markDefs: defs};
  });
  return {body: added.length ? result : body, added, existingInternalLinks};
}
