import { normalizeNameKey } from "@/utils/teams";
import { computeJosesCoefficient } from "./joseCoefficient";
import { stripTrailingPadHands } from "./hands";
import {
  matchPassesHistoryFilter,
  type HistoryFilter,
  type HistorySeat,
} from "./historyFilters";
import {
  computeMatchStatsDelta,
  mergeStatsDeltas,
  type MatchGame,
  type NamedSeat,
  type PlayerStatDelta,
} from "./matchStats";
import type { OlympusExportData, PlayerStatsView } from "./types";

type HistoryScoreRow = {
  game_id: number;
  team_number: number;
  total_points: number;
  hands_json: string;
};

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = asNumber(value, Number.NaN);
  return Number.isFinite(n) ? n : null;
}

function asString(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function gameFromScores(
  scores: HistoryScoreRow[],
  winnerTeam: string | null
): MatchGame {
  const game: MatchGame = {
    t1Datas: [],
    t1TotalPoints: 0,
    t2Datas: [],
    t2TotalPoints: 0,
    t3Datas: [],
    t3TotalPoints: 0,
    t4Datas: [],
    t4TotalPoints: 0,
    winner: winnerTeam ?? "none",
  };

  for (const score of scores) {
    let hands: number[] = [];
    try {
      const parsed = JSON.parse(score.hands_json);
      hands = Array.isArray(parsed) ? parsed.map((n) => Number(n) || 0) : [];
    } catch {
      hands = [];
    }
    hands = stripTrailingPadHands(hands);

    switch (score.team_number) {
      case 1:
        game.t1Datas = hands;
        game.t1TotalPoints = score.total_points;
        break;
      case 2:
        game.t2Datas = hands;
        game.t2TotalPoints = score.total_points;
        break;
      case 3:
        game.t3Datas = hands;
        game.t3TotalPoints = score.total_points;
        break;
      case 4:
        game.t4Datas = hands;
        game.t4TotalPoints = score.total_points;
        break;
      default:
        break;
    }
  }

  return game;
}

function emptyStats(playerId: number, modeLabel: string): PlayerStatsView {
  return {
    playerId,
    modeLabel,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    handsFor: 0,
    handsAgainst: 0,
    handsWon: 0,
    handsLost: 0,
    pollosFor: 0,
    pollosAgainst: 0,
    zapatosFor: 0,
    zapatosAgainst: 0,
    josesCoefficient: null,
  };
}

function toPlayerStatsView(row: PlayerStatDelta): PlayerStatsView {
  return {
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
    pollosFor: row.pollosFor,
    pollosAgainst: row.pollosAgainst,
    zapatosFor: row.zapatosFor,
    zapatosAgainst: row.zapatosAgainst,
    josesCoefficient: computeJosesCoefficient(row),
  };
}

export type MatchupStatsResult = {
  matchCount: number;
  gameCount: number;
  byPlayerId: Record<number, PlayerStatsView>;
};

/**
 * Recompute per-player stats from exported matches that include the given
 * players in the given relative team alignment.
 */
export function computeMatchupStats(args: {
  data: OlympusExportData;
  filter: HistoryFilter;
  modeLabel: string;
  playerIds: number[];
}): MatchupStatsResult {
  const { data, filter, modeLabel, playerIds } = args;
  const tables = data.tables;

  const matches = (tables.matches ?? []).map((row) => ({
    id: asNumber(row.id),
    mode_label: asString(row.mode_label),
    players_amount: asNumber(row.players_amount),
  }));

  const seats = (tables.match_players ?? []).map((row) => ({
    match_id: asNumber(row.match_id),
    seat: asNumber(row.seat),
    display_name: asString(row.display_name),
    player_id: asNullableNumber(row.player_id),
  }));

  const gameRows = [...(tables.games ?? [])].sort((a, b) => {
    const matchDiff = asNumber(a.match_id) - asNumber(b.match_id);
    if (matchDiff !== 0) return matchDiff;
    return asNumber(a.game_index) - asNumber(b.game_index);
  });

  const scores = (tables.game_team_scores ?? []).map((row) => ({
    game_id: asNumber(row.game_id),
    team_number: asNumber(row.team_number),
    total_points: asNumber(row.total_points),
    hands_json: asString(row.hands_json, "[]"),
  }));

  const seatsByMatch = new Map<number, NamedSeat[]>();
  const historySeatsByMatch = new Map<number, HistorySeat[]>();
  for (const seat of seats) {
    const named = seatsByMatch.get(seat.match_id) ?? [];
    named.push({
      seat: seat.seat,
      displayName: seat.display_name,
      playerId: seat.player_id,
    });
    seatsByMatch.set(seat.match_id, named);

    const history = historySeatsByMatch.get(seat.match_id) ?? [];
    history.push({
      seat: seat.seat,
      displayName: seat.display_name,
      playerId: seat.player_id,
      nameKey: normalizeNameKey(seat.display_name),
    });
    historySeatsByMatch.set(seat.match_id, history);
  }

  const scoresByGame = new Map<number, HistoryScoreRow[]>();
  for (const score of scores) {
    const list = scoresByGame.get(score.game_id) ?? [];
    list.push(score);
    scoresByGame.set(score.game_id, list);
  }

  const gamesByMatch = new Map<number, MatchGame[]>();
  for (const row of gameRows) {
    const matchId = asNumber(row.match_id);
    const gameId = asNumber(row.id);
    const list = gamesByMatch.get(matchId) ?? [];
    list.push(
      gameFromScores(
        scoresByGame.get(gameId) ?? [],
        row.winner_team == null ? null : asString(row.winner_team)
      )
    );
    gamesByMatch.set(matchId, list);
  }

  const matching = matches.filter((match) => {
    if (match.mode_label !== modeLabel) return false;
    return matchPassesHistoryFilter(
      {
        playersAmount: match.players_amount,
        modeLabel: match.mode_label,
        seats: historySeatsByMatch.get(match.id) ?? [],
      },
      filter
    );
  });

  const deltas = matching.map((match) =>
    computeMatchStatsDelta({
      modeLabel: match.mode_label,
      playersAmount: match.players_amount,
      seats: seatsByMatch.get(match.id) ?? [],
      games: gamesByMatch.get(match.id) ?? [],
    })
  );
  const merged = mergeStatsDeltas(deltas);

  let gameCount = 0;
  for (const match of matching) {
    gameCount += gamesByMatch.get(match.id)?.length ?? 0;
  }

  const byPlayerId: Record<number, PlayerStatsView> = {};
  for (const playerId of playerIds) {
    const row = merged.playerStats.find(
      (s) => s.playerId === playerId && s.modeLabel === modeLabel
    );
    byPlayerId[playerId] = row
      ? toPlayerStatsView(row)
      : emptyStats(playerId, modeLabel);
  }

  return {
    matchCount: matching.length,
    gameCount,
    byPlayerId,
  };
}
