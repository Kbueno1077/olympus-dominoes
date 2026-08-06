/** Format a net (favor − against): `+3`, `0`, `-2`. */
export function formatSignedDiff(diff: number, fractionDigits = 0): string {
  if (fractionDigits > 0) {
    const rounded = Number(diff.toFixed(fractionDigits));
    if (rounded > 0) return `+${rounded.toFixed(fractionDigits)}`;
    if (rounded < 0) return rounded.toFixed(fractionDigits);
    return (0).toFixed(fractionDigits);
  }
  if (diff > 0) return `+${diff}`;
  return String(diff);
}

export function signedDiffColor(diff: number): string | undefined {
  if (diff > 0) return "primary.main";
  if (diff < 0) return "error.main";
  return undefined;
}

export function perHandAverage(points: number, hands: number): number | null {
  if (hands <= 0) return null;
  return points / hands;
}

/** Count per game as a percentage of games played (e.g. pollos / G). */
export function perGameRatePct(
  count: number,
  gamesPlayed: number
): number | null {
  if (gamesPlayed <= 0) return null;
  return (count / gamesPlayed) * 100;
}

export function formatPerGameRatePct(
  count: number,
  gamesPlayed: number,
  fractionDigits = 0
): string {
  const pct = perGameRatePct(count, gamesPlayed);
  if (pct == null) return "—";
  return `${pct.toFixed(fractionDigits)}%`;
}
