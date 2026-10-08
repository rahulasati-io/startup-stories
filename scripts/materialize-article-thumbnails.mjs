import {createClient} from "@sanity/client";

const args = process.argv.slice(2);
const write = args.includes("--write");
const option = (name) => args.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
const articleFilter = option("article");
const baseUrl = (option("base-url") || "https://misterstory.in").replace(/\/$/, "");

const {
  NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
  NEXT_PUBLIC_SANITY_DATASET: dataset,
  SANITY_WRITE_TOKEN: token,
} = process.env;

if (!projectId || !dataset || (write && !token)) {
  throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, or SANITY_WRITE_TOKEN.");
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2026-08-23",
  useCdn: false,
  perspective: "raw",
});

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function withRetry(label, operation) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      console.warn(`${label} failed (attempt ${attempt}/4); retrying…`);
      await wait(attempt * 1000);
    }
  }
  throw lastError;
}

const articles = await client.fetch(/* groq */ `
  *[
    _type == "post" &&
    !(_id in path("drafts.**")) &&
    defined(slug.current) &&
    defined(category->slug.current) &&
    !defined(mainImage.asset) &&
    (!defined($article) || slug.current == $article)
  ] | order(publishedAt desc, _updatedAt desc) {
    _id,
    title,
    "slug": slug.current,
    "categorySlug": category->slug.current,
    "draftId": "drafts." + _id,
    "hasDraft": defined(*[_id == "drafts." + ^._id][0])
  }
`, {article: articleFilter || null});

if (!articles.length) {
  console.log("No generated thumbnails need to be saved. Every matching article already has a main image.");
  process.exit(0);
}

if (!write) {
  console.log(`Dry run: ${articles.length} article(s) would receive a permanent Sanity thumbnail.`);
  for (const article of articles.slice(0, 20)) console.log(`- ${article.slug}`);
  if (articles.length > 20) console.log(`- ...and ${articles.length - 20} more`);
  console.log("Run again with --write to upload and attach the images.");
  process.exit(0);
}

let completed = 0;
async function materialize(article) {
  const thumbnailUrl = `${baseUrl}/api/article-thumbnail/${encodeURIComponent(article.categorySlug)}/${encodeURIComponent(article.slug)}`;
  const response = await withRetry(`${article.slug}: render`, () => fetch(thumbnailUrl, {
    headers: {Accept: "image/*"},
    signal: AbortSignal.timeout(20_000),
  }));
  if (!response.ok) throw new Error(`${article.slug}: thumbnail returned HTTP ${response.status}.`);

  const contentType = response.headers.get("content-type")?.split(";")[0] || "image/png";
  if (!contentType.startsWith("image/")) throw new Error(`${article.slug}: thumbnail route did not return an image.`);

  const extension = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
  const bytes = Buffer.from(await response.arrayBuffer());
  const asset = await withRetry(`${article.slug}: upload`, () => client.assets.upload("image", bytes, {
    contentType,
    filename: `${article.slug}-1200x675.${extension}`,
  }));
  const mainImage = {
    _type: "image",
    asset: {_type: "reference", _ref: asset._id},
    alt: `${article.title} thumbnail`,
  };

  let transaction = client.transaction().patch(article._id, (patch) => patch.set({mainImage}));
  if (article.hasDraft) transaction = transaction.patch(article.draftId, (patch) => patch.set({mainImage}));
  await withRetry(`${article.slug}: attach`, () => transaction.commit());

  completed += 1;
  console.log(`${completed}/${articles.length} saved: ${article.slug} (${Math.max(1, Math.round(bytes.length / 1024))} KB)`);
}

const queue = [...articles];
const workerCount = Math.min(3, queue.length);
await Promise.all(Array.from({length: workerCount}, async () => {
  while (queue.length) {
    const article = queue.shift();
    if (article) await materialize(article);
  }
}));

console.log(`Complete: ${completed} generated thumbnail(s) are now permanent Sanity images.`);
