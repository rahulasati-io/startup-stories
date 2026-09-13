import { createClient } from "@sanity/client";

const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset, SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !dataset || !token) throw new Error("Missing Sanity environment variables.");

const client = createClient({ projectId, dataset, token, apiVersion: "2026-08-29", useCdn: false });
const sourceUrl = "https://files.safaribags.com/pub/media/annual_reports/Annual_report_2024_2025.pdf";
const strategies = [
  {
    strategyType: "manufacturing",
    title: "Expand localized hard-luggage manufacturing",
    text: "Safari commissioned an integrated manufacturing plant in Jaipur for polypropylene and polycarbonate zippered hard luggage and continued scaling capacity at Halol. The investment supports the market shift from imported luggage toward locally manufactured hard luggage.",
    startYear: 2024,
  },
  {
    strategyType: "brand",
    title: "Build a stronger mid-premium brand portfolio",
    text: "Safari is expanding Urban Jungle beyond zippered hard luggage into backpacks and travel accessories, while Safari Select targets mid-premium consumers with a more semi-formal design approach.",
    startYear: 2024,
  },
  {
    strategyType: "distribution",
    title: "Grow exclusive retail in high-footfall markets",
    text: "The company is expanding exclusive retail stores at selected high-footfall locations. These stores are intended to strengthen brand experience and increase consumer traction for premium offerings such as Urban Jungle and Safari Select.",
    startYear: 2024,
  },
  {
    strategyType: "technology",
    title: "Consolidate and modernize the supply chain",
    text: "Safari invested in large integrated, technology-enabled warehousing facilities at its manufacturing locations while consolidating smaller warehouses to create a more efficient and future-ready supply chain.",
    startYear: 2024,
  },
];

const block = (text, key) => [{ _key: `block-${key}`, _type: "block", style: "normal", children: [{ _key: `span-${key}`, _type: "span", text, marks: [] }], markDefs: [] }];
const company = await client.fetch(`*[_type == "company" && slug.current == $slug][0]{_id}`, { slug: "safari" });
if (!company?._id) throw new Error("Safari company record was not found.");

for (const [index, strategy] of strategies.entries()) {
  const existing = await client.fetch(`*[_type == "companyStrategy" && company._ref == $companyId && title == $title][0]{_id}`, { companyId: company._id, title: strategy.title });
  const data = {
    _type: "companyStrategy",
    company: { _type: "reference", _ref: company._id },
    strategyType: strategy.strategyType,
    title: strategy.title,
    description: block(strategy.text, index),
    startYear: strategy.startYear,
    status: "current",
    sourceUrl,
    verificationStatus: "verified",
    internalNotes: "Verified against Safari Industries Annual Report 2024–25.",
  };
  if (existing?._id) await client.patch(existing._id).set(data).commit();
  else await client.create(data);
}

console.log(`Saved ${strategies.length} verified Safari strategies.`);
