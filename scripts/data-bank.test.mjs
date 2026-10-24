import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {numeric,observationDate,ordered,inflationRows,rateChanges,normalizeDataBank,datasetJsonLd,dataCatalogJsonLd} from '../lib/data-bank.mjs';

test('numeric parsing preserves precision, negative returns and missing versus zero',()=>{
  assert.equal(numeric('1,23,456.78'),123456.78);assert.equal(numeric('5.25'),5.25);assert.equal(numeric('-13.4'),-13.4);assert.equal(numeric('-'),null);assert.equal(numeric(''),null);assert.equal(numeric(0),0);assert.throws(()=>numeric('unknown'));
});
test('source dates are stable in UTC and duplicate periods are rejected',()=>{
  assert.equal(observationDate(46311),'2026-10-16');assert.equal(observationDate('09-Oct-2026'),'2026-10-09');assert.throws(()=>observationDate('wrong'));assert.throws(()=>ordered([{period:'2026'},{period:'2026'}]));
});
test('inflation uses the same month in the same base series, never a neighbouring month',()=>{
  const rows=[{period:'2025-09-01',old:120,new:80},{period:'2026-08-01',old:125,new:83},{period:'2026-09-01',old:126,new:null}];
  const old=inflationRows(rows,'old');assert.ok(Math.abs(old[2].oldInflation-5)<1e-10);assert.equal(old[1].oldInflation,null);assert.equal(inflationRows(rows,'new')[2].newInflation,null);
});
test('weekly rate changes retain observation dates without asserting effective dates',()=>{
  const rows=[{period:'2026-01-02',rate:5.25},{period:'2026-01-09',rate:5.25},{period:'2026-01-16',rate:5.5}];
  assert.deepEqual(rateChanges(rows,'rate').map(row=>row.period),['2026-01-02','2026-01-16']);
});
test('SIP financial-year matrix maps months correctly and excludes FY totals and blank future months',()=>{
  const source={'RBI':[['Period','Repo','Cash Reserve Ratio'],[46311,5.5,3]],'CPI':[['Period','CPI 2012','CPI 2024'],[46311,120,100,90]],'GDP Growth':[['Year'],[2025,7]],'Nifty Return':[['Year'],[2025,.1],[2024,null]],'Largest IPO':[], 'SIP Data':[['Month'],['','FY 2025-26'],['Total during FY',999],['March',30],['April',10],['January',20],['October',null]]};
  const result=normalizeDataBank(source);assert.deepEqual(result.sip,[{period:'2025-04-01',contribution:10},{period:'2026-01-01',contribution:20},{period:'2026-03-01',contribution:30}]);assert.equal(result.nifty[1].returns,10);assert.equal(result.nifty[0].returns,null);
});
test('imported snapshot is typed, ordered and unique; CPI calculated values never bridge bases',()=>{
  const snapshot=JSON.parse(fs.readFileSync(new URL('../content/data-bank/observations.json',import.meta.url)));
  for(const key of ['rbi','cpi','sip','gdp','nifty']){const rows=snapshot[key];assert.ok(rows.length>0);assert.equal(new Set(rows.map(row=>row.period)).size,rows.length);assert.deepEqual(rows.map(row=>row.period),rows.map(row=>row.period).sort());}
  assert.ok(snapshot.cpi.every(row=>row.cpi2012!==null||row.cpi2012Inflation===null));
});
test('owner-approved data, semantic headings, canonical routes and deferred scope are explicit',()=>{
  const library=fs.readFileSync(new URL('../lib/data-library.ts',import.meta.url),'utf8');
  const detail=fs.readFileSync(new URL('../app/data/[slug]/page.tsx',import.meta.url),'utf8');
  const shelf=fs.readFileSync(new URL('../components/DatasetShelf.tsx',import.meta.url),'utf8');
  assert.equal((library.match(/slug:'/g)||[]).length,8);assert.ok(library.includes('const reviewRequired=false'));assert.ok(!library.includes('withheld:true'));assert.ok(library.includes('rows:observations.ipo.map'));
  assert.ok(detail.includes('index:!page.reviewRequired'));assert.ok(detail.includes('alternates:{canonical:'));assert.ok(detail.includes('<h1'));
  assert.ok(shelf.includes('<h2'));assert.ok(shelf.includes('<h3'));assert.ok(shelf.includes('aria-expanded'));assert.ok(shelf.includes('Show all datasets'));
  assert.ok(!detail.includes('Dataset information'));assert.ok(!detail.includes('Source review pending'));assert.ok(!shelf.includes('{page.frequency}'));assert.ok(library.includes("title:'Nifty 50 Annual Return'"));assert.ok(library.includes('calendar year, January to December'));
  for(const slug of ['india-gst','upi-transaction','mutual-fund-aum'])assert.ok(!library.includes(`slug:'${slug}`));
});
test('chart exposes exact values using pointer, keyboard and touch-friendly handlers',()=>{
  const chart=fs.readFileSync(new URL('../components/DatasetChart.tsx',import.meta.url),'utf8');
  for(const text of ['onPointerMove','onKeyDown','role="tooltip"','maximumFractionDigits:decimals','selectedPeriod'])assert.ok(chart.includes(text));
  assert.ok(!chart.includes('Source snapshot under review'));
});
test('source names are optional plain text with no MisterStory fallback',()=>{
  const detail=fs.readFileSync(new URL('../app/data/[slug]/page.tsx',import.meta.url),'utf8');
  const library=fs.readFileSync(new URL('../lib/data-library.ts',import.meta.url),'utf8');
  assert.ok(detail.includes('page.source?.trim()&&'));
  assert.ok(detail.includes('Source: {page.source.trim()}'));
  assert.ok(!detail.includes('href={page.sourceUrl}'));
  assert.ok(!library.includes("source:'MisterStory"));
  const ipo=library.split("slug:'largest-indian-ipos'")[1].split('\n];')[0];
  assert.ok(!ipo.includes('source:'));assert.ok(!ipo.includes('sourceUrl:'));
});
test('inflation page exposes only two base-year inflation series and the requested SEO text',()=>{
  const library=fs.readFileSync(new URL('../lib/data-library.ts',import.meta.url),'utf8');
  const cpi=library.split("slug:'india-cpi-inflation-history'")[1].split("slug:'inr-usd")[0];
  assert.equal((cpi.match(/key:'/g)||[]).length,2);
  for(const key of ['cpi2024Inflation','cpi2012Inflation'])assert.ok(cpi.includes(`key:'${key}'`));
  assert.ok(cpi.includes("title:'Inflation in India History'"));
  assert.ok(cpi.includes("seoTitle:'Inflation in India History: CPI Data & Chart'"));
  assert.ok(cpi.includes('monthly year-on-year CPI inflation'));
});
test('dataset controls sit alongside their content without duplicate chart labels or Apply forms',()=>{
  const detail=fs.readFileSync(new URL('../app/data/[slug]/page.tsx',import.meta.url),'utf8');
  const chart=fs.readFileSync(new URL('../components/DatasetChart.tsx',import.meta.url),'utf8');
  assert.ok(!detail.includes('<select'));assert.ok(!detail.includes('>Apply<'));
  assert.ok(!detail.includes(' over time</h2>'));assert.ok(!detail.includes('Latest observation:'));
  assert.ok(detail.includes('As of '));assert.ok(detail.includes('aria-label="Inflation base year"'));
  assert.ok(detail.indexOf('aria-label="Rate table view"')>detail.indexOf('<section id="historical-table"'));
  assert.ok(detail.includes("choiceHref(metric.key,'weekly','historical-table')"));
  assert.ok(chart.includes('<figcaption className="sr-only">'));
});
test('eight datasets use the four approved categories',()=>{
  const library=fs.readFileSync(new URL('../lib/data-library.ts',import.meta.url),'utf8');
  const categories={};
  for(const match of library.matchAll(/segment:'([^']+)'/g))categories[match[1]]=(categories[match[1]]||0)+1;
  assert.deepEqual(categories,{'Monetary Policy Data':2,'Economy Data':2,'Trade Data':1,'Market Data':3});
  for(const [slug,category] of [['india-cpi-inflation-history','Economy Data'],['india-monthly-sip-contributions','Market Data'],['inr-usd-exchange-rate-history','Trade Data'],['rbi-repo-rate-history','Monetary Policy Data']]){
    assert.ok(library.split(`slug:'${slug}'`)[1].split('\n')[0].includes(`segment:'${category}'`));
  }
});
test('exchange rate display name uses Rupee Dollar while retaining the existing URL',()=>{
  const library=fs.readFileSync(new URL('../lib/data-library.ts',import.meta.url),'utf8');
  assert.ok(library.includes("slug:'inr-usd-exchange-rate-history',title:'Rupee Dollar Exchange Rate History'"));
  assert.ok(!library.includes("title:'INR–USD Exchange Rate History'"));
});
test('all eight datasets have distinct descriptive SEO titles and substantial accurate descriptions',()=>{
  const library=fs.readFileSync(new URL('../lib/data-library.ts',import.meta.url),'utf8');
  const titles=[...library.matchAll(/seoTitle:'([^']+)'/g)].map(match=>match[1]);
  const descriptions=[...library.matchAll(/description:'([^']+)'/g)].map(match=>match[1]);
  assert.equal(titles.length,8);assert.equal(new Set(titles).size,8);
  assert.equal(descriptions.length,8);assert.equal(new Set(descriptions).size,8);
  for(const title of titles){assert.ok(title.length<=70);assert.ok(!/\b(live|today|best|2026)\b/i.test(title));}
  for(const description of descriptions)assert.ok(description.length>=100&&description.length<=180);
  assert.ok(titles.some(title=>title.includes('(CRR)')));assert.ok(titles.some(title=>title.includes('TRI')));
  assert.ok(descriptions.some(description=>description.includes('month-end rupees per US dollar')));
});
test('Dataset markup is withheld for review content and describes only an approved dataset',()=>{
  const page={slug:'test',title:'Test dataset',description:'A complete description of a verified historical economic dataset.',metrics:[{label:'Rate',unit:'%'}],reviewRequired:true};
  assert.equal(datasetJsonLd(page,'https://misterstory.in'),null);
  assert.equal(datasetJsonLd({...page,reviewRequired:false,withheld:true},'https://misterstory.in'),null);
  const schema=datasetJsonLd({...page,reviewRequired:false},'https://misterstory.in');assert.equal(schema['@type'],'Dataset');assert.equal(schema.url,'https://misterstory.in/data/test');assert.equal(schema.variableMeasured[0].unitText,'%');assert.ok(!schema.distribution);
  assert.deepEqual(schema.publisher,{'@id':'https://misterstory.in/#organization'});
  assert.equal(schema.includedInDataCatalog['@id'],'https://misterstory.in/data#catalog');
});
test('every data page has six unique keywords and the metadata uses them',()=>{
  const library=fs.readFileSync(new URL('../lib/data-library.ts',import.meta.url),'utf8');
  const lists=[...library.matchAll(/keywords:\[([^\]]+)\]/g)].map(match=>[...match[1].matchAll(/'([^']+)'/g)].map(word=>word[1]));
  assert.equal(lists.length,8);
  for(const keywords of lists){assert.equal(keywords.length,6);assert.equal(new Set(keywords.map(word=>word.toLowerCase())).size,6);}
  const detail=fs.readFileSync(new URL('../app/data/[slug]/page.tsx',import.meta.url),'utf8');
  const hub=fs.readFileSync(new URL('../app/data/page.tsx',import.meta.url),'utf8');
  assert.ok(detail.includes('keywords:page.keywords'));assert.ok(hub.includes('keywords:['));assert.ok(hub.includes('<JsonLd data={catalog}/>'));
});
test('catalog publisher reuses the organization and excludes unapproved entries',()=>{
  const visible={slug:'repo',title:'Repo history',reviewRequired:false};
  const catalog=dataCatalogJsonLd([visible,{...visible,slug:'draft',reviewRequired:true},{...visible,slug:'hidden',withheld:true}],'https://misterstory.in');
  assert.equal(catalog['@type'],'DataCatalog');assert.equal(catalog.dataset.length,1);
  assert.deepEqual(catalog.publisher,{'@id':'https://misterstory.in/#organization'});
  assert.equal(catalog.dataset[0]['@id'],'https://misterstory.in/data/repo#dataset');
  assert.equal(dataCatalogJsonLd([{...visible,reviewRequired:true}],'https://misterstory.in'),null);
  const root=fs.readFileSync(new URL('../app/layout.tsx',import.meta.url),'utf8');
  assert.ok(root.includes('misterStoryOrganizationJsonLd()'));
});
