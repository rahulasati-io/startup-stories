import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@sanity/client";

const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset, SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !dataset || !token) throw new Error("Missing Sanity environment variables.");

const folderArgument = process.argv.find((argument) => argument.startsWith("--folder="));
const folderPath = path.resolve(folderArgument?.split("=")[1] || "company-logos");
const replaceExisting = process.argv.includes("--replace");
const dryRun = process.argv.includes("--dry-run");
const supportedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const maximumBytes = 15 * 1024 * 1024;
const client = createClient({ projectId, dataset, token, apiVersion: "2026-08-29", useCdn: false });

const entries = await readdir(folderPath, { withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => entry.name)
  .sort();

if (!files.length) {
  console.log(`No logo files found in ${folderPath}`);
  console.log("Add files such as safari.png, then run this command again.");
  process.exit(0);
}

const report = { uploaded: 0, replaced: 0, existing: 0, companyNotFound: 0, invalid: 0, failed: 0 };

for (const filename of files) {
  const extension = path.extname(filename).toLowerCase();
  const slug = path.basename(filename, extension);
  const fullPath = path.join(folderPath, filename);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    console.log(`INVALID   ${filename} — filename must be a lowercase company slug`);
    report.invalid += 1;
    continue;
  }

  const fileStats = await stat(fullPath);
  if (fileStats.size === 0 || fileStats.size > maximumBytes) {
    console.log(`INVALID   ${filename} — file must be between 1 byte and 15 MB`);
    report.invalid += 1;
    continue;
  }

  const company = await client.fetch(
    `*[_type == "company" && slug.current == $slug][0]{_id,name,"logoAssetId":logo.asset->_id}`,
    { slug },
  );

  if (!company?._id) {
    console.log(`NOT FOUND ${filename} — no company uses slug "${slug}"`);
    report.companyNotFound += 1;
    continue;
  }

  if (company.logoAssetId && !replaceExisting) {
    console.log(`SKIPPED   ${filename} — ${company.name} already has a logo`);
    report.existing += 1;
    continue;
  }

  if (dryRun) {
    console.log(`READY     ${filename} → ${company.name}`);
    continue;
  }

  try {
    const asset = await client.assets.upload("image", createReadStream(fullPath), { filename });
    await client.patch(company._id).set({
      logo: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: `${company.name} logo`,
      },
    }).commit();
    console.log(`${company.logoAssetId ? "REPLACED" : "UPLOADED"}  ${filename} → ${company.name}`);
    if (company.logoAssetId) report.replaced += 1;
    else report.uploaded += 1;
  } catch (error) {
    console.log(`FAILED    ${filename} — ${error.message}`);
    report.failed += 1;
  }
}

console.log("\nLogo import report");
console.log(`Uploaded: ${report.uploaded}`);
console.log(`Replaced: ${report.replaced}`);
console.log(`Already present: ${report.existing}`);
console.log(`Company not found: ${report.companyNotFound}`);
console.log(`Invalid files: ${report.invalid}`);
console.log(`Failed uploads: ${report.failed}`);

if (report.failed || report.invalid) process.exitCode = 1;
