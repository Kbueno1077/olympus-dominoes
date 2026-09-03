/**
 * Rebuild player_stats / player_h2h by walking durable match tables.
 * Used when an import ships matches but empty aggregate sections.
 */

import {
  isDateRangeActive,
  matchInDateRange,
  type DateRange,
} from "./dateRangeFilter";
import { getMatchDetail, listMatches } from "./history";
import { recalculateAllJosesCoefficients } from "./joseCoefficient";
import {
  computeHistoryMatchStatsDelta,
  mergeStatsDeltas,
  type StatsDelta,
} from "./matchStats";
import type {
  OlympusExportData,
  PlayerH2HRow,
  PlayerStatsRow,
} from "./types";

function deltasToRows(delta: StatsDelta): {
  player_stats: PlayerStatsRow[];
  player_h2h: PlayerH2HRow[];
} {
  return {
    player_stats: delta.playerStats.map((row) => ({
      player_id: row.playerId,
      mode_label: row.modeLabel,
      tile_set: "55",
      games_played: row.gamesPlayed,
      games_won: row.gamesWon,
      games_lost: row.gamesLost,
      points_for: row.pointsFor,
      points_against: row.pointsAgainst,
      hands_for: row.handsFor,
      hands_against: row.handsAgainst,
      hands_won: row.handsWon,
      hands_lost: row.handsLost,
      hands_played: row.handsPlayed,
      pollos_for: row.pollosFor,
      pollos_against: row.pollosAgainst,
      zapatos_for: row.zapatosFor,
      zapatos_against: row.zapatosAgainst,
      joses_coefficient: null,
    })),
    player_h2h: delta.h2h.map((row) => ({
      player_id: row.playerId,
      opponent_id: row.opponentId,
      mode_label: row.modeLabel,
      tile_set: "55",
      wins: row.wins,
      losses: row.losses,
    })),
  };
}

/** True when matches exist but stored aggregates are missing. */
export function needsStatsRecomputeFromMatches(
  data: OlympusExportData
): boolean {
  const matchCount = (data.tables.matches ?? data.matches ?? []).length;
  if (matchCount === 0) return false;
  return !data.player_stats || data.player_stats.length === 0;
}

/**
 * Recompute aggregates from match/game rows, then Jose coefficients.
 * Preserves players / matches / tables other than player_stats & player_h2h.
 * Optional `dateRange` keeps only matches whose ended_at falls in range.
 */
export function recomputeAggregatesFromMatches(
  data: OlympusExportData,
  dateRange?: DateRange | null
): OlympusExportData {
  const deltas: StatsDelta[] = [];
  for (const item of listMatches(data)) {
    if (
      isDateRangeActive(dateRange) &&
      !matchInDateRange(item.endedAt, dateRange)
    ) {
      continue;
    }
    const detail = getMatchDetail(data, item.id);
    if (!detail) continue;
    deltas.push(
      computeHistoryMatchStatsDelta({
        isClosed: detail.isClosed,
        modeLabel: detail.modeLabel,
        playersAmount: detail.playersAmount,
        matchSeats: detail.seats,
        games: detail.games.map((game) => ({ game, seats: game.seats })),
      })
    );
  }

  const { player_stats, player_h2h } = deltasToRows(mergeStatsDeltas(deltas));

  return recalculateAllJosesCoefficients({
    ...data,
    player_stats,
    player_h2h,
    tables: {
      ...data.tables,
      player_stats: player_stats.map((row) => ({ ...row })),
      player_h2h: player_h2h.map((row) => ({ ...row })),
    },
  });
}

/**
 * If matches are present and player_stats is empty, rebuild aggregates.
 * No-op when stats already shipped with the export.
 */
export function withStatsFilledFromMatches(
  data: OlympusExportData
): OlympusExportData {
  if (!needsStatsRecomputeFromMatches(data)) return data;
  return recomputeAggregatesFromMatches(data);
}
