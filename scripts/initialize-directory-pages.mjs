// Draft-only initialization. Run with --experimental-strip-types --env-file=.env.local; add --apply to save.
import {createClient} from '@sanity/client';
import {DIRECTORY_PAGES, DIRECTORY_PAGE_DEFAULTS, DEFAULT_DIRECTORY_SECTIONS} from '../lib/directory-page-config.ts';

const client = createClient({projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset:process.env.NEXT_PUBLIC_SANITY_DATASET, token:process.env.SANITY_WRITE_TOKEN, apiVersion:'2026-02-01', useCdn:false, perspective:'raw'});
for (const kind of DIRECTORY_PAGES) {
  const id = `directoryPageSettings-${kind}`;
  const docs = await client.fetch('*[_id in $ids]', {ids:[id, `drafts.${id}`]});
  const draft = docs.find(doc => doc._id === `drafts.${id}`);
  const source = draft || docs.find(doc => doc._id === id);
  const defaults = {...DIRECTORY_PAGE_DEFAULTS[kind], sections:DEFAULT_DIRECTORY_SECTIONS.map(section => ({...section, _type:'directorySection'}))};
  const missing = Object.keys(defaults).filter(key => source?.[key] === undefined);
  if (!missing.length) { console.log(`${kind}: already initialized, no changes.`); continue; }
  if (!process.argv.includes('--apply')) {console.log(`${kind}: would initialize a draft only; published content unchanged.`); continue;}
  if (draft) await client.patch(draft._id).ifRevisionId(draft._rev).setIfMissing(defaults).commit();
  else {
    const {_id, _rev, _createdAt, _updatedAt, ...content} = source || {};
    void _id; void _rev; void _createdAt; void _updatedAt;
    await client.create({...defaults, ...content, _id:`drafts.${id}`, _type:'directoryPageSettings'});
  }
  console.log(`${kind}: draft controls prepared. Nothing published.`);
}
