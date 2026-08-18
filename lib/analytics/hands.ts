/**
 * Trailing ≤0 entries are scorepad "pad" hands (hit target / display adjust),
 * not countable datas. Strip them before aggregating stats or matchup.
 */
export function stripTrailingPadHands(hands: readonly number[]): number[] {
  const next = [...hands];
  while (next.length > 0 && next[next.length - 1] <= 0) {
    next.pop();
  }
  return next;
}

/**
 * Per-game take order, parallel to `hands_json`. Empty / length mismatch
 * means the hands are unlabeled (legacy games).
 */
export function parseHandsTakenJson(
  raw: unknown,
  handCount: number
): number[] {
  if (handCount <= 0 || raw == null || raw === "") return [];
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed) || parsed.length !== handCount) return [];
  return parsed.map((n) => {
    const value = Number(n);
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
  });
}

/** Drop trailing pad hands and the matching take-order entries. */
export function stripTrailingPadHandsPair(
  hands: readonly number[],
  taken: readonly number[] | undefined
): { hands: number[]; taken: number[] } {
  const nextHands = stripTrailingPadHands(hands);
  if (!taken || taken.length === 0) {
    return { hands: nextHands, taken: [] };
  }
  if (taken.length === nextHands.length) {
    return { hands: nextHands, taken: [...taken] };
  }
  if (taken.length !== hands.length) {
    return { hands: nextHands, taken: [] };
  }
  const dropped = hands.length - nextHands.length;
  return {
    hands: nextHands,
    taken: taken.slice(0, taken.length - dropped),
  };
}
