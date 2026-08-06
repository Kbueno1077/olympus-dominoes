import type { OlympusExportData, PlayerStatsView } from "./types";

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
  | "handsFor"
  | "handsAgainst"
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
    (wDatas * (stats.handsFor - stats.handsAgainst)) / G +
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
