import type { OlympusExportData, PlayerStatsView } from "./types";

/**
 * Jose's Coefficient — ranking score from aggregated player_stats.
 * Keep in sync with the mobile app:
 * olympus-dominoes-app/src/domain/joseCoefficient.ts
 * and README § Jose's Coefficient.
 *
 * Production ranking is KJ(x):
 * R = 2.5 × ΔG + ΔDW / 3.5 + ΔPF / 150 + 2.5 × (ΔPo / 4 + 0.4 × ΔZap / 4)
 * null when G = 0. Secondaries are stocks, not rates — no / max(G, 25).
 */

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

/** Weights for Jose's Coefficient — KJ(x) (see README). */
export const JOSES_COEFFICIENT_WEIGHTS = {
  /** Multiplier on net games ΔG = W − L. */
  games: 2.5,
  /** ΔDW / 3.5 — 3.5 net datas = 1 R. */
  datasDivisor: 3.5,
  /** ΔPF / 150 — 150 net points = 1 R. */
  pointsDivisor: 150,
  /** 2.5 × (ΔPo / 4 + 0.4 × ΔZap / 4). */
  shutoutScale: 2.5,
  pollosDivisor: 4,
  /** Zapato share inside the shutout term (a pollo is 2.5× a zapato). */
  zapatoWeight: 0.4,
} as const;

/** Lead term: `2.5 × ΔG`. */
export function josesLeadTerm(netGames: number): number {
  return JOSES_COEFFICIENT_WEIGHTS.games * netGames;
}

/**
 * Datas, points, pollos, zapatos — not divided by games.
 * `ΔDW / 3.5 + ΔPF / 150 + 2.5 × (ΔPo / 4 + 0.4 × ΔZap / 4)`
 */
export function josesSecondaryTerm(
  deltaDW: number,
  deltaPF: number,
  deltaPo: number,
  deltaZap: number
): number {
  const {
    datasDivisor,
    pointsDivisor,
    shutoutScale,
    pollosDivisor,
    zapatoWeight,
  } = JOSES_COEFFICIENT_WEIGHTS;

  return (
    deltaDW / datasDivisor +
    deltaPF / pointsDivisor +
    shutoutScale *
      (deltaPo / pollosDivisor + (zapatoWeight * deltaZap) / pollosDivisor)
  );
}

/**
 * Returns the coefficient for one (player, mode) aggregate row.
 * `null` when there are no games yet (undefined ranking).
 *
 * R = 2.5 × ΔG
 *   + ΔDW / 3.5 + ΔPF / 150
 *   + 2.5 × (ΔPo / 4 + 0.4 × ΔZap / 4)
 */
export function computeJosesCoefficient(
  stats: JosesCoefficientInput
): number | null {
  if (stats.gamesPlayed <= 0) return null;

  const deltaG = stats.gamesWon - stats.gamesLost;
  const deltaDW = stats.handsFor - stats.handsAgainst;
  const deltaPF = stats.pointsFor - stats.pointsAgainst;
  const deltaPo = stats.pollosFor - stats.pollosAgainst;
  const deltaZap = stats.zapatosFor - stats.zapatosAgainst;

  return (
    josesLeadTerm(deltaG) +
    josesSecondaryTerm(deltaDW, deltaPF, deltaPo, deltaZap)
  );
}

/** Display helper — one decimal, or em dash when unranked. */
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
