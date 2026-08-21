import type { LabPlayer } from "./data";

export type FormulaId = "K" | "C" | "KJ";

export type SharedWeights = {
  wDatas: number;
  wPoints: number;
  wPollos: number;
  wZapatos: number;
};

/** Playground: no /G. Each term is multiplier × (delta / divisor). */
export type WeightsK = {
  /** In front of ΔG. */
  kGames: number;
  /** In front of ΔDW / dwPerGame. */
  kDatas: number;
  /** In front of ΔPF / pfPerGame. */
  kPoints: number;
  /** In front of ΔPo / pollosPerGame. */
  kPollos: number;
  /** In front of (zapPerPollo × ΔZap / pollosPerGame). */
  kZapatos: number;
  /** Datas that sit in the ΔDW term. */
  dwPerGame: number;
  /** Points that sit in the ΔPF term. */
  pfPerGame: number;
  /** Pollos that sit in the ΔPo (and zapato) term. */
  pollosPerGame: number;
  /** One zapato as a fraction of one pollo. */
  zapPerPollo: number;
};

export const DEFAULT_K: WeightsK = {
  kGames: 3,
  kDatas: 1,
  kPoints: 1,
  kPollos: 3,
  kZapatos: 3,
  dwPerGame: 4,
  pfPerGame: 165,
  pollosPerGame: 5,
  zapPerPollo: 0.4,
};

export const DEFAULT_KJ: WeightsK = {
  kGames: 2.5,
  kDatas: 1,
  kPoints: 1,
  kPollos: 2.5,
  kZapatos: 2.5,
  dwPerGame: 3.5,
  pfPerGame: 150,
  pollosPerGame: 4,
  zapPerPollo: 0.4,
};

export type WeightsC = {
  kSqrt: number;
  kGames: number;
  /** Typical datas to take a game. F += ΔDW / dwPerGame. */
  dwPerGame: number;
  /** Typical points in a game. F += ΔPF / pfPerGame. */
  pfPerGame: number;
  wPollos: number;
  wZapatos: number;
};

export const DEFAULT_C: WeightsC = {
  kSqrt: 1,
  kGames: 1,
  dwPerGame: 5,
  pfPerGame: 160,
  wPollos: 1,
  wZapatos: 0.4,
};

export type Breakdown = {
  n: number;
  denom: number;
  sqrt: number;
  games: number;
  datas: number;
  pts: number;
  po: number;
  zap: number;
  r: number;
  seconds: number;
};

export function leadTermB(n: number, w: { kGames: number }): number {
  return w.kGames * n;
}

/** Each extra is multiplier × delta / divisor (no /G). */
export function kExtraWeights(
  w: WeightsK
): Pick<SharedWeights, "wDatas" | "wPoints" | "wPollos" | "wZapatos"> {
  const unit = (k: number, div: number) => (div === 0 ? 0 : k / div);
  return {
    wDatas: unit(w.kDatas, w.dwPerGame),
    wPoints: unit(w.kPoints, w.pfPerGame),
    wPollos: unit(w.kPollos, w.pollosPerGame),
    wZapatos: unit(w.kZapatos * w.zapPerPollo, w.pollosPerGame),
  };
}

function kSeconds(p: LabPlayer, w: WeightsK) {
  const weights = kExtraWeights(w);
  return {
    datas: weights.wDatas * p.dDW,
    pts: weights.wPoints * p.dPF,
    po: weights.wPollos * p.dPo,
    zap: weights.wZapatos * p.dZap,
  };
}

/**
 * K / KJ: no /G. Each section is its own multiplier times (delta / divisor).
 */
export function computeK(p: LabPlayer, w: WeightsK): Breakdown | null {
  if (p.G <= 0) return null;
  const n = p.W - p.L;
  const games = leadTermB(n, w);
  const seconds = kSeconds(p, w);
  const r = games + seconds.datas + seconds.pts + seconds.po + seconds.zap;
  return { n, denom: 1, sqrt: 0, games, ...seconds, r, seconds: r - games };
}

export function leadTermC(n: number, w: WeightsC): number {
  return w.kGames * n;
}

function ogDatasPts(
  p: LabPlayer,
  w: { dwPerGame: number; pfPerGame: number }
): { datas: number; pts: number } {
  return {
    datas: w.dwPerGame === 0 ? 0 : p.dDW / w.dwPerGame,
    pts: w.pfPerGame === 0 ? 0 : p.dPF / w.pfPerGame,
  };
}

/** Effective extra weights so Worth tables can reuse extra-exchange math. */
export function ogExtraWeights(
  c: {
    dwPerGame: number;
    pfPerGame: number;
    wPollos: number;
    wZapatos: number;
  }
): Pick<SharedWeights, "wDatas" | "wPoints" | "wPollos" | "wZapatos"> {
  return {
    wDatas: c.dwPerGame === 0 ? 0 : 1 / c.dwPerGame,
    wPoints: c.pfPerGame === 0 ? 0 : 1 / c.pfPerGame,
    wPollos: c.wPollos,
    wZapatos: c.wZapatos,
  };
}

export function computeC(p: LabPlayer, w: WeightsC): Breakdown | null {
  if (p.G <= 0) return null;
  const n = p.W - p.L;
  const sqrt = w.kSqrt * Math.sqrt(p.G / 2);
  const games = leadTermC(n, w);
  const { datas, pts } = ogDatasPts(p, w);
  const po = w.wPollos * p.dPo;
  const zap = w.wZapatos * p.dZap;
  const r = sqrt + games + datas + pts + po + zap;
  return {
    n,
    denom: 1,
    sqrt,
    games,
    datas,
    pts,
    po,
    zap,
    r,
    seconds: r - games - sqrt,
  };
}

export function computePlayer(
  p: LabPlayer,
  formula: FormulaId,
  weightsK: WeightsK,
  weightsC: WeightsC,
  weightsKJ: WeightsK
): Breakdown | null {
  switch (formula) {
    case "K":
      return computeK(p, weightsK);
    case "C":
      return computeC(p, weightsC);
    case "KJ":
      return computeK(p, weightsKJ);
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

export function volumeAtG(
  p: LabPlayer,
  formula: FormulaId,
  weightsK: WeightsK,
  weightsC: WeightsC,
  weightsKJ: WeightsK,
  G: number
): number {
  switch (formula) {
    case "K": {
      const seconds = kSeconds(p, weightsK);
      return seconds.datas + seconds.pts + seconds.po + seconds.zap;
    }
    case "KJ": {
      const seconds = kSeconds(p, weightsKJ);
      return seconds.datas + seconds.pts + seconds.po + seconds.zap;
    }
    case "C": {
      if (G <= 0) return 0;
      const n = p.W - p.L;
      const { datas, pts } = ogDatasPts(p, weightsC);
      return (
        weightsC.kSqrt * Math.sqrt(G / 2) +
        weightsC.kGames * n +
        datas +
        pts +
        weightsC.wPollos * p.dPo +
        weightsC.wZapatos * p.dZap
      );
    }
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function ratio(a: number, b: number): number | null {
  if (b === 0) return null;
  return a / b;
}

export type ExtraExchange = {
  poPerZap: number | null;
  poPerDw: number | null;
  dwPerZap: number | null;
  pfPerDw: number | null;
  pfPerPo: number | null;
  pfPerZap: number | null;
};

/** Weight ratios among extras — same at every G, because they share a denom. */
export function extraExchange(
  w: Pick<SharedWeights, "wDatas" | "wPoints" | "wPollos" | "wZapatos">
): ExtraExchange {
  return {
    poPerZap: ratio(w.wPollos, w.wZapatos),
    poPerDw: ratio(w.wPollos, w.wDatas),
    dwPerZap: ratio(w.wDatas, w.wZapatos),
    pfPerDw: ratio(w.wDatas, w.wPoints),
    pfPerPo: ratio(w.wPollos, w.wPoints),
    pfPerZap: ratio(w.wZapatos, w.wPoints),
  };
}

export type GameExchange = {
  denom: number;
  gameR: number;
  dwPerGame: number | null;
  pfPerGame: number | null;
  poPerGame: number | null;
  zapPerGame: number | null;
};

function gameVsExtras(
  denom: number,
  gameR: number,
  w: Pick<SharedWeights, "wDatas" | "wPoints" | "wPollos" | "wZapatos">
): GameExchange {
  const per = (weight: number) =>
    weight === 0 ? null : (gameR * denom) / weight;
  return {
    denom,
    gameR,
    dwPerGame: per(w.wDatas),
    pfPerGame: per(w.wPoints),
    poPerGame: per(w.wPollos),
    zapPerGame: per(w.wZapatos),
  };
}

/** How many extras equal +1 ΔG. Remaining formulas have no /G denom. */
export function gameExchange(
  formula: FormulaId,
  k: WeightsK,
  c: WeightsC,
  kj: WeightsK
): GameExchange {
  switch (formula) {
    case "K":
      return gameVsExtras(1, leadTermB(1, k), kExtraWeights(k));
    case "KJ":
      return gameVsExtras(1, leadTermB(1, kj), kExtraWeights(kj));
    case "C":
      return gameVsExtras(1, leadTermC(1, c), ogExtraWeights(c));
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

export type CheckResult = {
  id: string;
  title: string;
  rule: string;
  live: string;
  pass: boolean;
};

function signedFmt(n: number): string {
  const text = n.toFixed(1);
  return n > 0 ? `+${text}` : text;
}

function byId(players: LabPlayer[], id: string): LabPlayer {
  const found = players.find((p) => p.id === id);
  if (!found) {
    throw new Error(`Missing lab player ${id}`);
  }
  return found;
}

export function runChecksC(
  readme: LabPlayer[],
  test: LabPlayer[],
  w: WeightsC
): CheckResult[] {
  const cesar = computeC(byId(readme, "cesar"), w)!;
  const h2hA = computeC(byId(test, "test-h2h-a"), w)!;
  const h2hB = computeC(byId(test, "test-h2h-b"), w)!;
  return [
    {
      id: "c-points",
      title: "Datas and points are game-units",
      rule: "ΔDW/5 and ΔPF/160 put Cesar's datas and points terms in the same ballpark, not a thousand times apart.",
      live: `datas ${signedFmt(cesar.datas)} · pts ${signedFmt(cesar.pts)}`,
      pass: Math.abs(cesar.pts) > 0 && Math.abs(cesar.datas) > 0,
    },
    {
      id: "c-h2h",
      title: "H2H is not a mirror",
      rule: "√(G/2) is unsigned, so two people who only played each other do not sum to 0.",
      live: `H2H A ${signedFmt(h2hA.r)} + H2H B ${signedFmt(h2hB.r)} = ${signedFmt(h2hA.r + h2hB.r)}`,
      pass: Math.abs(h2hA.r + h2hB.r) > 1,
    },
  ];
}

const CHECK_FAIL_PLAYER_IDS: Record<string, readonly string[]> = {
  "c-points": ["cesar"],
  "c-h2h": ["test-h2h-a", "test-h2h-b"],
};

export function checkPlayerIds(id: string): readonly string[] {
  return CHECK_FAIL_PLAYER_IDS[id] ?? [];
}

export function failingPlayerIds(checks: CheckResult[]): Set<string> {
  const ids = new Set<string>();
  for (const check of checks) {
    if (check.pass) continue;
    for (const id of CHECK_FAIL_PLAYER_IDS[check.id] ?? []) {
      ids.add(id);
    }
  }
  return ids;
}

export type UnitRWorth = {
  unit: string;
  /** ΔR for +1 of this unit. */
  r: number | null;
};

/**
 * What +1 of each stat adds to R (and therefore what 1 R costs in that unit).
 */
export function rWorthPerUnit(
  formula: FormulaId,
  k: WeightsK,
  c: WeightsC,
  kj: WeightsK
): UnitRWorth[] {
  const extras = (
    gameR: number,
    w: Pick<SharedWeights, "wDatas" | "wPoints" | "wPollos" | "wZapatos">,
    denom: number
  ): UnitRWorth[] => [
    { unit: "ΔG", r: gameR },
    { unit: "ΔDW", r: denom === 0 ? null : w.wDatas / denom },
    { unit: "ΔPF", r: denom === 0 ? null : w.wPoints / denom },
    { unit: "ΔPo", r: denom === 0 ? null : w.wPollos / denom },
    { unit: "ΔZap", r: denom === 0 ? null : w.wZapatos / denom },
  ];
  switch (formula) {
    case "K":
      return extras(leadTermB(1, k), kExtraWeights(k), 1);
    case "KJ":
      return extras(leadTermB(1, kj), kExtraWeights(kj), 1);
    case "C":
      return extras(leadTermC(1, c), ogExtraWeights(c), 1);
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

export function equationLines(
  formula: FormulaId,
  k: WeightsK,
  c: WeightsC,
  kj: WeightsK
): string[] {
  const unitLines = (w: WeightsK) => [
    `R = ${w.kGames} × ΔG`,
    `  + ${w.kDatas} × ΔDW / ${w.dwPerGame}`,
    `  + ${w.kPoints} × ΔPF / ${w.pfPerGame}`,
    `  + ${w.kPollos} × ΔPo / ${w.pollosPerGame}`,
    `  + ${w.kZapatos} × (${w.zapPerPollo} × ΔZap / ${w.pollosPerGame})`,
  ];
  switch (formula) {
    case "K":
      return unitLines(k);
    case "KJ":
      return unitLines(kj);
    case "C":
      return [
        `R = ${c.kSqrt} × √(G / 2) + ${c.kGames} × ΔG`,
        `+ ΔDW / ${c.dwPerGame} + ΔPF / ${c.pfPerGame} + ${c.wPollos}·ΔPo + ${c.wZapatos}·ΔZap`,
      ];
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}
