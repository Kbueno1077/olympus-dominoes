import { describe, expect, it } from "vitest";
import {
  endedAtToLocalYmd,
  emptyDateRange,
  isDateRangeActive,
  localDateToYmd,
  matchInDateRange,
  parseYmd,
  ymdToLocalDate,
} from "./dateRangeFilter";

describe("parseYmd", () => {
  it("accepts a real calendar day", () => {
    expect(parseYmd("2026-03-15")).toBe("2026-03-15");
  });

  it("rejects impossible dates and junk", () => {
    expect(parseYmd("2026-02-30")).toBeNull();
    expect(parseYmd("03-15-2026")).toBeNull();
    expect(parseYmd("")).toBeNull();
    expect(parseYmd(null)).toBeNull();
  });

  it("round-trips a local calendar day", () => {
    const date = ymdToLocalDate("2026-03-15");
    expect(date).toBeTruthy();
    expect(localDateToYmd(date as Date)).toBe("2026-03-15");
  });
});

describe("isDateRangeActive", () => {
  it("is inactive until a bound is set", () => {
    expect(isDateRangeActive(emptyDateRange())).toBe(false);
    expect(isDateRangeActive({ startDate: "2026-01-01", endDate: null })).toBe(
      true
    );
    expect(isDateRangeActive({ startDate: null, endDate: "2026-01-01" })).toBe(
      true
    );
  });
});

describe("matchInDateRange", () => {
  const noon = "2026-03-15T12:00:00.000Z";

  it("lets every match through when the range is empty", () => {
    expect(matchInDateRange(noon, emptyDateRange())).toBe(true);
    expect(matchInDateRange("", emptyDateRange())).toBe(true);
  });

  it("keeps a match on the inclusive start and end days", () => {
    const day = endedAtToLocalYmd(noon);
    expect(day).toBeTruthy();
    expect(
      matchInDateRange(noon, { startDate: day, endDate: day })
    ).toBe(true);
  });

  it("drops matches before start or after end", () => {
    const day = endedAtToLocalYmd(noon) as string;
    expect(
      matchInDateRange(noon, { startDate: "2099-01-01", endDate: null })
    ).toBe(false);
    expect(
      matchInDateRange(noon, { startDate: null, endDate: "2000-01-01" })
    ).toBe(false);
    expect(matchInDateRange(noon, { startDate: day, endDate: day })).toBe(true);
  });

  it("drops unparseable dates once a range is set", () => {
    expect(
      matchInDateRange("", { startDate: "2026-01-01", endDate: null })
    ).toBe(false);
    expect(
      matchInDateRange("not-a-date", { startDate: "2026-01-01", endDate: null })
    ).toBe(false);
  });
});
