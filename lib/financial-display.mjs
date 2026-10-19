const amountFormatter = new Intl.NumberFormat("en-IN", {maximumFractionDigits: 1});
const units = new Set(["units", "thousand", "lakh", "million", "crore", "billion"]);

/** Display rounding only. Never use this string for calculations or saved inputs. */
export function formatFinancialAmount(value) {
  // Prevent negative zero after rounding a small loss.
  return amountFormatter.format(Math.abs(value) < 0.05 ? 0 : value);
}

/**
 * @param {{value?: string, label?: string, numericValue?: number, currency?: string, unit?: string}} metric
 */
export function formatFinancialMetric(metric) {
  const unit = metric.unit?.toLowerCase();
  if (typeof metric.numericValue === "number" && Number.isFinite(metric.numericValue) &&
      /^[A-Z]{3}$/.test(metric.currency || "") && units.has(unit)) {
    return `${metric.currency} ${formatFinancialAmount(metric.numericValue)}${unit === "units" ? "" : ` ${unit}`}`;
  }
  const value = metric.value || "";
  // Legacy financial values can be rounded only when they contain one clear
  // amount. Leave percentages, ranges, mixed prose and nonfinancial KPIs intact.
  if (!/\b(revenue|ebitda|profit|loss|valuation|turnover|income|funding|debt|assets|cash flow|net worth|capital)\b/i.test(metric.label || "")) return value;
  const match = value.match(/^(\s*(?:(?:INR|USD|EUR|GBP|AED|SGD|AUD|CAD|JPY|CNY|CHF|HKD|Rs\.?|₹|\$|€|£)\s*)?)([+-]?(?:\d+(?:\.\d+)?|\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d{1,2}(?:,\d{2})*,\d{3}(?:\.\d+)?))(\s*(?:crores?|lakhs?|millions?|billions?|thousands?|units)?\s*)$/i);
  if (!match) return value;
  const number = Number(match[2].replaceAll(",", ""));
  return Number.isFinite(number) ? `${match[1]}${formatFinancialAmount(number)}${match[3]}` : value;
}
