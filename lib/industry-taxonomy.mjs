// Approved editorial taxonomy, shared by Excel, imports and Studio.
/** @type {Array<{slug: string, name: string, subIndustries: string[]}>} */
export const INDUSTRY_TAXONOMY = [
  ["financial-services", "Financial Services", ["Payments", "Stock Broking", "Wealth Management", "Insurance", "Insurance Distribution", "Lending", "Banking", "Banking Infrastructure", "Digital Financial Services"]],
  ["software-technology", "Software & Technology", ["Business Software", "Enterprise AI", "Developer Tools", "HR Software", "Cybersecurity", "Data Analytics", "Media Technology", "Quantum Computing"]],
  ["retail-e-commerce", "Retail & E-commerce", ["Online Marketplaces", "B2B Commerce", "Grocery Retail", "Quick Commerce", "Fashion Retail", "Beauty Retail", "Baby Products Retail", "General Retail", "Automotive Marketplaces"]],
  ["food-beverages", "Food & Beverages", ["Dairy Products", "Packaged Foods", "Beverages", "Fresh Food"]],
  ["restaurants-food-services", "Restaurants & Food Services", ["Food Delivery", "Cloud Kitchens", "Cafes", "Restaurants"]],
  ["automotive", "Automotive", ["Vehicle Manufacturing", "Electric Vehicles"]],
  ["mobility-services", "Mobility Services", ["Ride Hailing", "Shared Mobility", "Car Sharing"]],
  ["energy-utilities", "Energy & Utilities", ["Power Generation", "Renewable Energy", "Solar Energy", "Wind Energy", "Energy Storage", "EV Charging & Battery Services"]],
  ["healthcare", "Healthcare", ["Hospitals", "Healthcare Services", "Digital Healthcare", "Online Pharmacy", "Healthcare Platforms", "Dental & Aesthetic Care", "Fitness & Wellness", "Consumer Health"]],
  ["pharmaceuticals-biotechnology", "Pharmaceuticals & Biotechnology", ["Drug Discovery"]],
  ["education", "Education", ["School Learning & Test Preparation", "Higher Education & Upskilling", "Executive Education", "Study Abroad", "Education Software"]],
  ["logistics", "Logistics", ["Parcel & E-commerce Logistics", "Road Freight", "Logistics Software"]],
  ["agriculture", "Agriculture", ["Agricultural Services", "Agricultural Supply Chain"]],
  ["consumer-products", "Consumer Products", ["Apparel", "Eyewear", "Luggage", "Furniture & Home Products", "Consumer Electronics", "Personal Hygiene Products", "Fitness Products"]],
  ["beauty-personal-care", "Beauty & Personal Care", ["Beauty & Personal Care Products"]],
  ["home-personal-services", "Home & Personal Services", ["Home Services", "At-home Beauty Services"]],
  ["travel-hospitality", "Travel & Hospitality", ["Online Travel", "Hotels & Hospitality"]],
  ["industrial-manufacturing", "Industrial Manufacturing", ["Manufacturing Services", "Industrial Robotics", "Additive Manufacturing", "Electrical Equipment"]],
  ["electronics-semiconductors", "Electronics & Semiconductors", ["Electronics Manufacturing", "Semiconductor Engineering"]],
  ["aerospace-defence", "Aerospace & Defence", ["Aerospace & Defence Manufacturing", "Defence Electronics", "Explosives", "Rocket Launch Services", "Satellite Technology", "Space Infrastructure", "Drones"]],
  ["chemicals-materials", "Chemicals & Materials", ["Specialty Chemicals"]],
  ["mining-metals", "Mining & Metals", ["Metals & Mining"]],
  ["telecommunications", "Telecommunications", ["Telecom & Digital Connectivity"]],
  ["media-entertainment", "Media & Entertainment", ["Sports & Gaming", "Advertising Technology"]],
  ["diversified-groups", "Diversified Groups", ["Diversified Holdings", "Consumer Platforms", "Technology Investments"]],
].map(([slug, name, subIndustries]) => ({slug, name, subIndustries}));

const normalize = value => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
export function findIndustry(value) {
  return INDUSTRY_TAXONOMY.find(item => normalize(item.name) === normalize(value) || item.slug === normalize(value));
}
export function validateIndustryPair(industry, subIndustry, location = "Company") {
  const category = findIndustry(industry);
  if (!category) throw new Error(`${location}: unrecognised industry "${industry || ""}". Select an approved industry from Industry Categories.`);
  const sub = category.subIndustries.find(value => normalize(value) === normalize(subIndustry));
  if (!sub) throw new Error(`${location}: sub_industry "${subIndustry || ""}" is not valid for ${category.name}. Choose: ${category.subIndustries.join(", ")}.`);
  return {industry: category.name, industrySlug: category.slug, subIndustry: sub};
}
export function excelIndustryRangeName(name) {
  return `Industry_${name.replaceAll(" & ", "_").replaceAll(" ", "_").replaceAll("-", "_")}`;
}
