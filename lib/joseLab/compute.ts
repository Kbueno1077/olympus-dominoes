import type { LabPlayer } from "./data";

export type FormulaId = "A" | "B" | "C" | "K2";

export type WeightsA = {
  leadCap: number;
  leadScale: number;
  leadMix: number;
  wDatas: number;
  wPoints: number;
  wPollos: number;
  wZapatos: number;
  floor: number;
};

export type WeightsB = {
  kGames: number;
  wDatas: number;
  wPoints: number;
  wPollos: number;
  wZapatos: number;
  floor: number;
};

export type SharedWeights = {
  wDatas: number;
  wPoints: number;
  wPollos: number;
  wZapatos: number;
  floor: number;
};

export const DEFAULT_A: WeightsA = {
  leadCap: 20,
  leadScale: 8,
  leadMix: 1.7,
  wDatas: 3,
  wPoints: 0.1,
  wPollos: 10,
  wZapatos: 4,
  floor: 25,
};

export const DEFAULT_B: WeightsB = {
  kGames: 3,
  // Same extras as the shipped product formula.
  // At G=25, 1 ΔG (+3) = 12 datas, 500 pts, 5 pollos, 12.5 zapatos.
  // Pollos stay 2.5× zapatos (15 / 6).
  wDatas: 6.25,
  wPoints: 0.15,
  wPollos: 15,
  wZapatos: 6,
  floor: 25,
};

/** Playground: no /G. kGames scales ΔG, pollos, and zapatos. Datas/points stay raw. */
export type WeightsK2 = {
  kGames: number;
  /** Datas that add +1 on R. */
  dwPerGame: number;
  /** Points that add +1 on R. */
  pfPerGame: number;
  /** Pollos that equal one win (same R as kGames × ΔG). */
  pollosPerGame: number;
  /** One zapato as a fraction of one pollo (2/5). */
  zapPerPollo: number;
};

export const DEFAULT_K2: WeightsK2 = {
  kGames: 3,
  dwPerGame: 4,
  pfPerGame: 165,
  pollosPerGame: 5,
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

function denomFor(
  G: number,
  floor: number,
  denomCap: number | null
): number {
  const floorOnly = Math.max(G, floor);
  if (denomCap == null) return floorOnly;
  return Math.min(floorOnly, denomCap);
}

function secondaryParts(
  p: LabPlayer,
  w: SharedWeights,
  denom: number
): Pick<Breakdown, "datas" | "pts" | "po" | "zap"> {
  return {
    datas: (w.wDatas * p.dDW) / denom,
    pts: (w.wPoints * p.dPF) / denom,
    po: (w.wPollos * p.dPo) / denom,
    zap: (w.wZapatos * p.dZap) / denom,
  };
}

export function leadTermA(n: number, w: WeightsA): number {
  if (w.leadScale === 0) return 0;
  return w.leadMix * w.leadCap * Math.tanh(n / w.leadScale);
}

export function leadTermB(n: number, w: { kGames: number }): number {
  return w.kGames * n;
}

export function computeA(
  p: LabPlayer,
  w: WeightsA,
  denomCap: number | null = null
): Breakdown | null {
  if (p.G <= 0) return null;
  const n = p.W - p.L;
  const denom = denomFor(p.G, w.floor, denomCap);
  const games = leadTermA(n, w);
  const seconds = secondaryParts(p, w, denom);
  const r = games + seconds.datas + seconds.pts + seconds.po + seconds.zap;
  return { n, denom, sqrt: 0, games, ...seconds, r, seconds: r - games };
}

export function computeB(
  p: LabPlayer,
  w: WeightsB,
  denomCap: number | null = null
): Breakdown | null {
  if (p.G <= 0) return null;
  const n = p.W - p.L;
  const denom = denomFor(p.G, w.floor, denomCap);
  const games = leadTermB(n, w);
  const seconds = secondaryParts(p, w, denom);
  const r = games + seconds.datas + seconds.pts + seconds.po + seconds.zap;
  return { n, denom, sqrt: 0, games, ...seconds, r, seconds: r - games };
}

/** 4 datas / 165 pts = +1 R. 5 pollos = 1 win. Zapato = 2/5 of a pollo. */
export function k2ExtraWeights(
  w: WeightsK2
): Pick<SharedWeights, "wDatas" | "wPoints" | "wPollos" | "wZapatos"> {
  const unit = (count: number) => (count === 0 ? 0 : 1 / count);
  const wPollos = w.pollosPerGame === 0 ? 0 : w.kGames / w.pollosPerGame;
  return {
    wDatas: unit(w.dwPerGame),
    wPoints: unit(w.pfPerGame),
    wPollos,
    wZapatos: wPollos * w.zapPerPollo,
  };
}

function k2Seconds(p: LabPlayer, w: WeightsK2) {
  const weights = k2ExtraWeights(w);
  return {
    datas: weights.wDatas * p.dDW,
    pts: weights.wPoints * p.dPF,
    po: weights.wPollos * p.dPo,
    zap: weights.wZapatos * p.dZap,
  };
}

/**
 * K2: no /G. kGames scales ΔG, pollos, and zapatos so +5 pollos = +1 game.
 * Datas and points stay raw (ΔDW/4, ΔPF/165). A zapato is 2/5 of a pollo.
 */
export function computeK2(p: LabPlayer, w: WeightsK2): Breakdown | null {
  if (p.G <= 0) return null;
  const n = p.W - p.L;
  const games = leadTermB(n, w);
  const seconds = k2Seconds(p, w);
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

/** Effective extra weights so Worth tables can reuse A/B exchange math. */
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
  weightsA: WeightsA,
  weightsB: WeightsB,
  weightsC: WeightsC,
  weightsK2: WeightsK2,
  denomCap: number | null
): Breakdown | null {
  switch (formula) {
    case "A":
      return computeA(p, weightsA, denomCap);
    case "B":
      return computeB(p, weightsB, denomCap);
    case "C":
      return computeC(p, weightsC);
    case "K2":
      return computeK2(p, weightsK2);
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

export function extrasAtG(
  p: LabPlayer,
  w: SharedWeights,
  G: number,
  denomCap: number | null
): number {
  if (G <= 0) return 0;
  const denom = denomFor(G, w.floor, denomCap);
  const s = secondaryParts(p, w, denom);
  return s.datas + s.pts + s.po + s.zap;
}

export function volumeAtG(
  p: LabPlayer,
  formula: FormulaId,
  weightsA: WeightsA,
  weightsB: WeightsB,
  weightsC: WeightsC,
  weightsK2: WeightsK2,
  G: number,
  denomCap: number | null
): number {
  switch (formula) {
    case "A":
      return extrasAtG(p, weightsA, G, denomCap);
    case "B":
      return extrasAtG(p, weightsB, G, denomCap);
    case "K2": {
      const seconds = k2Seconds(p, weightsK2);
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

/**
 * How many extras equal +1 ΔG at the formula's own denom.
 * A/B use max(floor, floor) (= floor) unless a demo cap is on. C has no denom.
 */
export function gameExchange(
  formula: FormulaId,
  a: WeightsA,
  b: WeightsB,
  c: WeightsC,
  k2: WeightsK2,
  denomCap: number | null
): GameExchange {
  switch (formula) {
    case "A":
      return gameVsExtras(denomFor(a.floor, a.floor, denomCap), leadTermA(1, a), a);
    case "B":
      return gameVsExtras(denomFor(b.floor, b.floor, denomCap), leadTermB(1, b), b);
    case "K2":
      return gameVsExtras(1, leadTermB(1, k2), k2ExtraWeights(k2));
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

export type RuleTargetsB = {
  cesarR: number;
  cesarRTol: number;
  datasMix: number;
  datasMixTol: number;
};

export const DEFAULT_RULE_TARGETS_B: RuleTargetsB = {
  cesarR: 24.1,
  cesarRTol: 0.35,
  datasMix: 3,
  datasMixTol: 1.2,
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

function fmt(n: number): string {
  return n.toFixed(1);
}

export function runChecksA(
  readme: LabPlayer[],
  test: LabPlayer[],
  w: WeightsA,
  denomCap: number | null
): CheckResult[] {
  const cesar = computeA(byId(readme, "cesar"), w, denomCap)!;
  const hot = computeA(byId(readme, "hot-weekend"), w, denomCap)!;
  const solid = computeA(byId(readme, "solid40"), w, denomCap)!;
  const luis = computeA(byId(readme, "luis"), w, denomCap)!;
  const ugly = computeA(byId(readme, "ugly-plus4"), w, denomCap)!;
  const even = computeA(byId(readme, "even-blow"), w, denomCap)!;
  const evenTest = computeA(byId(test, "test-even-blow"), w, denomCap)!;
  const ranked = [...readme]
    .map((p) => ({ p, r: computeA(p, w, denomCap)?.r ?? Number.NEGATIVE_INFINITY }))
    .sort((a, b) => b.r - a.r);
  const pedroTop = ranked[0]?.p.id === "pedro";

  return [
    {
      id: "cesar-2nds-hot",
      title: "Volume beats a heater",
      rule: "Cesar's extras (datas/pts/pollos/zap) should outrank HotWeekend's. A short hot streak must not bury a real season.",
      live: `Cesar extras ${signedFmt(cesar.seconds)} vs HotWeekend ${signedFmt(hot.seconds)}`,
      pass: cesar.seconds > hot.seconds,
    },
    {
      id: "cesar-r-hot",
      title: "Cesar over HotWeekend",
      rule: "Full R should still rank Cesar above HotWeekend once lead and extras are added.",
      live: `Cesar R ${signedFmt(cesar.r)} vs HotWeekend ${signedFmt(hot.r)}`,
      pass: cesar.r > hot.r,
    },
    {
      id: "solid-luis",
      title: "Quiet volume over loud +2",
      rule: "Solid40 (many even-ish games) should beat Luis. Reliability should not lose to a small loud lead.",
      live: `Solid40 R ${signedFmt(solid.r)} vs Luis ${signedFmt(luis.r)}`,
      pass: solid.r > luis.r,
    },
    {
      id: "ugly-even",
      title: "Ugly +4 beats 0-net",
      rule: "A real +4 with ugly extras should still beat EvenBlow (README or the loud test clone).",
      live: `Ugly+4 ${signedFmt(ugly.r)} · EvenBlow ${signedFmt(even.r)} · loud test ${signedFmt(evenTest.r)}`,
      pass: ugly.r > even.r || ugly.r > evenTest.r,
    },
    {
      id: "pedro-elite",
      title: "Pedro stays #1",
      rule: "On a +18 lead with huge extras, Pedro should sit at the top of the README table.",
      live: ranked[0]
        ? `Now #1 is ${ranked[0].p.name.replace(" (CSV)", "")} at ${signedFmt(ranked[0].r)}`
        : "—",
      pass: pedroTop,
    },
  ];
}

export function runChecksB(
  readme: LabPlayer[],
  test: LabPlayer[],
  w: WeightsB,
  denomCap: number | null,
  targets: RuleTargetsB = DEFAULT_RULE_TARGETS_B
): CheckResult[] {
  const cesar = computeB(byId(readme, "cesar"), w, denomCap)!;
  const luis = computeB(byId(readme, "luis"), w, denomCap)!;
  const ugly = computeB(byId(readme, "ugly-plus4"), w, denomCap)!;
  const uglyTest = computeB(byId(test, "test-ugly"), w, denomCap)!;
  const evenTest = computeB(byId(test, "test-even-blow"), w, denomCap)!;
  const h2hA = computeB(byId(test, "test-h2h-a"), w, denomCap)!;
  const h2hB = computeB(byId(test, "test-h2h-b"), w, denomCap)!;
  const wantDatas = targets.datasMix * cesar.datas;
  const mixOff = Math.abs(cesar.games - wantDatas);

  return [
    {
      id: "cesar-anchor",
      title: "Cesar calibration",
      rule: "CSV Cesar is the north star. At stock season he should land near the target R — bumping G/W/nets will move him, and the rule follows live.",
      live: `Cesar R ${signedFmt(cesar.r)} · want ${signedFmt(targets.cesarR)} ± ${targets.cesarRTol} · off ${fmt(Math.abs(cesar.r - targets.cesarR))}`,
      pass: Math.abs(cesar.r - targets.cesarR) < targets.cesarRTol,
    },
    {
      id: "cesar-weights",
      title: "Lead vs datas mix",
      rule: "Cesar's lead term (k·ΔG) should sit about datasMix × his datas term, and datas should beat points. If G grows and extras dilute, this is the first thing to break.",
      live: `lead ${signedFmt(cesar.games)} · ${targets.datasMix}×datas ${signedFmt(wantDatas)} (off ${fmt(mixOff)}) · datas ${signedFmt(cesar.datas)} vs pts ${signedFmt(cesar.pts)}`,
      pass: mixOff < targets.datasMixTol && cesar.datas > cesar.pts,
    },
    {
      id: "ugly-luis",
      title: "Ugly +4 can lose to Luis",
      rule: "Ugly extras on a +4 should not automatically beat a quieter +2. Luis is allowed to rank above Ugly+4.",
      live: `Ugly+4 ${signedFmt(ugly.r)} vs Luis ${signedFmt(luis.r)}`,
      pass: ugly.r < luis.r,
    },
    {
      id: "ugly-even-test",
      title: "Loud 0-net can beat ugly +4",
      rule: "On the test fixtures, loud EvenBlow should outrank Ugly+4. Volume of extras at 0-net is allowed to win.",
      live: `Ugly+4 test ${signedFmt(uglyTest.r)} vs loud EvenBlow ${signedFmt(evenTest.r)}`,
      pass: uglyTest.r < evenTest.r,
    },
    {
      id: "no-cap",
      title: "No denom cap",
      rule: "Reliability is max(G, floor), not a ceiling on denom. A cap lets point stocks eat the lead as G grows.",
      live: denomCap == null ? "floor only · cap off" : `cap is on at ${denomCap}`,
      pass: denomCap == null,
    },
    {
      id: "h2h-mirror",
      title: "Head-to-head mirrors",
      rule: "Two people who only played each other should sum to ~0. B is odd in the extras, so A = −B.",
      live: `H2H A ${signedFmt(h2hA.r)} + H2H B ${signedFmt(h2hB.r)} = ${signedFmt(h2hA.r + h2hB.r)}`,
      pass: Math.abs(h2hA.r + h2hB.r) < 1e-9,
    },
  ];
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
  "cesar-2nds-hot": ["cesar", "hot-weekend"],
  "cesar-r-hot": ["cesar", "hot-weekend"],
  "solid-luis": ["solid40", "luis"],
  "ugly-even": ["ugly-plus4", "even-blow"],
  "pedro-elite": ["pedro"],
  "cesar-anchor": ["cesar"],
  "cesar-weights": ["cesar"],
  "ugly-luis": ["ugly-plus4", "luis"],
  "ugly-even-test": ["test-ugly", "test-even-blow"],
  "no-cap": [],
  "h2h-mirror": ["test-h2h-a", "test-h2h-b"],
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

export function recordTGP(p: LabPlayer): string {
  return `${p.G}–${p.W}–${p.L}`;
}

export function equationLines(
  formula: FormulaId,
  a: WeightsA,
  b: WeightsB,
  c: WeightsC,
  k2: WeightsK2,
  denomCap: number | null
): string[] {
  const cap = denomCap == null ? "" : `, cap ${denomCap}`;
  const extras = (w: SharedWeights) =>
    `(${w.wDatas}·ΔDW + ${w.wPoints}·ΔPF + ${w.wPollos}·ΔPo + ${w.wZapatos}·ΔZap) / max(G, ${w.floor}${cap})`;
  switch (formula) {
    case "A":
      return [
        `R = ${a.leadMix} × ${a.leadCap} × tanh(ΔG / ${a.leadScale})`,
        `+ ${extras(a)}`,
      ];
    case "B":
      return [`R = ${b.kGames} × ΔG`, `+ ${extras(b)}`];
    case "K2":
      return [
        `R = ${k2.kGames} × ΔG`,
        `+ ΔDW / ${k2.dwPerGame} + ΔPF / ${k2.pfPerGame}`,
        `+ ${k2.kGames} × (ΔPo / ${k2.pollosPerGame} + ${k2.zapPerPollo} × ΔZap / ${k2.pollosPerGame})`,
      ];
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
