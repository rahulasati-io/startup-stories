import {createClient} from '@sanity/client';
import {mkdir,writeFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {DEFAULT_ARTICLE_AUTHOR_QUERY} from '../lib/article-author.mjs';

const apply=process.argv.includes('--apply');
const client=createClient({projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,dataset:process.env.NEXT_PUBLIC_SANITY_DATASET,token:process.env.SANITY_WRITE_TOKEN,apiVersion:'2026-08-23',useCdn:false,perspective:'raw'});
const author=await client.fetch(DEFAULT_ARTICLE_AUTHOR_QUERY);
if(!author?._id)throw Error('Published Rahul Asati author profile not found. No changes made.');
const broken=`drafts.${author._id}`;
const before=await client.fetch('*[_type=="post" && author._ref==$broken && !(_id in path("versions.**"))]',{broken});
console.log(JSON.stringify({mode:apply?'apply':'dry-run',author:author.name,authorSlug:author.slug,published:before.filter(d=>!d._id.startsWith('drafts.')).length,drafts:before.filter(d=>d._id.startsWith('drafts.')).length}));
if(!apply||!before.length)process.exit(0);
const folder=`outputs/article-author-repair-${new Date().toISOString().replace(/[:.]/g,'-')}`;
await mkdir(folder,{recursive:true});
await writeFile(`${folder}/before.json`,JSON.stringify(before,null,2));
let transaction=client.transaction();
for(const document of before)transaction=transaction.patch(document._id,patch=>patch.ifRevisionId(document._rev).set({'author._ref':author._id}));
await transaction.commit();
const after=await client.fetch('*[_id in $ids]',{ids:before.map(d=>d._id)});
const comparable=doc=>Object.fromEntries(Object.entries(doc).filter(([key])=>!['_rev','_updatedAt','author'].includes(key)));
for(const original of before){
  const updated=after.find(d=>d._id===original._id);
  if(!updated||!isDeepStrictEqual(comparable(original),comparable(updated))||!isDeepStrictEqual(updated.author,{...original.author,_ref:author._id}))throw Error(`Verification failed for ${original._id}. Backup: ${folder}`);
}
await writeFile(`${folder}/after.json`,JSON.stringify(after,null,2));
console.log(`Verified ${after.length} author-reference repairs. No drafts published or deleted; article text, dates, slugs and other fields unchanged. Backup: ${folder}`);
