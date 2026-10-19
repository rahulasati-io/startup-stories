// Reader/editor-facing dates are always Indian Standard Time, independent of
// the server location or the reader's browser timezone. Storage remains UTC.
export const DISPLAY_TIME_ZONE = "Asia/Kolkata";
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric", timeZone: DISPLAY_TIME_ZONE,
});
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric", hour: "numeric",
  minute: "2-digit", hour12: true, timeZone: DISPLAY_TIME_ZONE,
});
const yearFormatter = new Intl.DateTimeFormat("en", {year: "numeric", timeZone: DISPLAY_TIME_ZONE});

/** @param {Date | string | null | undefined} value */
function validDate(value) {
  if (!value) return null;
  // CMS timestamps must specify an offset. Never let an unzoned timestamp use
  // the machine's local timezone. Date-only calendar values remain supported.
  if (typeof value === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(value) && !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** @param {Date | string | null | undefined} value */
export function formatIstDate(value) {
  const date = validDate(value);
  return date ? dateFormatter.format(date) : "";
}

/** @param {Date | string | null | undefined} value */
export function formatIstDateTime(value) {
  const date = validDate(value);
  return date ? `${dateTimeFormatter.format(date)} IST` : "";
}

/** @param {Date | string} [value] */
export function istCalendarYear(value = new Date()) {
  const date = validDate(value);
  return date ? yearFormatter.format(date) : "";
}
