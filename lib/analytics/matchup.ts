import type { HistoryFilter } from "./historyFilters";

/** True when every player is on Team A or B and both sides have someone. */
export function matchupAlignmentReady(
  playerIds: number[],
  teams: Record<number, 1 | 2 | null>
): boolean {
  if (playerIds.length < 2) return false;
  let hasA = false;
  let hasB = false;
  for (const id of playerIds) {
    const team = teams[id];
    if (team !== 1 && team !== 2) return false;
    if (team === 1) hasA = true;
    if (team === 2) hasB = true;
  }
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
