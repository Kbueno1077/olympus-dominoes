import { teamNumberFrom } from "@/utils/matchSettings";
import { teamInitialLabelsByNumber } from "@/utils/teams";
import { stripTrailingPadHands } from "./hands";
import type { OlympusExportData } from "./types";

export type HistorySeat = {
  seat: number;
  displayName: string;
  playerId: number | null;
};

export type HistoryGame = {
  t1Datas: number[];
  t1TotalPoints: number;
  t2Datas: number[];
  t2TotalPoints: number;
  t3Datas: number[];
  t3TotalPoints: number;
  t4Datas: number[];
  t4TotalPoints: number;
  winner: string;
};

export type MatchListItem = {
  id: number;
  title: string;
  endedAt: string;
  playersAmount: number;
  modeLabel: string;
  maxPoints: number;
  gameCount: number;
  playerNames: string[];
  /** Seats 1..playersAmount with optional linked export player ids. */
  seats: HistorySeat[];
  /** Games won per active team (Team 1, Team 2, …). */
  teamWins: { teamNumber: number; wins: number }[];
};

export type MatchDetail = {
  id: number;
  title: string;
  endedAt: string;
  playersAmount: number;
  modeLabel: string;
  maxPoints: number;
  seats: HistorySeat[];
  games: HistoryGame[];
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

function emptyGame(winner: string): HistoryGame {
  return {
    t1Datas: [],
    t1TotalPoints: 0,
    t2Datas: [],
    t2TotalPoints: 0,
    t3Datas: [],
    t3TotalPoints: 0,
    t4Datas: [],
    t4TotalPoints: 0,
    winner,
  };
}

function gameFromScores(
  scores: {
    team_number: number;
    total_points: number;
    hands_json: string;
  }[],
  winnerTeam: string | null
): HistoryGame {
  const game = emptyGame(winnerTeam ?? "none");

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

/** Localized match timestamp for history titles. */
export function formatMatchDate(
  language: string,
  date: Date | string
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) {
    return typeof date === "string" ? date : "";
  }

  const locale = language === "es" ? "es-ES" : "en-US";

  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(value);
  } catch {
    return value.toISOString();
  }
}

/**
 * Mobile exports often store the English date as `title`. Treat that as empty
 * so the UI shows only the current-language timestamp.
 */
export function resolveMatchHeading(
  language: string,
  title: string,
  endedAt: Date | string
): { heading: string; showDateSubtitle: boolean } {
  const trimmed = title.trim();
  const localized = formatMatchDate(language, endedAt);
  if (!trimmed) {
    return { heading: localized, showDateSubtitle: false };
  }

  const en = formatMatchDate("en", endedAt);
  const es = formatMatchDate("es", endedAt);
  if (trimmed === en || trimmed === es || trimmed === localized) {
    return { heading: localized, showDateSubtitle: false };
  }

  return { heading: trimmed, showDateSubtitle: true };
}

export function listMatches(data: OlympusExportData): MatchListItem[] {
  const matches = data.tables.matches ?? [];
  const seats = data.tables.match_players ?? [];
  const games = data.tables.games ?? [];

  const seatsByMatch = new Map<number, HistorySeat[]>();
  for (const row of seats) {
    const matchId = asNumber(row.match_id);
    const list = seatsByMatch.get(matchId) ?? [];
    list.push({
      seat: asNumber(row.seat),
      displayName: asString(row.display_name),
      playerId: asNullableNumber(row.player_id),
    });
    seatsByMatch.set(matchId, list);
  }

  const gameCountByMatch = new Map<number, number>();
  const winsByMatch = new Map<number, Map<number, number>>();
  for (const row of games) {
    const matchId = asNumber(row.match_id);
    gameCountByMatch.set(matchId, (gameCountByMatch.get(matchId) ?? 0) + 1);
    const team = teamNumberFrom(asString(row.winner_team));
    if (team == null) continue;
    const winMap = winsByMatch.get(matchId) ?? new Map<number, number>();
    winMap.set(team, (winMap.get(team) ?? 0) + 1);
    winsByMatch.set(matchId, winMap);
  }

  return matches
    .map((row) => {
      const id = asNumber(row.id);
      const playersAmount = asNumber(row.players_amount);
      const modeLabel = asString(row.mode_label);
      const matchSeats = (seatsByMatch.get(id) ?? [])
        .slice()
        .sort((a, b) => a.seat - b.seat);
      const playerNames = matchSeats
        .filter((s) => s.seat >= 1 && s.seat <= playersAmount)
        .map((s) => s.displayName)
        .filter(Boolean);

      const isFreeForAll = modeLabel === "Free For All";
      const teamNumbers =
        playersAmount > 2 && isFreeForAll
          ? playersAmount === 4
            ? [1, 2, 3, 4]
            : [1, 2, 3]
          : [1, 2];
      const winMap = winsByMatch.get(id) ?? new Map<number, number>();
      const teamWins = teamNumbers.map((teamNumber) => ({
        teamNumber,
        wins: winMap.get(teamNumber) ?? 0,
      }));

      return {
        id,
        title: asString(row.title),
        endedAt: asString(row.ended_at),
        playersAmount,
        modeLabel,
        maxPoints: asNumber(row.max_points),
        gameCount: gameCountByMatch.get(id) ?? 0,
        playerNames,
        seats: matchSeats.filter(
          (s) => s.seat >= 1 && s.seat <= playersAmount
        ),
        teamWins,
      };
    })
    .sort((a, b) => {
      const at = new Date(a.endedAt).getTime();
      const bt = new Date(b.endedAt).getTime();
      if (Number.isFinite(bt) && Number.isFinite(at) && bt !== at) {
        return bt - at;
      }
      return b.id - a.id;
    });
}

export function getMatchDetail(
  data: OlympusExportData,
  matchId: number
): MatchDetail | null {
  const matchRow = (data.tables.matches ?? []).find(
    (row) => asNumber(row.id) === matchId
  );
  if (!matchRow) return null;

  const seats = (data.tables.match_players ?? [])
    .filter((row) => asNumber(row.match_id) === matchId)
    .map((row) => ({
      seat: asNumber(row.seat),
      displayName: asString(row.display_name),
      playerId: asNullableNumber(row.player_id),
    }))
    .sort((a, b) => a.seat - b.seat);

  const gameRows = (data.tables.games ?? [])
    .filter((row) => asNumber(row.match_id) === matchId)
    .slice()
    .sort((a, b) => asNumber(a.game_index) - asNumber(b.game_index));

  const scores = data.tables.game_team_scores ?? [];
  const scoresByGame = new Map<
    number,
    { team_number: number; total_points: number; hands_json: string }[]
  >();
  for (const row of scores) {
    const gameId = asNumber(row.game_id);
    const list = scoresByGame.get(gameId) ?? [];
    list.push({
      team_number: asNumber(row.team_number),
      total_points: asNumber(row.total_points),
      hands_json: asString(row.hands_json, "[]"),
    });
    scoresByGame.set(gameId, list);
  }

  const games = gameRows.map((row) =>
    gameFromScores(
      scoresByGame.get(asNumber(row.id)) ?? [],
      row.winner_team == null ? null : asString(row.winner_team)
    )
  );

  return {
    id: asNumber(matchRow.id),
    title: asString(matchRow.title),
    endedAt: asString(matchRow.ended_at),
    playersAmount: asNumber(matchRow.players_amount),
    modeLabel: asString(matchRow.mode_label),
    maxPoints: asNumber(matchRow.max_points),
    seats,
    games,
  };
}

export function seatNamesFromDetail(detail: MatchDetail): string[] {
  const names = ["", "", "", ""];
  for (const seat of detail.seats) {
    if (seat.seat >= 1 && seat.seat <= 4) {
      names[seat.seat - 1] = seat.displayName;
    }
  }
  return names;
}

export function teamLabelsForDetail(
  detail: MatchDetail
): Record<number, string> {
  return teamInitialLabelsByNumber(
    detail.playersAmount,
    detail.modeLabel,
    seatNamesFromDetail(detail)
  ) as Record<number, string>;
}

/** Compact “KJ 3–1 RaRu” style scoreline for list cards. */
export function formatMatchScoreline(
  item: Pick<
    MatchListItem,
    "playersAmount" | "modeLabel" | "playerNames" | "teamWins"
  >,
  teamName: (n: number) => string
): string {
  const labels = teamInitialLabelsByNumber(
    item.playersAmount,
    item.modeLabel,
    [
      item.playerNames[0] ?? "",
      item.playerNames[1] ?? "",
      item.playerNames[2] ?? "",
      item.playerNames[3] ?? "",
    ]
  ) as Record<number, string>;

  return item.teamWins
    .map((row) => {
      const label = labels[row.teamNumber] || teamName(row.teamNumber);
      return `${label} ${row.wins}`;
    })
    .join(" – ");
}
