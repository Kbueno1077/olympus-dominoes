import { formatJosesCoefficient } from "./joseCoefficient";
import {
  formatPerGameRatePct,
  formatSignedDiff,
  perHandAverage,
} from "./signedDiff";

/** Minimum games for rate trophies (pollo/zapato rates). */
export const PODIUM_RATE_MIN_GAMES = 5;

/** Minimum games for count / net / volume trophies. */
export const PODIUM_COUNT_MIN_GAMES = 1;

export type PodiumKind = "glory" | "grind" | "shame";

export type PodiumCategoryId =
  | "jose"
  | "datas"
  | "points"
  | "pph"
  | "pollos"
  | "polloRate"
  | "zapatos"
  | "zapatoRate"
  | "games"
  | "hands"
  | "bestLoser"
  | "keepsComing"
  | "pollosEaten"
  | "zapatosEaten";

/** Minimal row shape shared by app LeaderboardRow and web analytics. */
export type PodiumPlayerRow = {
  playerId: number;
  playerName: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  pointsFor: number;
  pointsAgainst: number;
  handsWon: number;
  handsLost: number;
  handsPlayed: number;
  handsFor: number;
  handsAgainst: number;
  pollosFor: number;
  pollosAgainst: number;
  zapatosFor: number;
  zapatosAgainst: number;
  josesCoefficient: number | null;
};

export type PodiumPlace = {
  playerId: number;
  playerName: string;
  value: number;
  display: string;
} | null;

export type PodiumCategoryResult = {
  id: PodiumCategoryId;
  kind: PodiumKind;
  winner: PodiumPlace;
  runnerUp: PodiumPlace;
};

type CategoryDef = {
  id: PodiumCategoryId;
  kind: PodiumKind;
  minGames: number;
  /** Extra eligibility filter (e.g. keepsComing). */
  eligible?: (row: PodiumPlayerRow) => boolean;
  /** Return null when the metric cannot be computed for this row. */
  metric: (row: PodiumPlayerRow) => number | null;
  format: (value: number, row: PodiumPlayerRow) => string;
};

function pphDiff(row: PodiumPlayerRow): number | null {
  const forAvg = perHandAverage(row.pointsFor, row.handsFor);
  const againstAvg = perHandAverage(row.pointsAgainst, row.handsAgainst);
  if (forAvg == null || againstAvg == null) return null;
  return forAvg - againstAvg;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "jose",
    kind: "glory",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.josesCoefficient,
    format: (value) => formatJosesCoefficient(value),
  },
  {
    id: "datas",
    kind: "glory",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.handsWon - row.handsLost,
    format: (value) => formatSignedDiff(value),
  },
  {
    id: "points",
    kind: "glory",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.pointsFor - row.pointsAgainst,
    format: (value) => formatSignedDiff(value),
  },
  {
    id: "pph",
    kind: "glory",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: pphDiff,
    format: (value) => formatSignedDiff(value, 1),
  },
  {
    id: "pollos",
    kind: "glory",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.pollosFor,
    format: (value) => String(value),
  },
  {
    id: "polloRate",
    kind: "glory",
    minGames: PODIUM_RATE_MIN_GAMES,
    metric: (row) =>
      row.gamesPlayed > 0 ? (row.pollosFor / row.gamesPlayed) * 100 : null,
    format: (_value, row) =>
      formatPerGameRatePct(row.pollosFor, row.gamesPlayed),
  },
  {
    id: "zapatos",
    kind: "glory",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.zapatosFor,
    format: (value) => String(value),
  },
  {
    id: "zapatoRate",
    kind: "glory",
    minGames: PODIUM_RATE_MIN_GAMES,
    metric: (row) =>
      row.gamesPlayed > 0 ? (row.zapatosFor / row.gamesPlayed) * 100 : null,
    format: (_value, row) =>
      formatPerGameRatePct(row.zapatosFor, row.gamesPlayed),
  },
  {
    id: "games",
    kind: "grind",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.gamesPlayed,
    format: (value) => String(value),
  },
  {
    id: "hands",
    kind: "grind",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.handsPlayed,
    format: (value) => String(value),
  },
  {
    id: "bestLoser",
    kind: "shame",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.gamesLost,
    format: (value) => String(value),
  },
  {
    id: "keepsComing",
    kind: "shame",
    minGames: PODIUM_COUNT_MIN_GAMES,
    eligible: (row) => row.gamesLost >= row.gamesWon,
    metric: (row) => row.gamesPlayed,
    format: (value) => String(value),
  },
  {
    id: "pollosEaten",
    kind: "shame",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.pollosAgainst,
    format: (value) => String(value),
  },
  {
    id: "zapatosEaten",
    kind: "shame",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.zapatosAgainst,
    format: (value) => String(value),
  },
];

export const PODIUM_CATEGORY_IDS: PodiumCategoryId[] = CATEGORIES.map(
  (c) => c.id
);

function compareCandidates(
  a: { row: PodiumPlayerRow; value: number },
  b: { row: PodiumPlayerRow; value: number }
): number {
  if (b.value !== a.value) return b.value - a.value;
  if (b.row.gamesPlayed !== a.row.gamesPlayed) {
    return b.row.gamesPlayed - a.row.gamesPlayed;
  }
  return a.row.playerName.localeCompare(b.row.playerName);
}

function toPlace(
  candidate: { row: PodiumPlayerRow; value: number } | undefined,
  format: CategoryDef["format"]
): PodiumPlace {
  if (!candidate) return null;
  return {
    playerId: candidate.row.playerId,
    playerName: candidate.row.playerName,
    value: candidate.value,
    display: format(candidate.value, candidate.row),
  };
}

function rankCategory(
  rows: PodiumPlayerRow[],
  def: CategoryDef
): PodiumCategoryResult {
  const candidates = rows
    .filter((row) => row.gamesPlayed >= def.minGames)
    .filter((row) => (def.eligible ? def.eligible(row) : true))
    .map((row) => {
      const value = def.metric(row);
      if (value == null || Number.isNaN(value)) return null;
      return { row, value };
    })
    .filter((c): c is { row: PodiumPlayerRow; value: number } => c != null)
    .sort(compareCandidates);

  return {
    id: def.id,
    kind: def.kind,
    winner: toPlace(candidates[0], def.format),
    runnerUp: toPlace(candidates[1], def.format),
  };
}

/** Build all podium categories for a mode's leaderboard rows. */
export function buildPodium(rows: PodiumPlayerRow[]): PodiumCategoryResult[] {
  return CATEGORIES.map((def) => rankCategory(rows, def));
}
