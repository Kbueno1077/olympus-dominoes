import { teamsFromRoster } from "@/utils/teams";

export type HistorySeat = {
  seat: number;
  displayName: string;
  playerId: number | null;
  nameKey: string;
};

export type HistoryFilterTeam = 1 | 2 | null;

export type HistoryFilterPlayer = {
  playerId: number;
  /** null = must play, any team; 1/2 = must sit on that side (relative). */
  team: HistoryFilterTeam;
};

export type HistoryFilter = {
  players: HistoryFilterPlayer[];
};

export function historyFilterActive(filter: HistoryFilter): boolean {
  return filter.players.length > 0;
}

function teamNumberForPlayer(
  seats: HistorySeat[],
  playersAmount: number,
  modeLabel: string,
  playerId: number
): number | null {
  const seat = seats.find((s) => s.playerId === playerId);
  if (!seat) return null;

  const rosterNames = ["", "", "", ""] as [string, string, string, string];
  for (const s of seats) {
    if (s.seat >= 1 && s.seat <= 4) {
      rosterNames[s.seat - 1] = s.displayName;
    }
  }
  const teams = teamsFromRoster(playersAmount, modeLabel, rosterNames);
  for (const team of teams) {
    if (team.members.some((m: { number: number }) => m.number === seat.seat)) {
      return team.number;
    }
  }
  return null;
}

/**
 * Team 1 / Team 2 are relative sides: all T1 share a team, all T2 share the
 * other team. Unmarked players only need to appear in the match.
 */
export function matchPassesHistoryFilter(
  match: {
    playersAmount: number;
    modeLabel: string;
    seats: HistorySeat[];
  },
  filter: HistoryFilter
): boolean {
  if (!historyFilterActive(filter)) return true;
  if (!match.seats || !Array.isArray(match.seats)) return false;

  const seatedIds = new Set(
    match.seats
      .map((s) => s.playerId)
      .filter((id): id is number => typeof id === "number")
  );

  for (const entry of filter.players) {
    if (!seatedIds.has(entry.playerId)) return false;
  }

  const side1 = filter.players.filter((p) => p.team === 1);
  const side2 = filter.players.filter((p) => p.team === 2);

  const resolveTeams = (entries: HistoryFilterPlayer[]) =>
    entries.map((p) =>
      teamNumberForPlayer(
        match.seats,
        match.playersAmount,
        match.modeLabel,
        p.playerId
      )
    );

  if (side1.length > 0) {
    const teams = resolveTeams(side1);
    if (teams.some((t) => t == null)) return false;
    const first = teams[0];
    if (!teams.every((t) => t === first)) return false;
  }

  if (side2.length > 0) {
    const teams = resolveTeams(side2);
    if (teams.some((t) => t == null)) return false;
    const first = teams[0];
    if (!teams.every((t) => t === first)) return false;
  }

  if (side1.length > 0 && side2.length > 0) {
    const t1 = teamNumberForPlayer(
      match.seats,
      match.playersAmount,
      match.modeLabel,
      side1[0].playerId
    );
    const t2 = teamNumberForPlayer(
      match.seats,
      match.playersAmount,
      match.modeLabel,
      side2[0].playerId
    );
    if (t1 == null || t2 == null || t1 === t2) return false;
  }

  // Full lined-up matchup (every listed player has A/B): no extra linked seats.
  const allAssigned = filter.players.every(
    (p) => p.team === 1 || p.team === 2
  );
  if (allAssigned && filter.players.length === match.playersAmount) {
    const filterIds = new Set(filter.players.map((p) => p.playerId));
    if (seatedIds.size !== filterIds.size) return false;
    for (const id of Array.from(seatedIds)) {
      if (!filterIds.has(id)) return false;
    }
  }

  return true;
}
