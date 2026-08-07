import type { PodiumCategoryId } from "./podium";
import { PODIUM_CATEGORY_IDS } from "./podium";

export const PODIUM_PUNCHLINE_COUNT = 5;
export const PODIUM_PUNCHLINE_TTL_MS = 24 * 60 * 60 * 1000;

export type PodiumPunchlineSlot = {
  index: number;
  /** Epoch ms when this index was locked in. */
  lockedAt: number;
};

export type PodiumPunchlineMap = Partial<
  Record<PodiumCategoryId, PodiumPunchlineSlot>
>;

/** Translation key stem before the variant index — e.g. podiumJoseSubtitle0. */
const SUBTITLE_STEM: Record<PodiumCategoryId, string> = {
  jose: "podiumJoseSubtitle",
  datas: "podiumDatasSubtitle",
  points: "podiumPointsSubtitle",
  pph: "podiumPphSubtitle",
  pollos: "podiumPollosSubtitle",
  polloRate: "podiumPolloRateSubtitle",
  zapatos: "podiumZapatosSubtitle",
  zapatoRate: "podiumZapatoRateSubtitle",
  games: "podiumGamesSubtitle",
  hands: "podiumHandsSubtitle",
  bestLoser: "podiumBestLoserSubtitle",
  keepsComing: "podiumKeepsComingSubtitle",
  pollosEaten: "podiumPollosEatenSubtitle",
  zapatosEaten: "podiumZapatosEatenSubtitle",
};

export function podiumPunchlineKey(
  id: PodiumCategoryId,
  index: number
): string {
  const clamped = ((index % PODIUM_PUNCHLINE_COUNT) + PODIUM_PUNCHLINE_COUNT) %
    PODIUM_PUNCHLINE_COUNT;
  return `${SUBTITLE_STEM[id]}${clamped}`;
}

function clampIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  const n = Math.trunc(index);
  return ((n % PODIUM_PUNCHLINE_COUNT) + PODIUM_PUNCHLINE_COUNT) %
    PODIUM_PUNCHLINE_COUNT;
}

function pickIndex(
  previous: number | undefined,
  random: () => number
): number {
  if (previous == null || PODIUM_PUNCHLINE_COUNT <= 1) {
    return clampIndex(Math.floor(random() * PODIUM_PUNCHLINE_COUNT));
  }
  // Avoid immediate repeat when rotating after TTL.
  const next = clampIndex(Math.floor(random() * (PODIUM_PUNCHLINE_COUNT - 1)));
  return next >= previous ? next + 1 : next;
}

/**
 * Sticky punchline: same index until TTL elapses from first lock.
 * After expiry, picks a new index (preferring a different one) and re-locks.
 */
export function resolvePunchlineSlot(
  stored: PodiumPunchlineSlot | undefined,
  nowMs: number,
  random: () => number = Math.random
): { slot: PodiumPunchlineSlot; changed: boolean } {
  if (
    stored &&
    Number.isFinite(stored.lockedAt) &&
    nowMs - stored.lockedAt < PODIUM_PUNCHLINE_TTL_MS
  ) {
    return {
      slot: { index: clampIndex(stored.index), lockedAt: stored.lockedAt },
      changed: false,
    };
  }

  const index = pickIndex(stored?.index, random);
  return {
    slot: { index, lockedAt: nowMs },
    changed: true,
  };
}

/** Resolve every category for a podium open; returns next map + whether to persist. */
export function resolveAllPunchlineSlots(
  stored: PodiumPunchlineMap,
  nowMs: number,
  random: () => number = Math.random
): { map: PodiumPunchlineMap; changed: boolean } {
  const map: PodiumPunchlineMap = {};
  let changed = false;
  for (const id of PODIUM_CATEGORY_IDS) {
    const result = resolvePunchlineSlot(stored[id], nowMs, random);
    map[id] = result.slot;
    if (result.changed) changed = true;
  }
  return { map, changed };
}

export function parsePunchlineMap(raw: unknown): PodiumPunchlineMap {
  if (!raw || typeof raw !== "object") return {};
  const out: PodiumPunchlineMap = {};
  for (const id of PODIUM_CATEGORY_IDS) {
    const entry = (raw as Record<string, unknown>)[id];
    if (!entry || typeof entry !== "object") continue;
    const index = Number((entry as PodiumPunchlineSlot).index);
    const lockedAt = Number((entry as PodiumPunchlineSlot).lockedAt);
    if (!Number.isFinite(index) || !Number.isFinite(lockedAt)) continue;
    out[id] = { index: clampIndex(index), lockedAt };
  }
  return out;
}
