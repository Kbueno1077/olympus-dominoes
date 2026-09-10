import { describe, expect, it } from "vitest";
import {
  parsePunchlineMap,
  podiumPunchlineKey,
  PODIUM_PUNCHLINE_COUNT,
  PODIUM_PUNCHLINE_TTL_MS,
  resolveAllPunchlineSlots,
  resolvePunchlineSlot,
} from "./podiumPunchlines";

describe("podiumPunchlineKey", () => {
  it("builds numbered subtitle keys", () => {
    expect(podiumPunchlineKey("jose", 0)).toBe("podiumJoseSubtitle0");
    expect(podiumPunchlineKey("polloRate", 3)).toBe("podiumPolloRateSubtitle3");
  });
});

describe("resolvePunchlineSlot", () => {
  it("locks a new index on first sight", () => {
    const { slot, changed } = resolvePunchlineSlot(undefined, 1_000, () => 0.4);
    expect(changed).toBe(true);
    expect(slot.lockedAt).toBe(1_000);
    expect(slot.index).toBeGreaterThanOrEqual(0);
    expect(slot.index).toBeLessThan(PODIUM_PUNCHLINE_COUNT);
  });

  it("keeps the same index within 24 hours", () => {
    const locked = { index: 2, lockedAt: 1_000 };
    const later = locked.lockedAt + PODIUM_PUNCHLINE_TTL_MS - 1;
    const { slot, changed } = resolvePunchlineSlot(locked, later, () => 0.9);
    expect(changed).toBe(false);
    expect(slot.index).toBe(2);
    expect(slot.lockedAt).toBe(1_000);
  });

  it("rotates after 24 hours and avoids repeating the prior index", () => {
    const locked = { index: 2, lockedAt: 1_000 };
    const later = locked.lockedAt + PODIUM_PUNCHLINE_TTL_MS;
    const { slot, changed } = resolvePunchlineSlot(locked, later, () => 0);
    expect(changed).toBe(true);
    expect(slot.index).not.toBe(2);
    expect(slot.lockedAt).toBe(later);
  });
});

describe("resolveAllPunchlineSlots", () => {
  it("persists change when any category rotates", () => {
    const first = resolveAllPunchlineSlots({}, 1_000, () => 0.2);
    expect(first.changed).toBe(true);
    const again = resolveAllPunchlineSlots(first.map, 1_500, () => 0.9);
    expect(again.changed).toBe(false);
    expect(again.map.jose?.index).toBe(first.map.jose?.index);
  });
});

describe("parsePunchlineMap", () => {
  it("ignores junk and clamps indices", () => {
    const map = parsePunchlineMap({
      jose: { index: 7, lockedAt: 99 },
      nope: { index: 1, lockedAt: 1 },
    });
    expect(map.jose).toEqual({ index: 2, lockedAt: 99 });
    expect(map.datas).toBeUndefined();
  });
});
