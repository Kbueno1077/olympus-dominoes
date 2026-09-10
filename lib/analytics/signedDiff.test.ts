import { describe, expect, it } from "vitest";
import {
  formatPerGameRatePct,
  formatSignedDiff,
  perGameRatePct,
  perHandAverage,
} from "./signedDiff";

describe("formatSignedDiff", () => {
  it("prefixes positives and leaves zero / negatives as-is", () => {
    expect(formatSignedDiff(3)).toBe("+3");
    expect(formatSignedDiff(0)).toBe("0");
    expect(formatSignedDiff(-2)).toBe("-2");
  });

  it("formats fractional nets", () => {
    expect(formatSignedDiff(1.25, 1)).toBe("+1.3");
    expect(formatSignedDiff(-0.04, 1)).toBe("0.0");
  });
});

describe("perHandAverage", () => {
  it("returns null when there are no hands", () => {
    expect(perHandAverage(100, 0)).toBeNull();
    expect(perHandAverage(100, 4)).toBe(25);
  });
});

describe("perGameRatePct", () => {
  it("returns a percent of games played", () => {
    expect(perGameRatePct(2, 8)).toBe(25);
    expect(perGameRatePct(1, 0)).toBeNull();
    expect(formatPerGameRatePct(1, 4)).toBe("25%");
    expect(formatPerGameRatePct(1, 0)).toBe("—");
  });
});
