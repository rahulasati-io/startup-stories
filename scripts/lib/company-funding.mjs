import {FINANCIAL_CURRENCIES, FINANCIAL_UNITS} from './company-financials.mjs';

export const FUNDING_FIELDS = ['date','type','amount','currency','unit','investors'];
export const FUNDING_UNIT_MULTIPLIERS = {units:1,thousand:1000,lakh:100000,million:1000000,crore:10000000,billion:1000000000};
const clean=value=>value===undefined||value===null?'':String(value).trim();
const present=value=>clean(value)!=='';

export function fundingColumnHeaders(slot){
  return FUNDING_FIELDS.map(field=>`round_${slot}_${field}`);
}

export function fundingDate(value,location){
  if(!present(value))return undefined;
  let text;
  if(value instanceof Date)text=value.toISOString().slice(0,10);
  else if(typeof value==='number'){
    if(!Number.isInteger(value)||value<61||value>2958465)throw Error(`${location}: enter a valid calendar date (yyyy-mm-dd).`);
    text=new Date(Date.UTC(1899,11,30)+value*86400000).toISOString().slice(0,10);
  }else text=clean(value);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text)||!Number.isFinite(Date.parse(text))||new Date(text).toISOString().slice(0,10)!==text){
    throw Error(`${location}: enter a real date in yyyy-mm-dd format.`);
  }
  return text;
}

export function parseCompanyFunding(rows,headers,{companySlugs}={}){
  const groups=new Map();
  for(const header of headers){
    const match=clean(header).match(/^round_(\d+)_(.+)$/i);
    if(!match)continue;
    const slot=Number(match[1]),field=match[2].toLowerCase();
    if(slot<1||slot>100||!FUNDING_FIELDS.includes(field))throw Error(`Funding Rounds: unsupported column "${header}".`);
    if(!groups.has(slot))groups.set(slot,{});
    if(groups.get(slot)[field])throw Error(`Funding Rounds: duplicate round ${slot} ${field} column.`);
    groups.get(slot)[field]=header;
  }
  const observations=[],seen=new Set(),events=new Set();
  for(const [index,row]of rows.entries()){
    const slug=clean(row.company_slug),location=`Funding Rounds row ${row.__rowNumber||index+2}`;
    const entered=[...groups.values()].some(cols=>['date','type','amount','investors'].some(field=>present(row[cols[field]])));
    if(!slug){if(entered)throw Error(`${location}: company_slug is required.`);continue;}
    if(companySlugs&&!companySlugs.has(slug))throw Error(`${location}: company_slug "${slug}" is not on the Companies sheet.`);
    if(seen.has(slug))throw Error(`${location}: duplicate company_slug "${slug}". Keep one row per company.`);
    seen.add(slug);
    for(const [slot,columns]of [...groups].sort((a,b)=>a[0]-b[0])){
      if(!['date','type','amount','investors'].some(field=>present(row[columns[field]])))continue;
      const where=`${location}, ${slug}, round ${slot}`;
      const round=clean(row[columns.type]);
      if(!round)throw Error(`${where}: round_${slot}_type is required.`);
      const date=fundingDate(row[columns.date],where);
      let amount,currency;
      if(present(row[columns.amount])){
        const value=row[columns.amount],text=clean(value);
        if(typeof value==='boolean'||(!/^\+?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)&&!/^\+?(?:\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d+)?$/.test(text)))throw Error(`${where}: amount must be a non-negative number without currency symbols.`);
        currency=clean(row[columns.currency]).toUpperCase();
        const unit=clean(row[columns.unit]).toLowerCase();
        if(!FINANCIAL_CURRENCIES.includes(currency))throw Error(`${where}: select a supported currency.`);
        if(!FINANCIAL_UNITS.some(item=>item.toLowerCase()===unit))throw Error(`${where}: select Units, Thousand, Lakh, Million, Crore or Billion.`);
        amount=Number(text.replaceAll(',',''))*FUNDING_UNIT_MULTIPLIERS[unit];
        if(!Number.isFinite(amount)||Math.abs(amount)>Number.MAX_SAFE_INTEGER)throw Error(`${where}: funding amount is outside the supported range.`);
        amount=Math.round((amount+Number.EPSILON)*100)/100;
      }else if(present(row[columns.currency])){
        currency=clean(row[columns.currency]).toUpperCase();
        if(!FINANCIAL_CURRENCIES.includes(currency))throw Error(`${where}: select a supported currency.`);
      }
      const event=`${slug}|${round.toLowerCase()}|${date||''}`;
      if(events.has(event))throw Error(`${where}: the same round type and date is already entered in another block.`);
      events.add(event);
      const investors=[...new Set(clean(row[columns.investors]).split(/[,;\n]/).map(clean).filter(Boolean))];
      observations.push({companySlug:slug,slot,importKey:`funding:slot:${slot}`,round,date,amount,currency,investors});
    }
  }
  return observations;
}
