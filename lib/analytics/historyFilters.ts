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

type MatchSeating = {
  playersAmount: number;
  modeLabel: string;
  seats: HistorySeat[];
};

function seatedPlayerIds(seats: HistorySeat[]): Set<number> {
  return new Set(
    seats
      .map((s) => s.playerId)
      .filter((id): id is number => typeof id === "number")
  );
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

/** Relative A/B sides: A's share a team, B's share the other. */
function assignedSidesAlign(
  match: MatchSeating,
  players: HistoryFilterPlayer[]
): boolean {
  const side1 = players.filter((p) => p.team === 1);
  const side2 = players.filter((p) => p.team === 2);

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

  return true;
}

function exactAssignedLineup(
  seatedIds: Set<number>,
  filter: HistoryFilter,
  playersAmount: number
): boolean {
  const allAssigned = filter.players.every(
    (p) => p.team === 1 || p.team === 2
  );
  if (!allAssigned || filter.players.length !== playersAmount) return true;
  const filterIds = new Set(filter.players.map((p) => p.playerId));
  if (seatedIds.size !== filterIds.size) return false;
  for (const id of Array.from(seatedIds)) {
    if (!filterIds.has(id)) return false;
  }
  return true;
}

/**
 * Team 1 / Team 2 are relative sides: all T1 share a team, all T2 share the
 * other team. Unmarked players only need to appear in the match.
 */
export function matchPassesHistoryFilter(
  match: MatchSeating,
  filter: HistoryFilter
): boolean {
  if (!historyFilterActive(filter)) return true;
  if (!match.seats || !Array.isArray(match.seats)) return false;

  const seatedIds = seatedPlayerIds(match.seats);

  for (const entry of filter.players) {
    if (!seatedIds.has(entry.playerId)) return false;
  }

  if (!assignedSidesAlign(match, filter.players)) return false;

  return exactAssignedLineup(seatedIds, filter, match.playersAmount);
}

/**
 * Compare "This matchup": same letter = partners on that side. Any = we do
 * not care which team that person sat on. Extra people on Any can sit with
 * anyone else in the selected group — A/B only constrain those who actually
 * sat that game. When the pool fills a table, outsiders do not count.
 */
export function matchPassesMatchupFilter(
  match: MatchSeating,
  filter: HistoryFilter
): boolean {
  if (!historyFilterActive(filter)) return true;
  if (!match.seats || !Array.isArray(match.seats)) return false;

  const seatedIds = seatedPlayerIds(match.seats);
  const floaters = filter.players.filter((p) => p.team == null);
  const poolIds = new Set(filter.players.map((p) => p.playerId));

  if (filter.players.length >= match.playersAmount) {
    for (const seat of match.seats) {
      if (seat.seat < 1 || seat.seat > match.playersAmount) continue;
      if (seat.playerId == null || !poolIds.has(seat.playerId)) return false;
    }
    return assignedSidesAlign(
      match,
      filter.players.filter((p) => seatedIds.has(p.playerId))
    );
  }

  for (const entry of filter.players) {
    if (!seatedIds.has(entry.playerId)) return false;
  }
  if (!assignedSidesAlign(match, filter.players)) return false;
  if (floaters.length === 0) {
    return exactAssignedLineup(seatedIds, filter, match.playersAmount);
  }
  return true;
}
