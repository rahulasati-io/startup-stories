// Link-only backfill. Never imports spreadsheet wording or publishes drafts.
import path from "node:path";
import fs from "node:fs/promises";
import {isDeepStrictEqual} from "node:util";
import XLSX from "xlsx";
import {createClient} from "@sanity/client";
import {buildLinkTargets, interlinkArticle, LINK_TARGETS_QUERY} from "./lib/article-interlinks.mjs";

const args=process.argv.slice(2);
const filename=args.find(arg=>!arg.startsWith("--"));
const write=args.includes("--write");
if(!filename) throw new Error('Usage: node --env-file=.env.local scripts/interlink-workbook-articles.mjs "workbook.xlsx" [--write]');
const client=createClient({projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,dataset:process.env.NEXT_PUBLIC_SANITY_DATASET,token:process.env.SANITY_WRITE_TOKEN,apiVersion:"2026-08-23",useCdn:false,perspective:"raw"});

async function run(){
  const workbook=XLSX.readFile(path.resolve(filename));
  if(!workbook.Sheets.Articles) throw new Error('Missing Articles sheet.');
  const rows=XLSX.utils.sheet_to_json(workbook.Sheets.Articles,{defval:""}).filter(row=>row.article_slug||row.title);
  const slugs=rows.map(row=>String(row.article_slug).trim()).filter(Boolean);
  const importIds=rows.map(row=>String(row.import_id).trim()).filter(Boolean);
  const [targets,documents]=await Promise.all([
    client.fetch(LINK_TARGETS_QUERY),
    client.fetch(`*[_type=="post" && !(_id in path("versions.**")) && (slug.current in $slugs || importId in $importIds)]{_id,_rev,importId,title,"slug":slug.current,"companySlugs":company[]->slug.current,body}`,{slugs,importIds}),
  ]);
  const catalog=buildLinkTargets(targets);
  for(const row of rows){
    const matches=documents.filter(doc=>(row.import_id&&doc.importId===String(row.import_id).trim())||doc.slug===String(row.article_slug).trim());
    if(!matches.length) throw new Error(`Article not found: ${row.article_slug}. Nothing written.`);
    if(new Set(matches.map(doc=>doc._id.replace(/^drafts\./,""))).size>1) throw new Error(`Conflicting article identity: ${row.article_slug}. Nothing written.`);
  }
  const plans=documents.map(doc=>({doc,...interlinkArticle(doc.body,catalog,{companySlugs:doc.companySlugs || []})}));
  const wording=body=>(body || []).map(block=>({type:block._type,text:(block.children || []).map(child=>child.text || "").join(""),rows:block.rows}));
  for(const plan of plans) {
    if(!isDeepStrictEqual(wording(plan.doc.body),wording(plan.body))) throw new Error(`Wording changed unexpectedly: ${plan.doc.slug}. Nothing written.`);
    if(plan.added.length && plan.existingInternalLinks+plan.added.length>3) throw new Error(`Link limit exceeded: ${plan.doc.slug}. Nothing written.`);
  }
  const changed=plans.filter(plan=>plan.added.length);
  const report={workbook:path.resolve(filename),write,matchedArticles:new Set(documents.map(doc=>doc._id.replace(/^drafts\./,""))).size,publishedChanged:changed.filter(p=>!p.doc._id.startsWith("drafts.")).length,draftsChanged:changed.filter(p=>p.doc._id.startsWith("drafts.")).length,linksAdded:changed.reduce((sum,p)=>sum+p.added.length,0),ambiguousNamesSkipped:catalog.ambiguous,alreadyOverLimit:plans.filter(p=>p.existingInternalLinks>3).map(p=>p.doc.slug),articles:changed.map(p=>({id:p.doc._id,slug:p.doc.slug,existingInternalLinks:p.existingInternalLinks,added:p.added}))};
  console.log(JSON.stringify(report,null,2));
  if(!write||!changed.length) return;
  const directory=path.resolve("outputs",`article-interlinks-${new Date().toISOString().replace(/[:.]/g,"-")}`);
  await fs.mkdir(directory,{recursive:true});
  const backup=path.join(directory,"before.json");
  await fs.writeFile(backup,JSON.stringify({createdAt:new Date().toISOString(),documents:changed.map(p=>p.doc)},null,2),{flag:"wx"});
  await fs.writeFile(path.join(directory,"plan.json"),JSON.stringify(report,null,2),{flag:"wx"});
  console.log(`Body backup: ${backup}`);
  // One atomic transaction per article pair, guarded against concurrent editing.
  const bases=[...new Set(changed.map(p=>p.doc._id.replace(/^drafts\./,"")))];
  for(const base of bases){
    const group=changed.filter(p=>p.doc._id.replace(/^drafts\./,"")===base);
    let transaction=client.transaction();
    for(const plan of group) transaction=transaction.patch(plan.doc._id,patch=>patch.ifRevisionId(plan.doc._rev).set({body:plan.body}));
    await transaction.commit();
    await fs.appendFile(path.join(directory,"applied.jsonl"),JSON.stringify({ids:group.map(p=>p.doc._id)})+"\n");
  }
  const actual=await client.fetch(`*[_id in $ids]{_id,body}`,{ids:changed.map(p=>p.doc._id)});
  for(const plan of changed){
    const saved=actual.find(doc=>doc._id===plan.doc._id);
    if(!saved||!isDeepStrictEqual(saved.body,plan.body)) throw new Error(`Post-write verification failed: ${plan.doc._id}. Backup retained.`);
  }
  console.log(`Verified ${changed.length} document bodies. Wording, dates, metadata and draft/published status were not imported or changed. Workbook untouched; future article imports apply the same rule automatically.`);
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
