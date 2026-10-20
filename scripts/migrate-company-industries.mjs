// Classification-only migration: never imports biographies, SEO or financials.
import fs from "node:fs/promises";
import path from "node:path";
import {isDeepStrictEqual} from "node:util";
import XLSX from "xlsx";
import {createClient} from "@sanity/client";
import {INDUSTRY_TAXONOMY, validateIndustryPair} from "../lib/industry-taxonomy.mjs";

const args=process.argv.slice(2);
const filename=args.find(arg=>!arg.startsWith("--")) || "companies.xlsx";
const apply=args.includes("--apply");
const client=createClient({projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,dataset:process.env.NEXT_PUBLIC_SANITY_DATASET,token:process.env.SANITY_WRITE_TOKEN,apiVersion:"2026-08-23",useCdn:false,perspective:"raw"});
async function run(){
  const w=XLSX.readFile(path.resolve(filename));
  if(!w.Sheets.Companies) throw new Error("Missing Companies sheet.");
  const rows=XLSX.utils.sheet_to_json(w.Sheets.Companies,{defval:""}).filter(row=>row.company_slug||row.company_name);
  const mapping=new Map();
  for(const row of rows){
    if(mapping.has(row.company_slug)) throw new Error(`Duplicate company_slug: ${row.company_slug}`);
    mapping.set(row.company_slug,validateIndustryPair(row.industry,row.sub_industry,`Companies row ${row.__rowNum__+1}`));
  }
  const [companies,industries]=await Promise.all([
    client.fetch('*[_type=="company" && !(_id in path("versions.**"))]{...}'),
    client.fetch('*[_type=="industry" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && slug.current in $slugs]{...}',{slugs:INDUSTRY_TAXONOMY.map(c=>c.slug)}),
  ]);
  const ids=new Map();
  for(const category of INDUSTRY_TAXONOMY){
    const matches=industries.filter(doc=>doc.slug?.current===category.slug);
    if(matches.length>1) throw new Error(`Duplicate industry slug ${category.slug}; resolve before migration.`);
    if(matches.length) ids.set(category.slug,matches[0]._id);
  }
  for(const company of companies){
    if(!mapping.has(company.slug?.current)) throw new Error(`Company ${company.slug?.current || company._id} is not classified in the sheet. Nothing written.`);
    const bases=new Set(companies.filter(c=>c.slug?.current===company.slug?.current).map(c=>c._id.replace(/^drafts\./,"")));
    if(bases.size>1) throw new Error(`Multiple company identities share slug ${company.slug.current}. Nothing written.`);
  }
  const needsCompany=company=>{const target=mapping.get(company.slug.current);return company.industryCategory?._ref!==ids.get(target.industrySlug)||company.subIndustry!==target.subIndustry;};
  const needsNames=industries.filter(doc=>doc.name!==INDUSTRY_TAXONOMY.find(c=>c.slug===doc.slug.current).name);
  console.log(JSON.stringify({mode:apply?"apply":"dry-run",sheetCompanies:mapping.size,publishedCompanies:companies.filter(c=>!c._id.startsWith("drafts.")).length,drafts:companies.filter(c=>c._id.startsWith("drafts.")).length,companyDocumentsChanging:companies.filter(needsCompany).length,industriesToCreate:INDUSTRY_TAXONOMY.filter(c=>!ids.has(c.slug)).map(c=>c.name),industryNamesToStandardize:needsNames.map(c=>c.name)},null,2));
  if(!apply) return;
  const dir=path.resolve("outputs",`industry-migration-${new Date().toISOString().replace(/[:.]/g,"-")}`);
  await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,"before.json"),JSON.stringify({companies,industries},null,2),{flag:"wx"});
  console.log(`Backup: ${path.join(dir,"before.json")}`);
  for(const category of INDUSTRY_TAXONOMY){
    if(!ids.has(category.slug)){
      const doc=await client.create({_type:"industry",name:category.name,slug:{_type:"slug",current:category.slug},taxonomyVersion:1});
      ids.set(category.slug,doc._id);
      await fs.appendFile(path.join(dir,"applied.jsonl"),JSON.stringify({createdIndustry:doc._id})+"\n");
    }
  }
  for(const doc of needsNames){
    await client.patch(doc._id).ifRevisionId(doc._rev).set({name:INDUSTRY_TAXONOMY.find(c=>c.slug===doc.slug.current).name}).commit();
  }
  const groups=new Map();
  for(const company of companies.filter(needsCompany)){
    const key=company._id.replace(/^drafts\./,"");
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(company);
  }
  let completed=0;
  for(const docs of groups.values()){
    let tx=client.transaction();
    for(const doc of docs){const target=mapping.get(doc.slug.current);tx=tx.patch(doc._id,p=>p.ifRevisionId(doc._rev).set({industryCategory:{_type:"reference",_ref:ids.get(target.industrySlug)},subIndustry:target.subIndustry}));}
    await tx.commit();
    await fs.appendFile(path.join(dir,"applied.jsonl"),JSON.stringify({companies:docs.map(d=>d._id)})+"\n");
    completed++;
    if(completed%25===0||completed===groups.size) console.log(`Classified ${completed}/${groups.size} company identities.`);
  }
  const saved=await client.fetch('*[_type=="company" && _id in $ids]{...}',{ids:companies.map(c=>c._id)});
  const protectedFields=doc=>Object.fromEntries(Object.entries(doc).filter(([key])=>!["industryCategory","subIndustry","_rev","_updatedAt"].includes(key)));
  for(const before of companies){
    const after=saved.find(doc=>doc._id===before._id);
    if(!after||needsCompany(after)||!isDeepStrictEqual(protectedFields(before),protectedFields(after))) throw new Error(`Verification failed for ${before._id}; backup retained.`);
  }
  console.log(`Verified ${companies.length} company documents. Profile text, URLs, SEO, financials, relationships and draft/publication states were preserved.`);
}
run().catch(error=>{console.error(`Classification migration failed: ${error.message}`);process.exitCode=1;});
