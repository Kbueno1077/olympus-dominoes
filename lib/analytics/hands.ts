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
