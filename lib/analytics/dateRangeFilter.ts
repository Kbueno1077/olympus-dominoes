/** Inclusive calendar-day range using local YYYY-MM-DD strings. */

export type DateRange = {
  startDate: string | null;
  endDate: string | null;
};

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

export function emptyDateRange(): DateRange {
  return { startDate: null, endDate: null };
}

export function isDateRangeActive(range: DateRange | null | undefined): boolean {
  if (!range) return false;
  return Boolean(range.startDate || range.endDate);
}

/** Valid calendar YYYY-MM-DD, or null. */
export function parseYmd(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const match = YMD.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const local = new Date(year, month - 1, day);
  if (
    local.getFullYear() !== year ||
    local.getMonth() !== month - 1 ||
    local.getDate() !== day
  ) {
    return null;
  }
  return trimmed;
}

/** Local calendar day of a match timestamp, or null if unparseable. */
export function endedAtToLocalYmd(endedAt: string): string | null {
  if (!endedAt) return null;
  const time = new Date(endedAt).getTime();
  if (!Number.isFinite(time)) return null;
  const local = new Date(time);
  return localDateToYmd(local);
}

/** Local Date from a YYYY-MM-DD calendar day. */
export function ymdToLocalDate(ymd: string): Date | null {
  const parsed = parseYmd(ymd);
  if (!parsed) return null;
  const year = Number(parsed.slice(0, 4));
  const month = Number(parsed.slice(5, 7));
  const day = Number(parsed.slice(8, 10));
  return new Date(year, month - 1, day);
}

export function localDateToYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatYmd(language: string, ymd: string): string {
  const date = ymdToLocalDate(ymd);
  if (!date) return ymd;
  const locale = language === "es" ? "es-ES" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return ymd;
  }
}

/**
 * True when `endedAt` falls on a local calendar day inside the inclusive range.
 * An inactive range matches everything, including missing dates.
 */
export function matchInDateRange(
  endedAt: string,
  range: DateRange | null | undefined
): boolean {
  if (!isDateRangeActive(range)) return true;
  const ymd = endedAtToLocalYmd(endedAt);
  if (!ymd) return false;
  const start = range?.startDate ?? null;
  const end = range?.endDate ?? null;
  if (start && ymd < start) return false;
  if (end && ymd > end) return false;
  return true;
}
