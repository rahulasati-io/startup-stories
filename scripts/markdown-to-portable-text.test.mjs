import test from 'node:test';
import assert from 'node:assert/strict';
import {markdownToPortableText, portableTextWordCount} from './lib/markdown-to-portable-text.mjs';
const parse = (markdown, slug) => markdownToPortableText(markdown, slug, {tables:true});
const table = '| Metric | FY25 | FY26 |\n| --- | --- | --- |\n| Revenue | ₹100 crore | ₹150 crore |\n| Profit | -10 | 0 |';
const text = block => block.children?.map(child=>child.text).join('');

test('Markdown table maps to existing Sanity articleTable / articleTableRow schema',()=>{
  const [value]=parse(table,'example');
  assert.equal(value._type,'articleTable');
  assert.equal(value.headerRow,true);
  assert.deepEqual(value.rows.map(row=>row.cells),[['Metric','FY25','FY26'],['Revenue','₹100 crore','₹150 crore'],['Profit','-10','0']]);
  assert(value.rows.every(row=>row._key&&row._type==='articleTableRow'));
  assert(!value.rows.flatMap(row=>row.cells).includes('---'));
});

test('mixed text/headings/lists/links/tables remain separate in original order',()=>{
  const blocks=parse(`Introduction with **bold**.\n\n## Results\n\n${table}\n\nMore [company](https://misterstory.in/companies/example) detail.\n\n- First\n1. Next\n> Quote`,'example');
  assert.deepEqual(blocks.map(b=>b._type),['block','block','articleTable','block','block','block','block']);
  assert.equal(blocks[1].style,'h2');
  assert.equal(text(blocks[3]),'More company detail.');
  assert.equal(blocks[3].markDefs[0].href,'https://misterstory.in/companies/example');
  assert.equal(blocks[4].listItem,'bullet');
  assert.equal(blocks[5].listItem,'number');
  assert.equal(blocks[6].style,'blockquote');
});

test('optional outside pipes, whitespace and alignment separator syntax are accepted',()=>{
  const [value]=parse('Name | Amount\r\n:--- | ---:\r\nExample | 123','example');
  assert.deepEqual(value.rows.map(row=>row.cells),[['Name','Amount'],['Example','123']]);
});

test('blank cells and escaped pipes are preserved without changing columns',()=>{
  const [value]=parse('| A | B | C |\n| --- | --- | --- |\n| One \\| Two | | Last |','example');
  assert.deepEqual(value.rows[1].cells,['One | Two','','Last']);
});

test('ragged table/header/separator fails clearly before an article can be imported',()=>{
  assert.throws(()=>parse('| A | B |\n| --- | --- |\n| 1 | 2 | 3 |','slug'),/slug.*line 1.*line 3.*expected 2/);
  assert.throws(()=>parse('| A | B |\n| --- | --- | --- |\n| 1 | 2 |','slug'),/header has 2 columns but separator has 3/);
  assert.throws(()=>parse('| A | B |\n| --- | --- |','slug'),/at least one data row/);
});

test('ordinary pipes, horizontal rules and fenced examples do not become tables',()=>{
  for(const content of ['Revenue | Profit\nordinary prose','| A | B |\nnot a separator\n| 1 | 2 |','---\nSome text',`\x60\x60\x60markdown\n${table}\n\x60\x60\x60`]) assert(parse(content,'example').every(block=>block._type==='block'));
});

test('table boundary preserves text immediately before and after, with multiple tables',()=>{
  const blocks=parse(`Before\n${table}\nAfter\n\n${table}\n## Next heading | keeps pipe`,'example');
  assert.deepEqual(blocks.map(b=>b._type),['block','articleTable','block','articleTable','block']);
  assert.equal(text(blocks[0]),'Before');
  assert.equal(text(blocks[2]),'After');
  assert.equal(blocks[4].style,'h2');
});

test('tables receive stable unique keys across identical imports and repeated rows/tables',()=>{
  const input=`${table}\n\n${table}`;
  const blocks=parse(input,'example');
  assert.deepEqual(blocks,parse(input,'example'));
  const keys=blocks.flatMap(b=>[b._key,...(b.rows||[]).map(row=>row._key)]);
  assert.equal(new Set(keys).size,keys.length);
});

test('existing text-only Markdown features remain supported',()=>{
  const blocks=parse('## Main\n\n### Sub\n\n#### Detail\n\nParagraph **bold** and *italic*.\n\n- Bullet\n2) Number\n> Quote','example');
  assert.deepEqual(blocks.slice(0,3).map(b=>b.style),['h2','h3','h4']);
  assert(blocks[3].children.some(child=>child.marks.includes('strong')));
  assert(blocks[3].children.some(child=>child.marks.includes('em')));
});

test('article audits count table cell text as well as paragraphs',()=>{
  assert.equal(portableTextWordCount(parse(table,'example')),11);
  assert.equal(portableTextWordCount(parse(`Two words\n\n${table}`,'example')),13);
  assert.equal(portableTextWordCount(null),0);
});

test('table conversion is opt-in, preserving company-overview parser behavior',()=>{
  assert(markdownToPortableText(table,'company-example').every(block=>block._type==='block'));
});
