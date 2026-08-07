import { formatJosesCoefficient } from "@/lib/analytics/joseCoefficient";
import {
  formatPerGameRatePct,
  formatSignedDiff,
  perHandAverage,
  signedDiffColor,
} from "@/lib/analytics/signedDiff";
import type { PlayerStatsView } from "@/lib/analytics/types";

/**
 * Canonical order for Full Breakdown and Compare tables — keep these in sync.
 */
export const BREAKDOWN_STAT_KEYS = [
  "josesCoefficient",
  "gamesPlayed",
  "gamesWon",
  "gamesLost",
  "gameDifference",
  "winRate",
  "pointsFor",
  "pointsAgainst",
  "pointsDifference",
  "handsPlayed",
  "handsWon",
  "handsLost",
  "handsDifference",
  "pointsPerHandFor",
  "pointsPerHandAgainst",
  "pointsPerHandDifference",
  "pollosFor",
  "pollosAgainst",
  "pollosDifference",
  "pollosRate",
  "zapatosFor",
  "zapatosAgainst",
  "zapatosDifference",
  "zapatosRate",
] as const;

export type BreakdownStatKey = (typeof BREAKDOWN_STAT_KEYS)[number];

export type BreakdownStatLabels = {
  key: BreakdownStatKey;
  /** Short table header key in i18n. */
  abbrKey: string;
  /** Full breakdown / tooltip key in i18n. */
  fullKey: string;
};

/** i18n keys for each breakdown row (abbr = compare column, full = labels). */
export const BREAKDOWN_STAT_DEFS: readonly BreakdownStatLabels[] =
  BREAKDOWN_STAT_KEYS.map((key) => {
    switch (key) {
      case "josesCoefficient":
        return {
          key,
          abbrKey: "statsAbbrJoses",
          fullKey: "statsJosesCoefficient",
        };
      case "gamesPlayed":
        return {
          key,
          abbrKey: "statsAbbrGamesPlayed",
          fullKey: "statsGamesPlayed",
        };
      case "gamesWon":
        return {
          key,
          abbrKey: "statsAbbrGamesWon",
          fullKey: "statsGamesWon",
        };
      case "gamesLost":
        return {
          key,
          abbrKey: "statsAbbrGamesLost",
          fullKey: "statsGamesLost",
        };
      case "gameDifference":
        return {
          key,
          abbrKey: "statsAbbrGameDifference",
          fullKey: "statsGameDifference",
        };
      case "winRate":
        return {
          key,
          abbrKey: "statsAbbrWinRate",
          fullKey: "statsWinRate",
        };
      case "pointsFor":
        return {
          key,
          abbrKey: "statsAbbrPointsFor",
          fullKey: "statsPointsFor",
        };
      case "pointsAgainst":
        return {
          key,
          abbrKey: "statsAbbrPointsAgainst",
          fullKey: "statsPointsAgainst",
        };
      case "pointsDifference":
        return {
          key,
          abbrKey: "statsAbbrPointsDifference",
          fullKey: "statsPointsDifference",
        };
      case "handsPlayed":
        return {
          key,
          abbrKey: "statsAbbrHandsTotal",
          fullKey: "statsHandsTotal",
        };
      case "handsWon":
        return {
          key,
          abbrKey: "statsAbbrHandsWon",
          fullKey: "statsHandsWon",
        };
      case "handsLost":
        return {
          key,
          abbrKey: "statsAbbrHandsLost",
          fullKey: "statsHandsLost",
        };
      case "handsDifference":
        return {
          key,
          abbrKey: "statsAbbrHandsDifference",
          fullKey: "statsHandsDifference",
        };
      case "pointsPerHandFor":
        return {
          key,
          abbrKey: "statsAbbrPointsPerHandFor",
          fullKey: "statsPointsPerHandFor",
        };
      case "pointsPerHandAgainst":
        return {
          key,
          abbrKey: "statsAbbrPointsPerHandAgainst",
          fullKey: "statsPointsPerHandAgainst",
        };
      case "pointsPerHandDifference":
        return {
          key,
          abbrKey: "statsAbbrPointsPerHandDifference",
          fullKey: "statsPointsPerHandDifference",
        };
      case "pollosFor":
        return {
          key,
          abbrKey: "statsAbbrPollosFor",
          fullKey: "statsPollosFor",
        };
      case "pollosAgainst":
        return {
          key,
          abbrKey: "statsAbbrPollosAgainst",
          fullKey: "statsPollosAgainst",
        };
      case "pollosDifference":
        return {
          key,
          abbrKey: "statsAbbrPollosDifference",
          fullKey: "statsPollosDifference",
        };
      case "pollosRate":
        return {
          key,
          abbrKey: "statsAbbrPollosRate",
          fullKey: "statsPollosRate",
        };
      case "zapatosFor":
        return {
          key,
          abbrKey: "statsAbbrZapatosFor",
          fullKey: "statsZapatosFor",
        };
      case "zapatosAgainst":
        return {
          key,
          abbrKey: "statsAbbrZapatosAgainst",
          fullKey: "statsZapatosAgainst",
        };
      case "zapatosDifference":
        return {
          key,
          abbrKey: "statsAbbrZapatosDifference",
          fullKey: "statsZapatosDifference",
        };
      case "zapatosRate":
        return {
          key,
          abbrKey: "statsAbbrZapatosRate",
          fullKey: "statsZapatosRate",
        };
      default: {
        const _exhaustive: never = key;
        return _exhaustive;
      }
    }
  });

function formatPerHand(points: number, hands: number): string {
  if (hands <= 0) return "—";
  const avg = points / hands;
  return Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
}

export function formatBreakdownValue(
  stats: PlayerStatsView | null,
  key: BreakdownStatKey
): string {
  if (!stats) return "—";
  switch (key) {
    case "josesCoefficient":
      return formatJosesCoefficient(stats.josesCoefficient);
    case "gamesPlayed":
      return String(stats.gamesPlayed);
    case "gamesWon":
      return String(stats.gamesWon);
    case "gamesLost":
      return String(stats.gamesLost);
    case "gameDifference":
      return formatSignedDiff(stats.gamesWon - stats.gamesLost);
    case "winRate":
      return stats.gamesPlayed > 0
        ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%`
        : "—";
    case "pointsFor":
      return String(stats.pointsFor);
    case "pointsAgainst":
      return String(stats.pointsAgainst);
    case "pointsDifference":
      return formatSignedDiff(stats.pointsFor - stats.pointsAgainst);
    case "handsPlayed":
      return String(stats.handsPlayed);
    case "handsWon":
      return String(stats.handsWon);
    case "handsLost":
      return String(stats.handsLost);
    case "handsDifference":
      return formatSignedDiff(stats.handsWon - stats.handsLost);
    case "pointsPerHandFor":
      return formatPerHand(stats.pointsFor, stats.handsFor);
    case "pointsPerHandAgainst":
      return formatPerHand(stats.pointsAgainst, stats.handsAgainst);
    case "pointsPerHandDifference": {
      const forAvg = perHandAverage(stats.pointsFor, stats.handsFor);
      const againstAvg = perHandAverage(
        stats.pointsAgainst,
        stats.handsAgainst
      );
      if (forAvg == null || againstAvg == null) return "—";
      return formatSignedDiff(forAvg - againstAvg, 1);
    }
    case "pollosFor":
      return String(stats.pollosFor);
    case "pollosAgainst":
      return String(stats.pollosAgainst);
    case "pollosDifference":
      return formatSignedDiff(stats.pollosFor - stats.pollosAgainst);
    case "pollosRate":
      return formatPerGameRatePct(stats.pollosFor, stats.gamesPlayed);
    case "zapatosFor":
      return String(stats.zapatosFor);
    case "zapatosAgainst":
      return String(stats.zapatosAgainst);
    case "zapatosDifference":
      return formatSignedDiff(stats.zapatosFor - stats.zapatosAgainst);
    case "zapatosRate":
      return formatPerGameRatePct(stats.zapatosFor, stats.gamesPlayed);
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

export function breakdownValueColor(
  stats: PlayerStatsView | null,
  key: BreakdownStatKey
): string | undefined {
  if (!stats) return undefined;
  switch (key) {
    case "gameDifference":
      return signedDiffColor(stats.gamesWon - stats.gamesLost);
    case "pointsDifference":
      return signedDiffColor(stats.pointsFor - stats.pointsAgainst);
    case "handsDifference":
      return signedDiffColor(stats.handsWon - stats.handsLost);
    case "pointsPerHandDifference": {
      const forAvg = perHandAverage(stats.pointsFor, stats.handsFor);
      const againstAvg = perHandAverage(
        stats.pointsAgainst,
        stats.handsAgainst
      );
      if (forAvg == null || againstAvg == null) return undefined;
      return signedDiffColor(forAvg - againstAvg);
    }
    case "pollosDifference":
      return signedDiffColor(stats.pollosFor - stats.pollosAgainst);
    case "zapatosDifference":
      return signedDiffColor(stats.zapatosFor - stats.zapatosAgainst);
    default:
      return undefined;
  }
}
