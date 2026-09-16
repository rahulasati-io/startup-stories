import {createClient} from "@sanity/client";
import {randomUUID} from "node:crypto";

const {
  NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
  NEXT_PUBLIC_SANITY_DATASET: dataset,
  SANITY_WRITE_TOKEN: token,
} = process.env;

if (!projectId || !dataset || !token) {
  throw new Error("Missing Sanity environment variables.");
}

const authors = [
  ["Aarav Mehta", "aarav-mehta"],
  ["Ananya Rao", "ananya-rao"],
  ["Rohan Kapoor", "rohan-kapoor"],
  ["Meera Iyer", "meera-iyer"],
  ["Kabir Malhotra", "kabir-malhotra"],
  ["Nisha Verma", "nisha-verma"],
  ["Arjun Nair", "arjun-nair"],
];

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2026-08-23",
  useCdn: false,
});

const slugs = authors.map(([, slug]) => slug);
const existing = await client.fetch(
  `*[_type == "author" && slug.current in $slugs]{"slug": slug.current}`,
  {slugs},
);
const existingSlugs = new Set(existing.map(({slug}) => slug));
const missing = authors.filter(([, slug]) => !existingSlugs.has(slug));

if (missing.length) {
  let transaction = client.transaction();

  for (const [name, slug] of missing) {
    transaction = transaction.create({
      _type: "author",
      name,
      slug: {_type: "slug", current: slug},
      bio: [
        {
          _type: "block",
          _key: randomUUID().replaceAll("-", "").slice(0, 12),
          style: "normal",
          markDefs: [],
          children: [
            {
              _type: "span",
              _key: randomUUID().replaceAll("-", "").slice(0, 12),
              text: "Author at MisterStory.",
              marks: [],
            },
          ],
        },
      ],
    });
  }

  await transaction.commit();
}

console.log(`Created ${missing.length} author(s).`);
console.log(`Skipped ${authors.length - missing.length} existing author(s).`);
