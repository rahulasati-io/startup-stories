// Pure normalization rules shared by the snapshot importer, pages and tests.
export function numeric(value){
  if(value===null||value===undefined||value===''||String(value).trim()==='-')return null;
  const cleaned=typeof value==='number'?value:Number(String(value).replace(/,/g,'').trim());
  if(!Number.isFinite(cleaned))throw new Error(`Invalid numeric value: ${value}`);
  return cleaned;
}
export function observationDate(value){
  if(typeof value==='number')return new Date(Date.UTC(1899,11,30)+value*86400000).toISOString().slice(0,10);
  const match=String(value).match(/^(?:(\d{1,2})-)?([A-Za-z]{3})-(\d{4})$/);
  if(match){const m=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(match[2].toLowerCase());if(m>=0)return `${match[3]}-${String(m+1).padStart(2,'0')}-${String(match[1]||1).padStart(2,'0')}`;}
  if(/^\d{4}-\d{2}-\d{2}$/.test(String(value))&&Number.isFinite(Date.parse(value)))return String(value);
  throw new Error(`Unrecognised observation date: ${value}`);
}
export function ordered(rows){
  const keys=new Set();
  for(const row of rows){if(keys.has(row.period))throw new Error(`Duplicate period: ${row.period}`);keys.add(row.period);}
  return rows.sort((a,b)=>a.period.localeCompare(b.period));
}
export function inflationRows(rows,key){
  const lookup=new Map(rows.map(row=>[row.period.slice(0,7),row[key]]));
  return rows.map(row=>{const [year,month]=row.period.split('-');const previous=lookup.get(`${Number(year)-1}-${month}`);return {...row,[`${key}Inflation`]:typeof row[key]==='number'&&typeof previous==='number'&&previous>0?(row[key]/previous-1)*100:null};});
}
export function rateChanges(rows,key){
  // A weekly snapshot cannot establish the actual policy effective date.
  return rows.filter((row,i)=>i===0||row[key]!==rows[i-1][key]);
}
export function datasetJsonLd(page,siteUrl){
  if(page.reviewRequired||page.withheld)return null;
  const url=new URL(`/data/${page.slug}`,siteUrl).toString();
  return {'@context':'https://schema.org','@type':'Dataset','@id':`${url}#dataset`,name:page.title,description:page.description,url,publisher:{'@id':new URL('/#organization',siteUrl).toString()},spatialCoverage:{'@type':'Place',name:'India'},variableMeasured:page.metrics.map(metric=>({'@type':'PropertyValue',name:metric.label,unitText:metric.unit})),includedInDataCatalog:{'@type':'DataCatalog','@id':new URL('/data#catalog',siteUrl).toString(),name:'MisterStory Data',url:new URL('/data',siteUrl).toString()}};
}
export function dataCatalogJsonLd(pages,siteUrl){
  const published=pages.filter(page=>!page.reviewRequired&&!page.withheld);
  if(!published.length)return null;
  return {'@context':'https://schema.org','@type':'DataCatalog','@id':new URL('/data#catalog',siteUrl).toString(),name:'MisterStory Data',url:new URL('/data',siteUrl).toString(),publisher:{'@id':new URL('/#organization',siteUrl).toString()},dataset:published.map(page=>({'@type':'Dataset','@id':new URL(`/data/${page.slug}#dataset`,siteUrl).toString(),name:page.title,url:new URL(`/data/${page.slug}`,siteUrl).toString()}))};
}
export function normalizeDataBank(raw){
  for(const name of ['RBI','CPI','GDP Growth','SIP Data','Nifty Return','Largest IPO'])if(!Array.isArray(raw[name]))throw new Error(`Missing sheet: ${name}`);
  if(!/repo/i.test(String(raw.RBI[0]?.[1]))||!/reserve ratio/i.test(String(raw.RBI[0]?.[2])))throw new Error('RBI columns do not match the expected repo / CRR layout');
  if(!/2012/.test(String(raw.CPI[0]?.[1]))||!/2024/.test(String(raw.CPI[0]?.[2])))throw new Error('CPI columns must explicitly identify the 2012 and 2024 base years');
  const rbi=ordered(raw.RBI.slice(1).filter(r=>r[0]!==undefined&&r[0]!==null&&r[0]!=='').map(r=>({period:observationDate(r[0]),repo:numeric(r[1]),crr:numeric(r[2])})));
  for(const row of rbi)for(const key of ['repo','crr'])if(row[key]!==null&&(row[key]<0||row[key]>100))throw new Error(`Invalid rate: ${row.period}`);
  let cpi=ordered(raw.CPI.slice(1).filter(r=>r[0]!==undefined&&r[0]!==null&&r[0]!=='').map(r=>({period:observationDate(r[0]).slice(0,7)+'-01',cpi2012:numeric(r[1]),cpi2024:numeric(r[2]),exchange:numeric(r[3])})));
  for(const row of cpi)for(const key of ['cpi2012','cpi2024','exchange'])if(row[key]!==null&&row[key]<=0)throw new Error(`Invalid ${key}: ${row.period}`);
  cpi=inflationRows(inflationRows(cpi,'cpi2012'),'cpi2024');
  const gdp=ordered(raw['GDP Growth'].slice(1).filter(r=>/^\d{4}$/.test(String(r[0]))&&numeric(r[1])!==null).map(r=>({period:String(r[0]),growth:numeric(r[1])})));
  const nifty=ordered(raw['Nifty Return'].slice(1).filter(r=>/^\d{4}$/.test(String(r[0]))).map(r=>{const percentText=typeof r[1]==='string'&&r[1].includes('%');const value=numeric(percentText?r[1].replace('%',''):r[1]);return {period:String(r[0]),returns:value===null?null:value*(percentText?1:100)};}));
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const sip=[];const header=raw['SIP Data'][1];
  for(let col=1;col<header.length;col++){
    const fy=/^FY\s+(\d{4})-\d{2}$/.exec(String(header[col]||''));if(!fy)continue;
    for(const row of raw['SIP Data'].slice(2)){const month=months.indexOf(row[0]);if(month<0)continue;const value=numeric(row[col]);if(value===null)continue;if(value<0)throw new Error('Negative SIP contribution');sip.push({period:`${Number(fy[1])+(month<3?1:0)}-${String(month+1).padStart(2,'0')}-01`,contribution:value});}
  }
  const ipo=raw['Largest IPO'].filter(r=>typeof r[0]==='number'&&r[1]).map(r=>({rank:r[0],company:String(r[1]),year:numeric(r[2]),issueSize:numeric(r[3])}));
  return {rbi,cpi,gdp,nifty,sip:ordered(sip),ipo};
}
