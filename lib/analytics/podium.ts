import { formatJosesCoefficient } from "./joseCoefficient";
import {
  formatPerGameRatePct,
  formatSignedDiff,
  perHandAverage,
} from "./signedDiff";
import type { StylePodiumRow } from "./stylePoints";

/** Minimum games for rate trophies (pollo/zapato rates). */
export const PODIUM_RATE_MIN_GAMES = 5;

/** Minimum games for count / net / volume trophies. */
export const PODIUM_COUNT_MIN_GAMES = 1;

export type PodiumKind = "glory" | "style" | "grind" | "shame";

export type PodiumCategoryId =
  | "jose"
  | "datas"
  | "points"
  | "pph"
  | "pollos"
  | "polloRate"
  | "zapatos"
  | "zapatoRate"
  | "maxDataFor"
  | "minDatasToWin"
  | "maxDatasToWin"
  | "maxDatasToLose"
  | "games"
  | "hands"
  | "minDataFor"
  | "bestLoser"
  | "keepsComing"
  | "floor"
  | "atm"
  | "pollosEaten"
  | "polloEatenRate"
  | "zapatosEaten"
  | "maxDataAgainst";

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
};

export type PodiumCategoryResult = {
  id: PodiumCategoryId;
  kind: PodiumKind;
  /** Rank 1. Several people when the metric ties. Empty when allTied. */
  first: PodiumPlace[];
  /** Rank 2. Empty when first is tied, when allTied, or when nobody else qualifies. */
  second: PodiumPlace[];
  /** Every eligible player posted the same number. */
  allTied: boolean;
  /** Shared formatted value when allTied. */
  allTiedDisplay: string | null;
};

type CategoryDef = {
  id: PodiumCategoryId;
  kind: PodiumKind;
  minGames: number;
  direction?: "higher" | "lower";
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
    metric: (row) => row.gamesLost,
    format: (_value, row) => `${row.gamesLost} / ${row.gamesPlayed}`,
  },
  {
    id: "floor",
    kind: "shame",
    minGames: PODIUM_COUNT_MIN_GAMES,
    direction: "lower",
    metric: (row) => row.josesCoefficient,
    format: (value) => formatJosesCoefficient(value),
  },
  {
    id: "atm",
    kind: "shame",
    minGames: PODIUM_COUNT_MIN_GAMES,
    direction: "lower",
    metric: (row) => row.pointsFor - row.pointsAgainst,
    format: (value) => formatSignedDiff(value),
  },
  {
    id: "pollosEaten",
    kind: "shame",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.pollosAgainst,
    format: (value) => String(value),
  },
  {
    id: "polloEatenRate",
    kind: "shame",
    minGames: PODIUM_RATE_MIN_GAMES,
    metric: (row) =>
      row.gamesPlayed > 0 ? (row.pollosAgainst / row.gamesPlayed) * 100 : null,
    format: (_value, row) =>
      formatPerGameRatePct(row.pollosAgainst, row.gamesPlayed),
  },
  {
    id: "zapatosEaten",
    kind: "shame",
    minGames: PODIUM_COUNT_MIN_GAMES,
    metric: (row) => row.zapatosAgainst,
    format: (value) => String(value),
  },
];

type StyleCategoryDef = {
  id: PodiumCategoryId;
  kind: PodiumKind;
  direction: "higher" | "lower";
  metric: (row: StylePodiumRow) => number | null;
};

const STYLE_CATEGORIES: StyleCategoryDef[] = [
  {
    id: "maxDataFor",
    kind: "style",
    direction: "higher",
    metric: (row) => row.maxDataFor,
  },
  {
    id: "minDataFor",
    kind: "style",
    direction: "lower",
    metric: (row) => row.minDataFor,
  },
  {
    id: "minDatasToWin",
    kind: "style",
    direction: "lower",
    metric: (row) => row.minDatasToWin,
  },
  {
    id: "maxDatasToWin",
    kind: "style",
    direction: "higher",
    metric: (row) => row.maxDatasToWin,
  },
  {
    id: "maxDatasToLose",
    kind: "style",
    direction: "higher",
    metric: (row) => row.maxDatasToLose,
  },
  {
    id: "maxDataAgainst",
    kind: "style",
    direction: "higher",
    metric: (row) => row.maxDataAgainst,
  },
];

export const PODIUM_CATEGORY_IDS: PodiumCategoryId[] = [
  ...CATEGORIES.filter((c) => c.kind === "glory").map((c) => c.id),
  ...STYLE_CATEGORIES.map((c) => c.id),
  ...CATEGORIES.filter((c) => c.kind === "grind").map((c) => c.id),
  ...CATEGORIES.filter((c) => c.kind === "shame").map((c) => c.id),
];

type Rankable = {
  playerId: number;
  playerName: string;
  gamesPlayed: number;
};

function compareCandidates(
  a: { row: Rankable; value: number },
  b: { row: Rankable; value: number },
  direction: "higher" | "lower" = "higher"
): number {
  if (b.value !== a.value) {
    return direction === "higher" ? b.value - a.value : a.value - b.value;
  }
  if (b.row.gamesPlayed !== a.row.gamesPlayed) {
    return b.row.gamesPlayed - a.row.gamesPlayed;
  }
  return a.row.playerName.localeCompare(b.row.playerName);
}

function toPlace(
  candidate: { row: Rankable; value: number },
  format: (value: number) => string
): PodiumPlace {
  return {
    playerId: candidate.row.playerId,
    playerName: candidate.row.playerName,
    value: candidate.value,
    display: format(candidate.value),
  };
}

function emptyResult(
  id: PodiumCategoryId,
  kind: PodiumKind
): PodiumCategoryResult {
  return {
    id,
    kind,
    first: [],
    second: [],
    allTied: false,
    allTiedDisplay: null,
  };
}

function placesFromCandidates<T extends Rankable>(
  id: PodiumCategoryId,
  kind: PodiumKind,
  candidates: { row: T; value: number }[],
  format: (candidate: { row: T; value: number }) => string,
  /** Players who posted a metric, before extra eligibility. Whole-table snark uses this. */
  poolSize: number = candidates.length
): PodiumCategoryResult {
  if (candidates.length === 0) return emptyResult(id, kind);

  const top = candidates[0]!.value;
  const firsts = candidates.filter((c) => c.value === top);
  if (firsts.length === poolSize && poolSize >= 2) {
    return {
      id,
      kind,
      first: [],
      second: [],
      allTied: true,
      allTiedDisplay: format(candidates[0]!),
    };
  }

  const first = [...firsts]
    .sort((a, b) => a.row.playerName.localeCompare(b.row.playerName))
    .map((c) => toPlace(c, () => format(c)));
  const second =
    firsts.length === 1 && candidates[1]
      ? [toPlace(candidates[1], () => format(candidates[1]!))]
      : [];

  return {
    id,
    kind,
    first,
    second,
    allTied: false,
    allTiedDisplay: null,
  };
}

function rankCategory(
  rows: PodiumPlayerRow[],
  def: CategoryDef
): PodiumCategoryResult {
  const measured = rows
    .filter((row) => row.gamesPlayed >= def.minGames)
    .map((row) => {
      const value = def.metric(row);
      if (value == null || Number.isNaN(value)) return null;
      return { row, value };
    })
    .filter((c): c is { row: PodiumPlayerRow; value: number } => c != null);
  const candidates = measured
    .filter((c) => (def.eligible ? def.eligible(c.row) : true))
    .sort((a, b) => compareCandidates(a, b, def.direction ?? "higher"));

  return placesFromCandidates(
    def.id,
    def.kind,
    candidates,
    (c) => def.format(c.value, c.row),
    measured.length
  );
}

function rankStyleCategory(
  rows: StylePodiumRow[],
  def: StyleCategoryDef
): PodiumCategoryResult {
  const candidates = rows
    .map((row) => {
      const value = def.metric(row);
      if (value == null || Number.isNaN(value)) return null;
      return { row, value };
    })
    .filter((c): c is { row: StylePodiumRow; value: number } => c != null)
    .sort((a, b) => compareCandidates(a, b, def.direction));

  return placesFromCandidates(def.id, def.kind, candidates, (c) =>
    String(c.value)
  );
}

/** Build all podium categories for a mode's leaderboard + style extrema. */
export function buildPodium(
  rows: PodiumPlayerRow[],
  styleRows: StylePodiumRow[] = []
): PodiumCategoryResult[] {
  return [
    ...CATEGORIES.filter((def) => def.kind === "glory").map((def) =>
      rankCategory(rows, def)
    ),
    ...STYLE_CATEGORIES.map((def) => rankStyleCategory(styleRows, def)),
    ...CATEGORIES.filter((def) => def.kind === "grind").map((def) =>
      rankCategory(rows, def)
    ),
    ...CATEGORIES.filter((def) => def.kind === "shame").map((def) =>
      rankCategory(rows, def)
    ),
  ];
}
