import type { OlympusExportData, PlayerStatsView } from "./types";

/**
 * Jose's Coefficient — keep in sync with the mobile app:
 * olympus-dominoes-app/src/domain/joseCoefficient.ts
 * and README § Jose's Coefficient.
 */

export const JOSES_LEAD_SATURATION = 20;
export const JOSES_LEAD_SCALE = 8;
/** Floor for secondary-stat rates — short heaters cannot inflate 2nds. */
export const JOSES_SECONDARY_MIN_GAMES = 25;

export const JOSES_COEFFICIENT_WEIGHTS = {
  /** Multiplier on leadScore(W−L). Absolute net — not divided by G. */
  games: 1.7,
  datas: 3,
  points: 0.1,
  pollos: 10,
  zapatos: 4,
} as const;

export type JosesCoefficientInput = Pick<
  PlayerStatsView,
  | "gamesPlayed"
  | "gamesWon"
  | "gamesLost"
  | "handsFor"
  | "handsAgainst"
  | "pointsFor"
  | "pointsAgainst"
  | "pollosFor"
  | "pollosAgainst"
  | "zapatosFor"
  | "zapatosAgainst"
>;

/** `20 * tanh(net / 8)` — soft-caps past ~±20. */
export function josesLeadScore(netGames: number): number {
  return JOSES_LEAD_SATURATION * Math.tanh(netGames / JOSES_LEAD_SCALE);
}

export function josesSecondaryDenom(gamesPlayed: number): number {
  return Math.max(gamesPlayed, JOSES_SECONDARY_MIN_GAMES);
}

/**
 * Lead = 1.7 × leadScore(W−L)
 * 2nds = datas/points/pollos/zapatos over max(G, 25)
 * R = Lead + 2nds; null when G = 0
 */
export function computeJosesCoefficient(
  stats: JosesCoefficientInput
): number | null {
  const G = stats.gamesPlayed;
  if (G <= 0) return null;

  const {
    games: wGames,
    datas: wDatas,
    points: wPoints,
    pollos: wPollos,
    zapatos: wZapatos,
  } = JOSES_COEFFICIENT_WEIGHTS;

  const net = stats.gamesWon - stats.gamesLost;
  const denom = josesSecondaryDenom(G);

  return (
    wGames * josesLeadScore(net) +
    (wDatas * (stats.handsFor - stats.handsAgainst)) / denom +
    (wPoints * (stats.pointsFor - stats.pointsAgainst)) / denom +
    (wPollos * (stats.pollosFor - stats.pollosAgainst)) / denom +
    (wZapatos * (stats.zapatosFor - stats.zapatosAgainst)) / denom
  );
}

export function formatJosesCoefficient(
  value: number | null | undefined
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}

/**
 * Re-apply the current formula to every stored player_stats row.
 * Use after a formula change so rankings match the app.
 */
export function recalculateAllJosesCoefficients(
  data: OlympusExportData
): OlympusExportData {
  return {
    ...data,
    player_stats: data.player_stats.map((row) => {
      const hands_for = row.hands_for;
      const hands_against = row.hands_against;
      const hands_won = hands_for;
      const hands_lost = hands_against;
      const hands_played =
        row.hands_played > 0 ? row.hands_played : hands_won + hands_lost;

      return {
        ...row,
        hands_won,
        hands_lost,
        hands_played,
        joses_coefficient: computeJosesCoefficient({
          gamesPlayed: row.games_played,
          gamesWon: row.games_won,
          gamesLost: row.games_lost,
          handsFor: hands_for,
          handsAgainst: hands_against,
          pointsFor: row.points_for,
          pointsAgainst: row.points_against,
          pollosFor: row.pollos_for,
          pollosAgainst: row.pollos_against,
          zapatosFor: row.zapatos_for,
          zapatosAgainst: row.zapatos_against,
        }),
      };
    }),
  };
}
