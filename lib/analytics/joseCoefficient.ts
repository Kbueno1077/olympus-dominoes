import type { OlympusExportData, PlayerStatsView } from "./types";

/**
 * Jose's Coefficient — linear kn (lab formula B).
 * Keep in sync with the mobile app:
 * olympus-dominoes-app/src/domain/joseCoefficient.ts
 * and README § Jose's Coefficient.
 *
 * Previous shipped formula was tanh lead (lab A). Do not bring tanh back
 * unless product asks. Never put a top cap on denom.
 */

/** Floor for secondary-stat rates — short heaters cannot inflate extras. */
export const JOSES_SECONDARY_MIN_GAMES = 25;

export const JOSES_COEFFICIENT_WEIGHTS = {
  /** `kGames × (W−L)`. Linear, not divided by G, not tanh-capped. */
  games: 3,
  datas: 6.25,
  points: 0.15,
  pollos: 15,
  zapatos: 6,
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

/** Lead term: `kGames × (W−L)`. */
export function josesGamesTerm(netGames: number): number {
  return JOSES_COEFFICIENT_WEIGHTS.games * netGames;
}

export function josesSecondaryDenom(gamesPlayed: number): number {
  return Math.max(gamesPlayed, JOSES_SECONDARY_MIN_GAMES);
}

/**
 * R = 3×(W−L) + (6.25·ΔDW + 0.15·ΔPF + 15·ΔPo + 6·ΔZap) / max(G, 25)
 * null when G = 0
 */
export function computeJosesCoefficient(
  stats: JosesCoefficientInput
): number | null {
  const G = stats.gamesPlayed;
  if (G <= 0) return null;

  const {
    datas: wDatas,
    points: wPoints,
    pollos: wPollos,
    zapatos: wZapatos,
  } = JOSES_COEFFICIENT_WEIGHTS;

  const net = stats.gamesWon - stats.gamesLost;
  const denom = josesSecondaryDenom(G);

  return (
    josesGamesTerm(net) +
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
  const rows = Array.isArray(data.player_stats) ? data.player_stats : [];

  return {
    ...data,
    player_stats: rows.map((row) => {
      const hands_for = Number(row.hands_for) || 0;
      const hands_against = Number(row.hands_against) || 0;
      const hands_won = hands_for;
      const hands_lost = hands_against;
      const played = Number(row.hands_played) || 0;
      const hands_played = played > 0 ? played : hands_won + hands_lost;

      return {
        ...row,
        hands_for,
        hands_against,
        hands_won,
        hands_lost,
        hands_played,
        joses_coefficient: computeJosesCoefficient({
          gamesPlayed: Number(row.games_played) || 0,
          gamesWon: Number(row.games_won) || 0,
          gamesLost: Number(row.games_lost) || 0,
          handsFor: hands_for,
          handsAgainst: hands_against,
          pointsFor: Number(row.points_for) || 0,
          pointsAgainst: Number(row.points_against) || 0,
          pollosFor: Number(row.pollos_for) || 0,
          pollosAgainst: Number(row.pollos_against) || 0,
          zapatosFor: Number(row.zapatos_for) || 0,
          zapatosAgainst: Number(row.zapatos_against) || 0,
        }),
      };
    }),
  };
}
