export type ThumbnailPalette = {
  background: string;
  foreground: string;
  accent: string;
  panel: string;
};

// Sixty hand-picked palettes are retained in the library. Generated thumbnails
// use the first thirty light-background palettes so dark text stays easy to read.
export const BUSINESS_MODEL_PALETTES: readonly ThumbnailPalette[] = [
  { background: "#FFF7ED", foreground: "#431407", accent: "#EA580C", panel: "#FED7AA" },
  { background: "#FEF2F2", foreground: "#450A0A", accent: "#DC2626", panel: "#FECACA" },
  { background: "#FFF1F2", foreground: "#4C0519", accent: "#E11D48", panel: "#FECDD3" },
  { background: "#FDF2F8", foreground: "#500724", accent: "#DB2777", panel: "#FBCFE8" },
  { background: "#FAF5FF", foreground: "#3B0764", accent: "#9333EA", panel: "#E9D5FF" },
  { background: "#F5F3FF", foreground: "#2E1065", accent: "#7C3AED", panel: "#DDD6FE" },
  { background: "#EEF2FF", foreground: "#1E1B4B", accent: "#4F46E5", panel: "#C7D2FE" },
  { background: "#EFF6FF", foreground: "#172554", accent: "#2563EB", panel: "#BFDBFE" },
  { background: "#F0F9FF", foreground: "#082F49", accent: "#0284C7", panel: "#BAE6FD" },
  { background: "#ECFEFF", foreground: "#083344", accent: "#0891B2", panel: "#A5F3FC" },
  { background: "#F0FDFA", foreground: "#042F2E", accent: "#0D9488", panel: "#99F6E4" },
  { background: "#ECFDF5", foreground: "#022C22", accent: "#059669", panel: "#A7F3D0" },
  { background: "#F0FDF4", foreground: "#052E16", accent: "#16A34A", panel: "#BBF7D0" },
  { background: "#F7FEE7", foreground: "#1A2E05", accent: "#65A30D", panel: "#D9F99D" },
  { background: "#FEFCE8", foreground: "#422006", accent: "#CA8A04", panel: "#FEF08A" },
  { background: "#FFFBEB", foreground: "#451A03", accent: "#D97706", panel: "#FDE68A" },
  { background: "#FAFAF9", foreground: "#292524", accent: "#A16207", panel: "#E7E5E4" },
  { background: "#F8FAFC", foreground: "#0F172A", accent: "#475569", panel: "#CBD5E1" },
  { background: "#F5F5F4", foreground: "#1C1917", accent: "#78716C", panel: "#D6D3D1" },
  { background: "#FDF4FF", foreground: "#4A044E", accent: "#C026D3", panel: "#F5D0FE" },
  { background: "#FFF7F3", foreground: "#3F1D13", accent: "#C2410C", panel: "#FDBA9A" },
  { background: "#F3F8FF", foreground: "#102A43", accent: "#1D4ED8", panel: "#B8D4FF" },
  { background: "#F2FBF7", foreground: "#12372A", accent: "#15803D", panel: "#B7E4C7" },
  { background: "#FFF9E6", foreground: "#3D2B00", accent: "#B45309", panel: "#FFE08A" },
  { background: "#F9F5FF", foreground: "#2D1B4E", accent: "#6D28D9", panel: "#D8C4FF" },
  { background: "#FFF5F7", foreground: "#3B0A1E", accent: "#BE185D", panel: "#F8BBD0" },
  { background: "#F1FAF9", foreground: "#073B3A", accent: "#0F766E", panel: "#AFE3DF" },
  { background: "#F6FAED", foreground: "#26340A", accent: "#4D7C0F", panel: "#CAE89A" },
  { background: "#FFF6EC", foreground: "#44230A", accent: "#C2410C", panel: "#FFD0A8" },
  { background: "#F4F7FB", foreground: "#172033", accent: "#334EAC", panel: "#C9D8F4" },
  { background: "#431407", foreground: "#FFF7ED", accent: "#FB923C", panel: "#7C2D12" },
  { background: "#450A0A", foreground: "#FEF2F2", accent: "#F87171", panel: "#7F1D1D" },
  { background: "#4C0519", foreground: "#FFF1F2", accent: "#FB7185", panel: "#881337" },
  { background: "#500724", foreground: "#FDF2F8", accent: "#F472B6", panel: "#831843" },
  { background: "#3B0764", foreground: "#FAF5FF", accent: "#C084FC", panel: "#6B21A8" },
  { background: "#2E1065", foreground: "#F5F3FF", accent: "#A78BFA", panel: "#5B21B6" },
  { background: "#1E1B4B", foreground: "#EEF2FF", accent: "#818CF8", panel: "#3730A3" },
  { background: "#172554", foreground: "#EFF6FF", accent: "#60A5FA", panel: "#1E40AF" },
  { background: "#082F49", foreground: "#F0F9FF", accent: "#38BDF8", panel: "#075985" },
  { background: "#083344", foreground: "#ECFEFF", accent: "#22D3EE", panel: "#155E75" },
  { background: "#042F2E", foreground: "#F0FDFA", accent: "#2DD4BF", panel: "#115E59" },
  { background: "#022C22", foreground: "#ECFDF5", accent: "#34D399", panel: "#065F46" },
  { background: "#052E16", foreground: "#F0FDF4", accent: "#4ADE80", panel: "#166534" },
  { background: "#1A2E05", foreground: "#F7FEE7", accent: "#A3E635", panel: "#3F6212" },
  { background: "#422006", foreground: "#FEFCE8", accent: "#FACC15", panel: "#854D0E" },
  { background: "#451A03", foreground: "#FFFBEB", accent: "#FBBF24", panel: "#92400E" },
  { background: "#1C1917", foreground: "#FAFAF9", accent: "#D6D3D1", panel: "#44403C" },
  { background: "#0F172A", foreground: "#F8FAFC", accent: "#94A3B8", panel: "#334155" },
  { background: "#18181B", foreground: "#FAFAFA", accent: "#A1A1AA", panel: "#3F3F46" },
  { background: "#4A044E", foreground: "#FDF4FF", accent: "#E879F9", panel: "#86198F" },
  { background: "#3F1D13", foreground: "#FFF7F3", accent: "#FB923C", panel: "#7C2D12" },
  { background: "#102A43", foreground: "#F3F8FF", accent: "#7DB3FF", panel: "#243B53" },
  { background: "#12372A", foreground: "#F2FBF7", accent: "#6EE7A0", panel: "#235347" },
  { background: "#3D2B00", foreground: "#FFF9E6", accent: "#FFD166", panel: "#6B4F00" },
  { background: "#2D1B4E", foreground: "#F9F5FF", accent: "#B794F4", panel: "#503B73" },
  { background: "#3B0A1E", foreground: "#FFF5F7", accent: "#F687B3", panel: "#702244" },
  { background: "#073B3A", foreground: "#F1FAF9", accent: "#5EEAD4", panel: "#0F5F5D" },
  { background: "#26340A", foreground: "#F6FAED", accent: "#BEF264", panel: "#4A5D23" },
  { background: "#44230A", foreground: "#FFF6EC", accent: "#FDBA74", panel: "#7C3F16" },
  { background: "#172033", foreground: "#F4F7FB", accent: "#93B4F5", panel: "#2D3B59" },
];

export function isBusinessModelCategory(category?: string | null) {
  const value = category?.trim().toLowerCase();
  return [
    "business-model",
    "business-models",
    "how-companies-make-money",
    "how-it-makes-money",
  ].includes(value || "");
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const BUSINESS_MODEL_PATTERN_COUNT = 21;
export const BUSINESS_MODEL_LIGHT_PALETTE_COUNT = 30;
export const BUSINESS_MODEL_THUMBNAIL_VERSION = "7";

export function getBusinessModelPattern(companyName: string, industry?: string | null) {
  const value = industry?.trim().toLowerCase() || "";
  const variant = (choices: readonly number[]) => choices[stableHash(companyName.trim().toLowerCase()) % choices.length];
  if (/market|commerce|delivery|hailing|services|travel/.test(value)) return variant([1, 6, 7, 8]);
  if (/subscription|software|saas|media|education|edtech/.test(value)) return variant([2, 9, 10]);
  if (/consumer|conglomerate|manufactur|luggage|eyewear|vehicle|energy|telecom/.test(value)) return variant([3, 11, 12, 13]);
  if (/fintech|financial|payment|bank|insurance|broker|investment|credit/.test(value)) return variant([4, 14, 15, 16]);
  if (/infrastructure|technology|artificial intelligence|space|logistics/.test(value)) return variant([5, 17, 18]);
  if (/advertis|consult|enterprise|health|pharma/.test(value)) return variant([0, 19, 20]);
  return stableHash(`pattern:${companyName.trim().toLowerCase()}`) % BUSINESS_MODEL_PATTERN_COUNT;
}

export function getBusinessModelPalette(companyName: string) {
  return BUSINESS_MODEL_PALETTES[
    stableHash(companyName.trim().toLowerCase()) % BUSINESS_MODEL_LIGHT_PALETTE_COUNT
  ];
}

export function getBusinessModelThumbnailPath(
  categorySlug?: string | null,
  articleSlug?: string | null,
  contentVersion?: string | null,
) {
  if (!articleSlug || !isBusinessModelCategory(categorySlug)) return null;
  const params = new URLSearchParams({ v: BUSINESS_MODEL_THUMBNAIL_VERSION });
  if (contentVersion) params.set("content", contentVersion);
  return `/api/article-thumbnail/${encodeURIComponent(categorySlug!)}/${encodeURIComponent(articleSlug)}?${params.toString()}`;
}
