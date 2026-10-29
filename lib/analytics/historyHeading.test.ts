import { describe, expect, it } from "vitest";
import { formatMatchDate, resolveMatchHeading } from "./history";

describe("resolveMatchHeading", () => {
  const endedAt = "2026-10-28T22:00:00.000Z";

  it("keeps a custom title and still asks for the date", () => {
    expect(resolveMatchHeading("en", "Friday night", endedAt)).toEqual({
      heading: "Friday night",
      showDateSubtitle: true,
    });
  });

  it("shows a saved date title once when only spacing or hour padding differs", () => {
    const formatted = formatMatchDate("en", endedAt);
    const drifted = formatted
      .replace(/(^|[\s,])(\d):/, "$10$2:")
      .replace(/ (?=\S+$)/, "\u202f");

    const heading = resolveMatchHeading("en", drifted, endedAt);

    expect(heading.showDateSubtitle).toBe(false);
    expect(heading.heading).toBe(formatted);
    expect(heading.heading.includes("·")).toBe(false);
  });
});
