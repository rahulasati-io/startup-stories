// Run with: node --experimental-strip-types --env-file=.env.local scripts/initialize-homepage.mjs [--apply]
// Adds only missing controls to a draft. Never publishes or replaces editorial selections.
import {createClient} from '@sanity/client';
import {DEFAULT_HOME_SECTIONS, DEFAULT_HOME_TITLE, DEFAULT_HOME_DESCRIPTION} from '../lib/homepage-config.ts';

const client = createClient({projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, token: process.env.SANITY_WRITE_TOKEN, apiVersion: '2026-02-01', useCdn: false, perspective: 'raw'});
const defaults = {
  seoTitle: DEFAULT_HOME_TITLE,
  seoDescription: DEFAULT_HOME_DESCRIPTION,
  heroTitle: 'No BS Business Breakdown',
  heroDescription: 'Discover interesting companies, the decisions that shaped them, and the strategies behind their success.',
  showSearch: true,
  sections: DEFAULT_HOME_SECTIONS.map(section => ({...section, _type: 'homepageSection'})),
};
const docs = await client.fetch('*[_id in ["homepageSettings", "drafts.homepageSettings"]]');
const draft = docs.find(doc => doc._id === 'drafts.homepageSettings');
const published = docs.find(doc => doc._id === 'homepageSettings');
const source = draft || published;
const missing = Object.keys(defaults).filter(key => source?.[key] === undefined);
if (!missing.length) {
  console.log('Homepage controls already initialized. No changes.');
} else if (!process.argv.includes('--apply')) {
  console.log(`Would initialize ${missing.join(', ')} on a draft only. Add --apply to save. Published settings and story selections stay unchanged.`);
} else if (draft) {
  await client.patch(draft._id).ifRevisionId(draft._rev).setIfMissing(defaults).commit();
  console.log('Initialized missing homepage controls on the existing draft. Nothing published.');
} else {
  const {_id, _rev, _createdAt, _updatedAt, ...content} = source || {};
  void _id; void _rev; void _createdAt; void _updatedAt;
  await client.create({...defaults, ...content, _id: 'drafts.homepageSettings', _type: 'homepageSettings'});
  console.log('Prepared a homepage draft with the current layout and preserved story selections. Nothing published.');
}
