import { describe, expect, it } from "vitest";
import { navTransitionTypes } from "./navTransition";

describe("navTransitionTypes", () => {
  it("treats a deeper path as forward and the parent as back", () => {
    expect(navTransitionTypes("/history", "/history/12")).toEqual([
      "nav-forward",
    ]);
    expect(navTransitionTypes("/history/12", "/history")).toEqual(["nav-back"]);
  });

  it("uses nav order between top-level sections", () => {
    expect(navTransitionTypes("/", "/match")).toEqual(["nav-forward"]);
    expect(navTransitionTypes("/tools", "/history")).toEqual(["nav-back"]);
    expect(navTransitionTypes("/leaderboard", "/stats")).toEqual([
      "nav-forward",
    ]);
  });

  it("ignores search params when ranking", () => {
    expect(navTransitionTypes("/stats", "/compare?players=1")).toEqual([
      "nav-forward",
    ]);
  });
});
