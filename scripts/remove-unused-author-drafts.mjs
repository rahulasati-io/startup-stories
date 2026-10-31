import {createClient} from '@sanity/client';
import {defineQuery} from 'groq';
import {mkdir, writeFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';

const targets = [
  ['drafts.E9Zo7j21o0Y5ktaSGtAac9', 'Aarav Mehta'],
  ['drafts.E9Zo7j21o0Y5ktaSGtAad4', 'Ananya Rao'],
  ['drafts.E9Zo7j21o0Y5ktaSGtAadz', 'Rohan Kapoor'],
  ['drafts.E9Zo7j21o0Y5ktaSGtAaeu', 'Meera Iyer'],
  ['drafts.E9Zo7j21o0Y5ktaSGtAafp', 'Kabir Malhotra'],
  ['drafts.E9Zo7j21o0Y5ktaSGtAagk', 'Nisha Verma'],
  ['drafts.E9Zo7j21o0Y5ktaSGtAahf', 'Arjun Nair'],
];
const client = createClient({projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset:process.env.NEXT_PUBLIC_SANITY_DATASET, token:process.env.SANITY_WRITE_TOKEN, apiVersion:'2026-08-23', useCdn:false, perspective:'raw'});
const ids = targets.map(([id]) => id);
const allIds = targets.flatMap(([id]) => [id, id.slice(7)]);
const before = await client.fetch(defineQuery('*[_type == "author"]'));
const drafts = before.filter(doc => ids.includes(doc._id));
if (drafts.length !== 7 || drafts.some(doc => targets.find(([id]) => id === doc._id)?.[1] !== doc.name)) throw Error('Target drafts changed. Nothing deleted.');
if (before.some(doc => allIds.includes(doc._id) && !ids.includes(doc._id))) throw Error('A target has a published profile. Nothing deleted.');
const protectedAuthors = before.filter(doc => !ids.includes(doc._id));
if (!protectedAuthors.some(doc => doc.name === 'Rahul Asati' && doc.slug?.current === 'rahul-asati' && !doc._id.startsWith('drafts.'))) throw Error('Published Rahul profile missing. Nothing deleted.');
const references = await client.fetch(defineQuery('*[references($ids)]{_id,_type}'), {ids:allIds});
if (references.length) throw Error(`Target references found: ${JSON.stringify(references)}. Nothing deleted.`);
const postsQuery = defineQuery('*[_type == "post"]{_id,_rev} | order(_id)');
const postsBefore = await client.fetch(postsQuery);
console.log(JSON.stringify({mode:process.argv.includes('--apply')?'apply':'dry-run',targets:drafts.map(doc=>doc.name),references:references.length,protectedAuthors:protectedAuthors.map(doc=>doc.name),articles:postsBefore.length}));
if (!process.argv.includes('--apply')) process.exit(0);
const folder = `outputs/unused-author-drafts-${new Date().toISOString().replace(/[:.]/g, '-')}`;
await mkdir(folder, {recursive:true});
await writeFile(`${folder}/before.json`, JSON.stringify({drafts,protectedAuthors,postsBefore}, null, 2));
let transaction = client.transaction();
for (const doc of drafts) {
  // Revision precondition is checked atomically before the explicit deletion.
  transaction = transaction.patch(doc._id, patch=>patch.ifRevisionId(doc._rev).set({name:doc.name})).delete(doc._id);
}
await transaction.commit();
const after = await client.fetch(defineQuery('*[_type == "author"]'));
const postsAfter = await client.fetch(postsQuery);
if (after.some(doc => ids.includes(doc._id))) throw Error(`Deletion verification failed. Backup: ${folder}`);
for (const doc of protectedAuthors) if (!isDeepStrictEqual(doc, after.find(item=>item._id===doc._id))) throw Error(`Protected author changed. Backup: ${folder}`);
if (!isDeepStrictEqual(postsBefore, postsAfter)) throw Error(`Article revisions changed during verification. Backup: ${folder}`);
await writeFile(`${folder}/verification.json`, JSON.stringify({deleted:drafts.map(doc=>({_id:doc._id,name:doc.name})),remainingAuthors:after.map(doc=>({_id:doc._id,name:doc.name})),protectedAuthorsUnchanged:true,allArticleRevisionsUnchanged:true},null,2));
console.log(`Deleted exactly seven unused author drafts. Rahul and all ${postsAfter.length} article revisions unchanged. Recoverable from local backup: ${folder}`);
