/**
 * Jose's Coefficient after each finished History match, oldest first.
 * One point per match. Someone who sits a match out keeps the stock from
 * the last match they played. Omit mode and tile set to pool the whole save.
 */

import type { DateRange } from "./dateRangeFilter";
import { matchInDateRange } from "./dateRangeFilter";
import { getMatchDetail, listMatches } from "./history";
import type { JosesCoefficientInput } from "./joseCoefficient";
import { computeHistoryMatchStatsDelta } from "./matchStats";
import type { TileSet } from "./modeFormat";
import { hiddenPlayerIds } from "./playerVisibility";
import type { OlympusExportData } from "./types";

export type TimelineStock = {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  handsFor: number;
  handsAgainst: number;
  pointsFor: number;
  pointsAgainst: number;
  pollosFor: number;
  pollosAgainst: number;
  zapatosFor: number;
  zapatosAgainst: number;
};

export type CoefficientTimelinePlayer = {
  playerId: number;
  name: string;
};

export type CoefficientTimelinePoint = {
  matchId: number;
  title: string;
  endedAt: string;
  /** Players credited in this match. Sit-outs are not included. */
  playedIds: number[];
  /** Running stocks after this match, for players who have already played. */
  stocks: Record<number, TimelineStock>;
};

export type CoefficientTimeline = {
  players: CoefficientTimelinePlayer[];
  points: CoefficientTimelinePoint[];
};

export type CoefficientTimelineOptions = {
  modeLabel?: string;
  tileSet?: TileSet;
  dateRange?: DateRange | null;
};

export type ScoredTimelinePoint = {
  matchId: number;
  title: string;
  endedAt: string;
  playedIds: number[];
  values: Record<number, number>;
};

function emptyStock(): TimelineStock {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    handsFor: 0,
    handsAgainst: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pollosFor: 0,
    pollosAgainst: 0,
    zapatosFor: 0,
    zapatosAgainst: 0,
  };
}

export function timelineStockToJosesInput(
  stock: TimelineStock
): JosesCoefficientInput {
  return {
    gamesPlayed: stock.gamesPlayed,
    gamesWon: stock.gamesWon,
    gamesLost: stock.gamesLost,
    handsFor: stock.handsFor,
    handsAgainst: stock.handsAgainst,
    pointsFor: stock.pointsFor,
    pointsAgainst: stock.pointsAgainst,
    pollosFor: stock.pollosFor,
    pollosAgainst: stock.pollosAgainst,
    zapatosFor: stock.zapatosFor,
    zapatosAgainst: stock.zapatosAgainst,
  };
}

function snapshot(
  running: Map<number, TimelineStock>,
  hidden: Set<number>
): Record<number, TimelineStock> {
  const stocks: Record<number, TimelineStock> = {};
  for (const [id, stock] of running) {
    if (hidden.has(id) || stock.gamesPlayed <= 0) continue;
    stocks[id] = { ...stock };
  }
  return stocks;
}

export function buildCoefficientTimeline(
  data: OlympusExportData,
  options?: CoefficientTimelineOptions
): CoefficientTimeline {
  const hidden = hiddenPlayerIds(data);
  const names = new Map(data.players.map((player) => [player.id, player.name]));
  const running = new Map<number, TimelineStock>();
  const points: CoefficientTimelinePoint[] = [];
  const modeLabel = options?.modeLabel;
  const tileSet = options?.tileSet;
  const dateRange = options?.dateRange;

  const chronological = listMatches(data).slice().reverse();
  for (const item of chronological) {
    if (modeLabel && item.modeLabel !== modeLabel) continue;
    if (tileSet && item.tileSet !== tileSet) continue;
    if (!matchInDateRange(item.endedAt, dateRange)) continue;

    const detail = getMatchDetail(data, item.id);
    if (!detail) continue;

    const delta = computeHistoryMatchStatsDelta({
      isClosed: detail.isClosed,
      modeLabel: detail.modeLabel,
      playersAmount: detail.playersAmount,
      matchSeats: detail.seats,
      games: detail.games.map((game) => ({ game, seats: game.seats })),
    });

    const playedIds: number[] = [];
    for (const row of delta.playerStats) {
      if (hidden.has(row.playerId) || row.gamesPlayed <= 0) continue;
      playedIds.push(row.playerId);
      let stock = running.get(row.playerId);
      if (!stock) {
        stock = emptyStock();
        running.set(row.playerId, stock);
      }
      stock.gamesPlayed += row.gamesPlayed;
      stock.gamesWon += row.gamesWon;
      stock.gamesLost += row.gamesLost;
      stock.handsFor += row.handsFor;
      stock.handsAgainst += row.handsAgainst;
      stock.pointsFor += row.pointsFor;
      stock.pointsAgainst += row.pointsAgainst;
      stock.pollosFor += row.pollosFor;
      stock.pollosAgainst += row.pollosAgainst;
      stock.zapatosFor += row.zapatosFor;
      stock.zapatosAgainst += row.zapatosAgainst;
    }

    points.push({
      matchId: item.id,
      title: item.title,
      endedAt: item.endedAt,
      playedIds,
      stocks: snapshot(running, hidden),
    });
  }

  const seen = new Set<number>();
  const players: CoefficientTimelinePlayer[] = [];
  for (const point of points) {
    for (const key of Object.keys(point.stocks)) {
      const playerId = Number(key);
      if (seen.has(playerId)) continue;
      seen.add(playerId);
      players.push({
        playerId,
        name: names.get(playerId) ?? `#${playerId}`,
      });
    }
  }
  players.sort(
    (a, b) => a.name.localeCompare(b.name) || a.playerId - b.playerId
  );

  return { players, points };
}

/**
 * Drop points so the chart shows every `stride` match.
 * Stride 1 keeps the series. The newest match always stays.
 */
export function thinTimelinePoints<T>(
  points: readonly T[],
  stride: number
): T[] {
  if (stride <= 1 || points.length <= 2) return [...points];
  const kept: T[] = [];
  for (let i = 0; i < points.length; i += stride) {
    const point = points[i];
    if (point !== undefined) kept.push(point);
  }
  const last = points[points.length - 1];
  if (last !== undefined && kept[kept.length - 1] !== last) kept.push(last);
  return kept;
}

/**
 * First date index currently in view.
 * A null request stays on the newest page; the result never walks past the ends.
 */
export function timelineWindowStart(
  length: number,
  pageSize: number,
  requestedStart: number | null
): number {
  const page = Math.max(1, pageSize);
  const maxStart = Math.max(0, length - page);
  if (requestedStart == null) return maxStart;
  return Math.min(Math.max(0, requestedStart), maxStart);
}

/**
 * Round Y-axis ticks for a coefficient range.
 * Steps land on 1, 2, 5, or 10 × a power of ten, and always cover min..max.
 */
export function coefficientAxisTicks(min: number, max: number): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (max < min) return coefficientAxisTicks(max, min);
  if (max === min) {
    const pad = Math.abs(min) > 1 ? Math.abs(min) * 0.25 : 1;
    return coefficientAxisTicks(min - pad, max + pad);
  }
  const raw = (max - min) / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const err = raw / pow;
  const nice = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
  const step = nice * pow;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const count = Math.round((end - start) / step);
  const ticks: number[] = [];
  for (let i = 0; i <= count; i += 1) {
    ticks.push(Math.round((start + i * step) * 1000) / 1000);
    if (ticks.length > 8) break;
  }
  return ticks;
}

/**
 * Dates where none of the players still on the chart actually sat.
 * A carried score from an earlier match does not keep the date.
 */
export function timelinePointsForPlayers<T extends { playedIds: readonly number[] }>(
  points: readonly T[],
  activePlayerIds: ReadonlySet<number>
): T[] {
  if (activePlayerIds.size === 0) return [];
  return points.filter((point) =>
    point.playedIds.some((id) => activePlayerIds.has(id))
  );
}

/** Score each carried stock. Missing players have not played yet. */
export function mapTimelineScores(
  timeline: CoefficientTimeline,
  score: (stock: TimelineStock) => number | null
): ScoredTimelinePoint[] {
  return timeline.points.map((point) => {
    const values: Record<number, number> = {};
    for (const [key, stock] of Object.entries(point.stocks)) {
      const value = score(stock);
      if (value == null || !Number.isFinite(value)) continue;
      values[Number(key)] = value;
    }
    return {
      matchId: point.matchId,
      title: point.title,
      endedAt: point.endedAt,
      playedIds: point.playedIds,
      values,
    };
  });
}
