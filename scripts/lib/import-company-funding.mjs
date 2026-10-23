import {defineQuery} from 'groq';
import {randomUUID} from 'node:crypto';

const COMPANIES=defineQuery(`*[_type == "company" && slug.current in $slugs && !(_id in path("drafts.**"))]{_id,"slug":slug.current}`);
const ROUNDS=defineQuery(`*[_type == "fundingRound" && company._ref in $ids && !(_id in path("versions.**"))]{_id,_rev,company,fundingImportKey,round,date,amount,currency,investors}`);
const equal=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
const label=record=>`${record.companySlug}, round ${record.slot}`;

export function planFundingImports(inputs,companies,records){
  const companyIds=new Map();
  for(const company of companies){
    if(companyIds.has(company.slug))throw Error(`Multiple company records use slug "${company.slug}". Resolve them before importing funding.`);
    companyIds.set(company.slug,company._id);
  }
  const used=new Set();
  return inputs.map(input=>{
    const id=companyIds.get(input.companySlug);
    const related=records.filter(record=>record.company?._ref===id);
    const keyed=related.filter(record=>record.fundingImportKey===input.importKey);
    const exact=related.filter(record=>(record.round||'').trim().toLowerCase()===input.round.toLowerCase()&&equal(record.date,input.date));
    const drafts=related.filter(record=>record._id.startsWith('drafts.')&&(record.fundingImportKey===input.importKey||exact.some(item=>item._id===record._id)));
    if(drafts.length)throw Error(`Funding ${label(input)} has unpublished Sanity changes. Publish or resolve that draft before importing.`);
    const candidates=keyed.length?keyed:exact;
    if(candidates.length>1)throw Error(`Funding ${label(input)} matches multiple saved rounds. Resolve duplicates before importing.`);
    const existing=candidates[0];
    if(existing&&related.some(record=>record._id===`drafts.${existing._id}`))throw Error(`Funding ${label(input)} has unpublished Sanity changes. Resolve its draft first.`);
    if(existing?.amount!==undefined&&input.amount===undefined&&input.currency&&input.currency!==existing.currency)throw Error(`Funding ${label(input)}: enter the amount again when changing its currency. A blank amount cannot relabel saved money.`);
    if(existing?.fundingImportKey&&existing.fundingImportKey!==input.importKey)throw Error(`Funding ${label(input)} belongs to another saved round block. Keep existing block numbers unchanged.`);
    if(keyed.length&&exact.some(record=>record._id!==existing._id))throw Error(`Funding ${label(input)} would duplicate another saved round.`);
    if(existing&&used.has(existing._id))throw Error(`Funding ${label(input)} matches an already selected round.`);
    if(existing)used.add(existing._id);
    // Blank optional cells leave existing editorial information untouched. No deletion by omission.
    const data={round:input.round,fundingImportKey:input.importKey};
    for(const field of ['date','amount','currency'])if(input[field]!==undefined)data[field]=input[field];
    if(input.investors.length)data.investors=input.investors;
    if(!existing)data.verificationStatus='needsResearch';
    return {input,existing,data,changed:!existing||Object.entries(data).some(([field,value])=>!equal(existing[field],value))};
  });
}

export async function prepareFundingImports(client,inputs,{allowMissingCompanies=true}={}){
  if(!inputs.length)return [];
  const companies=await client.fetch(COMPANIES,{slugs:[...new Set(inputs.map(row=>row.companySlug))]},{perspective:'published'});
  if(!allowMissingCompanies)for(const input of inputs)if(!companies.some(company=>company.slug===input.companySlug))throw Error(`Company "${input.companySlug}" must be published before a funding-only import. Import the company first.`);
  const records=companies.length?await client.fetch(ROUNDS,{ids:companies.map(company=>company._id)},{perspective:'raw'}):[];
  return planFundingImports(inputs,companies,records);
}

export async function saveFundingImports(client,operations,{dryRun=false,companyIds}={}){
  const changed=operations.filter(row=>row.changed);
  if(dryRun){console.log(`Funding rounds: ${changed.length} would change; ${operations.length-changed.length} unchanged. Empty round blocks are ignored.`);return {changed:changed.length,skipped:operations.length-changed.length};}
  let written=0;
  const groups=new Map();
  for(const operation of operations){const slug=operation.input.companySlug;if(!groups.has(slug))groups.set(slug,[]);groups.get(slug).push(operation.input);}
  for(const [slug,inputs]of groups){
    const companyId=companyIds.get(slug);
    if(!companyId)throw Error(`Missing company ID for funding: ${slug}.`);
    // Re-check existing rounds immediately before writing and retain unrelated fields.
    const [records,company]=await Promise.all([
      client.fetch(ROUNDS,{ids:[companyId]},{perspective:'raw'}),
      client.fetch('*[_id == $id][0]{_id,_rev}',{id:companyId},{perspective:'raw'}),
    ]);
    if(!company?._rev)throw Error(`Company ${slug} changed or was removed. Retry the import.`);
    const fresh=planFundingImports(inputs,[{slug,_id:companyId}],records).filter(row=>row.changed);
    if(!fresh.length)continue;
    // Serialize first-time creates as well as updates; concurrent imports must retry.
    let transaction=client.transaction().patch(companyId,patch=>patch.ifRevisionId(company._rev).set({fundingWriteVersion:randomUUID()}));
    for(const operation of fresh){
      if(operation.existing)transaction=transaction.patch(operation.existing._id,patch=>patch.ifRevisionId(operation.existing._rev).set(operation.data));
      else transaction=transaction.create({_type:'fundingRound',company:{_type:'reference',_ref:companyId},...operation.data});
    }
    await transaction.commit();written+=fresh.length;
  }
  console.log(`Funding rounds: ${written} changed; ${operations.length-written} unchanged. Blank cells/blocks did not delete saved data.`);
  return {changed:written,skipped:operations.length-written};
}
