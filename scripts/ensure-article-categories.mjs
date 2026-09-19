import {createClient} from "@sanity/client";

const {
  NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
  NEXT_PUBLIC_SANITY_DATASET: dataset,
  SANITY_WRITE_TOKEN: token,
} = process.env;

if (!projectId || !dataset || !token) {
  throw new Error("Missing Sanity environment variables.");
}

const categories = [
  {
    title: "Business Model",
    slug: "business-model",
    description: "How companies earn revenue, serve customers and organize their operations.",
  },
  {
    title: "Strategy",
    slug: "strategy",
    description: "The competitive decisions, expansion choices and advantages that shape companies.",
  },
  {
    title: "Company Story",
    slug: "company-story",
    description: "Company histories, turning points, acquisitions and evolution over time.",
  },
  {
    title: "People & Leadership",
    slug: "people-leadership",
    description: "Founders, executives and the leadership decisions behind companies.",
  },
];

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2026-08-23",
  useCdn: false,
});

const slugs = categories.map(({slug}) => slug);
const existing = await client.fetch(
  `*[_type == "category" && slug.current in $slugs]{_id, title, description, "slug": slug.current}`,
  {slugs},
);
const existingBySlug = new Map(existing.map((category) => [category.slug, category]));
const missing = categories.filter(({slug}) => !existingBySlug.has(slug));

if (missing.length) {
  let transaction = client.transaction();
  for (const category of missing) {
    transaction = transaction.create({
      _type: "category",
      title: category.title,
      slug: {_type: "slug", current: category.slug},
      description: category.description,
    });
  }
  await transaction.commit();
}

console.log(`Created ${missing.length} article categor${missing.length === 1 ? "y" : "ies"}.`);
console.log(`Skipped ${categories.length - missing.length} existing categor${categories.length - missing.length === 1 ? "y" : "ies"}.`);
