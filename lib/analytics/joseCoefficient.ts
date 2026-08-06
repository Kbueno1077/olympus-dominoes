import type { PlayerStatsView } from "./types";

/** Weights for Jose's Coefficient (keep in sync with the mobile app). */
export const JOSES_COEFFICIENT_WEIGHTS = {
  games: 100,
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
  | "handsWon"
  | "handsLost"
  | "pointsFor"
  | "pointsAgainst"
  | "pollosFor"
  | "pollosAgainst"
  | "zapatosFor"
  | "zapatosAgainst"
>;

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

  return (
    (wGames * (stats.gamesWon - stats.gamesLost)) / G +
    (wDatas * (stats.handsWon - stats.handsLost)) / G +
    (wPoints * (stats.pointsFor - stats.pointsAgainst)) / G +
    (wPollos * (stats.pollosFor - stats.pollosAgainst)) / G +
    (wZapatos * (stats.zapatosFor - stats.zapatosAgainst)) / G
  );
}

export function formatJosesCoefficient(
  value: number | null | undefined
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}
