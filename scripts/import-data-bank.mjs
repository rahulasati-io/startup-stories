import fs from 'node:fs/promises';
import path from 'node:path';
import {normalizeDataBank} from '../lib/data-bank.mjs';
import XLSX from 'xlsx';

const file=process.argv.slice(2).find(arg=>!arg.startsWith('--'));
if(!file)throw new Error('Usage: node scripts/import-data-bank.mjs source.xlsx|source.json [--write]. Default is check-only.');
const raw=/\.xlsx$/i.test(file)?(()=>{const workbook=XLSX.readFile(file,{cellDates:false});return Object.fromEntries(Object.entries(workbook.Sheets).map(([name,sheet])=>[name,XLSX.utils.sheet_to_json(sheet,{header:1,raw:true,defval:null})]));})():JSON.parse(await fs.readFile(file,'utf8'));
const normalized=normalizeDataBank(raw);
for(const [name,rows] of Object.entries(normalized))console.log(`${name}: ${rows.length} observations`);
if(process.argv.includes('--write')){
  // Never updates publication approvals or edits the source workbook.
  const target=path.resolve('content/data-bank/observations.json');
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,JSON.stringify(normalized)+'\n');
  console.log('Local data snapshot updated. Publication review is unchanged.');
}else console.log('Check only: no files changed.');
