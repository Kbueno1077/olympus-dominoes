import { describe, expect, it } from "vitest";
import {
  LIVE_WATCH_GUEST_NAMES,
  pickGuestDisplayName,
  sanitizeLiveWatchDisplayName,
} from "./displayName";

describe("live watch display names", () => {
  it("trims and caps a typed name", () => {
    expect(sanitizeLiveWatchDisplayName("  Lolo  ")).toBe("Lolo");
    expect(sanitizeLiveWatchDisplayName("")).toBeNull();
    expect(sanitizeLiveWatchDisplayName("   ")).toBeNull();
    expect(sanitizeLiveWatchDisplayName("x".repeat(40))).toHaveLength(24);
  });

  it("picks the first unused guest nickname", () => {
    expect(pickGuestDisplayName([], 1)).toBe(LIVE_WATCH_GUEST_NAMES[0]);
    expect(pickGuestDisplayName([LIVE_WATCH_GUEST_NAMES[0]], 2)).toBe(
      LIVE_WATCH_GUEST_NAMES[1]
    );
  });

  it("falls back to nickname plus join order when the pool is taken", () => {
    const taken = LIVE_WATCH_GUEST_NAMES.map(String);
    expect(pickGuestDisplayName(taken, 21)).toBe("Clave 21");
  });
});
