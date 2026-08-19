import type { HistoryFilter } from "./historyFilters";

/**
 * Ready with 2+ players. A/B pin partners; Any means either team.
 * Both letters are required only when nobody is Any.
 */
export function matchupAlignmentReady(
  playerIds: number[],
  teams: Record<number, 1 | 2 | null>
): boolean {
  if (playerIds.length < 2) return false;
  let hasA = false;
  let hasB = false;
  let hasAny = false;
  for (const id of playerIds) {
    const team = teams[id];
    if (team === 1) hasA = true;
    else if (team === 2) hasB = true;
    else hasAny = true;
  }
  if (hasAny) return true;
  return hasA && hasB;
}

export function matchupFilterFromTeams(
  playerIds: number[],
  teams: Record<number, 1 | 2 | null>
): HistoryFilter {
  return {
    players: playerIds.map((playerId) => ({
      playerId,
      team: teams[playerId] ?? null,
    })),
  };
}
