import {
  activeTeamNumbers,
  teamNumberFrom,
} from "@/utils/matchSettings";
import { FREE_FOR_ALL, normalizeNameKey, teamsFromRoster, teamScoresFromGame } from "@/utils/teams";
import {
  matchInDateRange,
  type DateRange,
} from "./dateRangeFilter";
import { getMatchDetail, listMatches, type MatchDetail } from "./history";
import {
  historyFilterActive,
  matchPassesMatchupFilter,
  type HistoryFilter,
  type HistorySeat as FilterSeat,
} from "./historyFilters";
import type { MatchGame, NamedSeat } from "./matchStats";
import type { TileSet } from "./modeFormat";
import { isPlayerHidden } from "./playerVisibility";
import { normalizeImportedTileSet } from "./schemaVersion";
import type { OlympusExportData } from "./types";

export const STYLE_POINT_IDS = [
  "maxDataFor",
  "minDataFor",
  "maxDataAgainst",
  "minDataAgainst",
  "maxDatasToWin",
  "minDatasToWin",
  "maxDatasToLose",
  "minDatasToLose",
] as const;

export type StylePointId = (typeof STYLE_POINT_IDS)[number];

export const STYLE_POINT_LABEL_KEY: Record<StylePointId, string> = {
  maxDataFor: "statsStyleMaxDataFor",
  minDataFor: "statsStyleMinDataFor",
  maxDataAgainst: "statsStyleMaxDataAgainst",
  minDataAgainst: "statsStyleMinDataAgainst",
  maxDatasToWin: "statsStyleMaxDatasToWin",
  minDatasToWin: "statsStyleMinDatasToWin",
  maxDatasToLose: "statsStyleMaxDatasToLose",
  minDatasToLose: "statsStyleMinDatasToLose",
};

export type StylePoints = {
  playerId: number;
} & Record<StylePointId, number | null>;

export type StylePointsFilter = {
  modeLabel?: string;
  tileSet?: TileSet;
  dateRange?: DateRange | null;
  /** When set, only nights / games that pass this Compare matchup seating. */
  matchup?: HistoryFilter | null;
};

function emptyStyle(playerId: number): StylePoints {
  return {
    playerId,
    maxDataFor: null,
    minDataFor: null,
    maxDataAgainst: null,
    minDataAgainst: null,
    maxDatasToWin: null,
    minDatasToWin: null,
    maxDatasToLose: null,
    minDatasToLose: null,
  };
}

function bumpMax(current: number | null, value: number): number {
  return current == null ? value : Math.max(current, value);
}

function bumpMin(current: number | null, value: number): number {
  return current == null ? value : Math.min(current, value);
}

function bumpPlayer(
  acc: Map<number, StylePoints>,
  playerId: number
): StylePoints {
  let row = acc.get(playerId);
  if (!row) {
    row = emptyStyle(playerId);
    acc.set(playerId, row);
  }
  return row;
}

/**
 * Extrema from one seating + its games. Does not change Jose or stored stats.
 */
export function accumulateStylePoints(
  acc: Map<number, StylePoints>,
  input: {
    modeLabel: string;
    playersAmount: number;
    seats: NamedSeat[];
    games: { game: MatchGame; seats: NamedSeat[] }[];
  }
): void {
  const { modeLabel, playersAmount, games } = input;
  const isFreeForAll = modeLabel === FREE_FOR_ALL;
  const teamNumbers = activeTeamNumbers(playersAmount, isFreeForAll);

  for (const { game, seats } of games) {
    const rosterNames = ["", "", "", ""] as [string, string, string, string];
    for (const seat of seats) {
      if (seat.seat >= 1 && seat.seat <= 4) {
        rosterNames[seat.seat - 1] = seat.displayName;
      }
    }
    const teams = teamsFromRoster(playersAmount, modeLabel, rosterNames);
    const teamToPlayerIds = new Map<number, number[]>();
    for (const team of teams) {
      const ids: number[] = [];
      for (const member of team.members) {
        const seat = seats.find((s) => s.seat === member.number);
        if (seat?.playerId != null) ids.push(seat.playerId);
      }
      teamToPlayerIds.set(team.number, ids);
    }

    const scores = teamScoresFromGame(game, teamNumbers);
    const winningTeam = teamNumberFrom(game.winner);

    for (const team of teams) {
      const own = scores.find(
        (s: { teamNumber: number }) => s.teamNumber === team.number
      ) as { teamNumber: number; hands: number[]; handCount: number } | undefined;
      if (!own) continue;
      const playerIds = teamToPlayerIds.get(team.number) ?? [];
      if (playerIds.length === 0) continue;

      const againstHands: number[] = [];
      for (const other of scores) {
        if (other.teamNumber === team.number) continue;
        againstHands.push(...other.hands);
      }

      const won = winningTeam === team.number;
      const lost = winningTeam != null && !won;

      for (const playerId of playerIds) {
        const row = bumpPlayer(acc, playerId);
        for (const pts of own.hands) {
          row.maxDataFor = bumpMax(row.maxDataFor, pts);
          row.minDataFor = bumpMin(row.minDataFor, pts);
        }
        for (const pts of againstHands) {
          row.maxDataAgainst = bumpMax(row.maxDataAgainst, pts);
          row.minDataAgainst = bumpMin(row.minDataAgainst, pts);
        }
        if (won) {
          row.maxDatasToWin = bumpMax(row.maxDatasToWin, own.handCount);
          row.minDatasToWin = bumpMin(row.minDatasToWin, own.handCount);
        }
        if (lost) {
          row.maxDatasToLose = bumpMax(row.maxDatasToLose, own.handCount);
          row.minDatasToLose = bumpMin(row.minDatasToLose, own.handCount);
        }
      }
    }
  }
}

function toFilterSeats(
  seats: { seat: number; displayName: string; playerId: number | null }[]
): FilterSeat[] {
  return seats.map((seat) => ({
    seat: seat.seat,
    displayName: seat.displayName,
    playerId: seat.playerId,
    nameKey: normalizeNameKey(seat.displayName),
  }));
}

function mergeDetailInto(
  acc: Map<number, StylePoints>,
  detail: MatchDetail,
  games: MatchDetail["games"]
): void {
  if (games.length === 0) return;
  accumulateStylePoints(acc, {
    modeLabel: detail.modeLabel,
    playersAmount: detail.playersAmount,
    seats: detail.seats,
    games: games.map((game) => ({
      game,
      seats: detail.isClosed
        ? detail.seats
        : game.seats.length > 0
          ? game.seats
          : detail.seats,
    })),
  });
}

export function stylePointsFromDetail(detail: MatchDetail): Map<number, StylePoints> {
  const acc = new Map<number, StylePoints>();
  mergeDetailInto(acc, detail, detail.games);
  return acc;
}

export function stylePointsFromData(
  data: OlympusExportData,
  filter: StylePointsFilter = {}
): Map<number, StylePoints> {
  const acc = new Map<number, StylePoints>();
  const matchup = filter.matchup;
  const matchupOn = Boolean(matchup && historyFilterActive(matchup));
  for (const item of listMatches(data)) {
    if (filter.modeLabel && item.modeLabel !== filter.modeLabel) continue;
    if (filter.tileSet && item.tileSet !== filter.tileSet) continue;
    if (!matchInDateRange(item.endedAt, filter.dateRange)) continue;
    const detail = getMatchDetail(data, item.id);
    if (!detail) continue;
    if (!matchupOn || !matchup) {
      mergeDetailInto(acc, detail, detail.games);
      continue;
    }
    const seating = {
      playersAmount: detail.playersAmount,
      modeLabel: detail.modeLabel,
      seats: toFilterSeats(detail.seats),
    };
    if (detail.isClosed) {
      if (!matchPassesMatchupFilter(seating, matchup)) continue;
      mergeDetailInto(acc, detail, detail.games);
      continue;
    }
    const games = detail.games.filter((game) =>
      matchPassesMatchupFilter(
        {
          playersAmount: detail.playersAmount,
          modeLabel: detail.modeLabel,
          seats: toFilterSeats(
            game.seats.length > 0 ? game.seats : detail.seats
          ),
        },
        matchup
      )
    );
    mergeDetailInto(acc, detail, games);
  }
  return acc;
}

export type StylePodiumRow = StylePoints & {
  playerName: string;
  gamesPlayed: number;
};

export function styleRowsForPodium(
  data: OlympusExportData,
  modeLabel: string,
  tileSet: TileSet
): StylePodiumRow[] {
  const byId = stylePointsFromData(data, { modeLabel, tileSet });
  const playersById = new Map(data.players.map((p) => [p.id, p]));
  const gamesById = new Map<number, number>();
  for (const row of data.player_stats) {
    if (row.mode_label !== modeLabel) continue;
    if (row.tile_set && normalizeImportedTileSet(row.tile_set) !== tileSet) {
      continue;
    }
    gamesById.set(row.player_id, row.games_played);
  }

  const out: StylePodiumRow[] = [];
  for (const row of Array.from(byId.values())) {
    const player = playersById.get(row.playerId);
    if (isPlayerHidden(player)) continue;
    out.push({
      ...row,
      playerName: player?.name ?? `#${row.playerId}`,
      gamesPlayed: gamesById.get(row.playerId) ?? 1,
    });
  }
  return out;
}

export function formatStylePoint(id: StylePointId, value: number | null): string {
  if (value == null) return "—";
  return String(value);
}
