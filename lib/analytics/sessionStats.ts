import { sessionSeatsFromDetail, type MatchDetail } from "./history";
import { computeJosesCoefficient } from "./joseCoefficient";
import {
  computeHistoryMatchStatsDelta,
  type H2HDelta,
  type PlayerStatDelta,
} from "./matchStats";
import type { PlayerStatsView } from "./types";
import { teamInitialLabelsByNumber, teamsFromRoster } from "@/utils/teams";

export type SessionPlayerRow = {
  key: string;
  playerId: number | null;
  name: string;
  seat: number;
  teamNumber: number;
  stats: PlayerStatsView | null;
};

export type SessionH2HRow = H2HDelta & {
  playerName: string;
  opponentName: string;
  opponentTeamNumber: number | null;
};

export type SessionTeamGroup = {
  teamNumber: number;
  label: string;
  players: SessionPlayerRow[];
};

export type SessionStats = {
  matchId: number;
  teams: SessionTeamGroup[];
  players: SessionPlayerRow[];
  h2h: SessionH2HRow[];
};

function playerKey(playerId: number | null, name: string): string {
  return playerId != null ? `id:${playerId}` : `name:${name.trim().toLowerCase()}`;
}

function emptySessionStats(matchId: number): SessionStats {
  return { matchId, teams: [], players: [], h2h: [] };
}

function teamNumberBySeat(
  playersAmount: number,
  modeLabel: string
): Map<number, number> {
  const map = new Map<number, number>();
  for (const team of teamsFromRoster(playersAmount, modeLabel, ["", "", "", ""])) {
    for (const member of team.members) {
      if (member?.number) map.set(member.number, team.number);
    }
  }
  return map;
}

export function playerStatsViewFromDelta(
  row: PlayerStatDelta
): PlayerStatsView {
  const view: PlayerStatsView = {
    playerId: row.playerId,
    modeLabel: row.modeLabel,
    gamesPlayed: row.gamesPlayed,
    gamesWon: row.gamesWon,
    gamesLost: row.gamesLost,
    pointsFor: row.pointsFor,
    pointsAgainst: row.pointsAgainst,
    handsFor: row.handsFor,
    handsAgainst: row.handsAgainst,
    handsWon: row.handsWon,
    handsLost: row.handsLost,
    handsPlayed: row.handsPlayed,
    pollosFor: row.pollosFor,
    pollosAgainst: row.pollosAgainst,
    zapatosFor: row.zapatosFor,
    zapatosAgainst: row.zapatosAgainst,
    josesCoefficient: null,
  };
  return {
    ...view,
    josesCoefficient: computeJosesCoefficient(view),
  };
}

/** Stats for one history match, only the people who sat that night. */
export function sessionStatsFromDetail(detail: MatchDetail): SessionStats {
  const seats = sessionSeatsFromDetail(detail);
  if (seats.length === 0) return emptySessionStats(detail.id);

  const delta = computeHistoryMatchStatsDelta({
    isClosed: detail.isClosed,
    modeLabel: detail.modeLabel,
    playersAmount: detail.playersAmount,
    matchSeats: detail.seats,
    games: detail.games.map((game) => ({ game, seats: game.seats })),
  });

  const statsById = new Map(
    delta.playerStats.map((row) => [row.playerId, row])
  );
  const seatTeam = teamNumberBySeat(detail.playersAmount, detail.modeLabel);
  const nameById = new Map<number, string>();
  const teamByPlayerId = new Map<number, number>();
  const players: SessionPlayerRow[] = [];

  for (const seat of seats) {
    const name = seat.displayName.trim() || `#${seat.playerId ?? "?"}`;
    const teamNumber = seatTeam.get(seat.seat) ?? 1;
    if (seat.playerId != null) {
      nameById.set(seat.playerId, name);
      teamByPlayerId.set(seat.playerId, teamNumber);
    }
    const raw =
      seat.playerId != null ? (statsById.get(seat.playerId) ?? null) : null;
    players.push({
      key: playerKey(seat.playerId, name),
      playerId: seat.playerId,
      name,
      seat: seat.seat,
      teamNumber,
      stats: raw ? playerStatsViewFromDelta(raw) : null,
    });
  }

  const seatedIds = new Set(
    players
      .map((row) => row.playerId)
      .filter((id): id is number => id != null)
  );

  const h2h: SessionH2HRow[] = delta.h2h
    .filter(
      (row) => seatedIds.has(row.playerId) && seatedIds.has(row.opponentId)
    )
    .map((row) => ({
      ...row,
      playerName: nameById.get(row.playerId) ?? `#${row.playerId}`,
      opponentName: nameById.get(row.opponentId) ?? `#${row.opponentId}`,
      opponentTeamNumber: teamByPlayerId.get(row.opponentId) ?? null,
    }));

  const byTeam = new Map<number, SessionPlayerRow[]>();
  for (const player of players) {
    const list = byTeam.get(player.teamNumber) ?? [];
    list.push(player);
    byTeam.set(player.teamNumber, list);
  }

  const seatNames = ["", "", "", ""];
  for (const player of players) {
    if (player.seat >= 1 && player.seat <= 4 && !seatNames[player.seat - 1]) {
      seatNames[player.seat - 1] = player.name;
    }
  }
  const labels = teamInitialLabelsByNumber(
    detail.playersAmount,
    detail.modeLabel,
    seatNames
  ) as Record<number, string>;

  const teams: SessionTeamGroup[] = Array.from(byTeam.keys())
    .sort((a, b) => a - b)
    .map((teamNumber) => ({
      teamNumber,
      label: labels[teamNumber] || `Team ${teamNumber}`,
      players: (byTeam.get(teamNumber) ?? [])
        .slice()
        .sort((a, b) => a.seat - b.seat),
    }));

  return { matchId: detail.id, teams, players, h2h };
}

export function h2hForPlayer(
  rows: readonly SessionH2HRow[],
  playerId: number | null
): SessionH2HRow[] {
  if (playerId == null) return [];
  return rows.filter((row) => row.playerId === playerId);
}
