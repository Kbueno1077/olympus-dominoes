/** README + unit-test fixtures from the Jose lab brief. Do not ship as product data. */

export type LabKind = "csv" | "mock";

export type LabPlayer = {
  id: string;
  name: string;
  W: number;
  L: number;
  G: number;
  dDW: number;
  dPF: number;
  dPo: number;
  dZap: number;
  pin: boolean;
  dataset: "readme" | "test";
  kind: LabKind;
  HF?: number;
  HA?: number;
  PF?: number;
  PA?: number;
  PoF?: number;
  PoA?: number;
  ZapF?: number;
  ZapA?: number;
};

export function isCsvPlayer(p: LabPlayer): boolean {
  return p.kind === "csv";
}

function kindFromName(name: string): LabKind {
  return name.includes("(CSV") ? "csv" : "mock";
}

/** Chart / table label: Cesar, not “Cesar (CSV)”. Keep test suffixes that distinguish people. */
export function personName(p: LabPlayer): string {
  if (p.dataset === "readme") {
    return p.name.replace(" (CSV)", "");
  }
  return p.name.replace(" (CSV stocks)", "").replace(" (test)", " · test");
}

type ReadmeRow = {
  id: string;
  name: string;
  W: number;
  L: number;
  G: number;
  dDW: number;
  dPF: number;
  dPo: number;
  dZap: number;
  pin: boolean;
  HF?: number;
  HA?: number;
  PF?: number;
  PA?: number;
  PoF?: number;
  PoA?: number;
  ZapF?: number;
  ZapA?: number;
};

type TestRow = {
  id: string;
  name: string;
  G: number;
  W: number;
  L: number;
  HF: number;
  HA: number;
  PF: number;
  PA: number;
  PoF: number;
  PoA: number;
  ZapF: number;
  ZapA: number;
  pin: boolean;
};

const README_ROWS: ReadmeRow[] = [
  { id: "pedro", name: "Pedro", W: 24, L: 6, G: 30, dDW: 56, dPF: 2010, dPo: 3, dZap: 1, pin: true },
  { id: "dominant-pair", name: "DominantPair", W: 18, L: 7, G: 25, dDW: 39, dPF: 1375, dPo: 3, dZap: 2, pin: false },
  // PanteonV2.csv · 2 vs 2 · 55 · Cesar+Ariel vs Randy (Eliecer 10, Guillermo 65)
  { id: "cesar", name: "Cesar (CSV)", W: 41, L: 34, G: 75, dDW: 11, dPF: 601, dPo: 3, dZap: -2, pin: true, HF: 239, HA: 228, PF: 9317, PA: 8716, PoF: 9, PoA: 6, ZapF: 6, ZapA: 8 },
  { id: "ariel", name: "Ariel (CSV)", W: 41, L: 34, G: 75, dDW: 11, dPF: 601, dPo: 3, dZap: -2, pin: false, HF: 239, HA: 228, PF: 9317, PA: 8716, PoF: 9, PoA: 6, ZapF: 6, ZapA: 8 },
  { id: "ana", name: "Ana", W: 18, L: 12, G: 30, dDW: 9, dPF: 330, dPo: 1, dZap: 0, pin: true },
  { id: "hot-weekend", name: "HotWeekend", W: 6, L: 2, G: 8, dDW: 13, dPF: 490, dPo: 1, dZap: 1, pin: true },
  { id: "solid40", name: "Solid40", W: 22, L: 18, G: 40, dDW: 10, dPF: 380, dPo: 1, dZap: 0, pin: true },
  { id: "maya50", name: "Maya50", W: 27, L: 23, G: 50, dDW: 10, dPF: 380, dPo: 1, dZap: 0, pin: false },
  { id: "grinder100", name: "Grinder100", W: 52, L: 48, G: 100, dDW: 11, dPF: 380, dPo: 1, dZap: 0, pin: true },
  { id: "ugly-plus4", name: "Ugly+4", W: 17, L: 13, G: 30, dDW: -17, dPF: -600, dPo: -2, dZap: -1, pin: true },
  { id: "luis", name: "Luis", W: 16, L: 14, G: 30, dDW: 8, dPF: 260, dPo: 2, dZap: 2, pin: true },
  { id: "eliecer", name: "Eliecer (CSV)", W: 6, L: 4, G: 10, dDW: 7, dPF: 268, dPo: -1, dZap: 1, pin: false },
  { id: "omar80loud", name: "Omar80loud", W: 41, L: 39, G: 80, dDW: 13, dPF: 455, dPo: 3, dZap: 2, pin: false },
  { id: "omar80", name: "Omar80", W: 41, L: 39, G: 80, dDW: 5, dPF: 190, dPo: 1, dZap: 0, pin: false },
  { id: "quiet-plus2", name: "Quiet+2", W: 16, L: 14, G: 30, dDW: 1, dPF: 40, dPo: 0, dZap: 0, pin: false },
  { id: "near-even", name: "NearEven", W: 23, L: 22, G: 45, dDW: 2, dPF: 95, dPo: 0, dZap: 0, pin: false },
  { id: "even-blow", name: "EvenBlow", W: 15, L: 15, G: 30, dDW: 0, dPF: 0, dPo: 1, dZap: 1, pin: true },
  { id: "comeback", name: "Comeback", W: 16, L: 19, G: 35, dDW: 12, dPF: 445, dPo: -1, dZap: 0, pin: false },
  { id: "randy", name: "Randy (CSV)", W: 34, L: 41, G: 75, dDW: -11, dPF: -601, dPo: -3, dZap: 2, pin: true, HF: 228, HA: 239, PF: 8716, PA: 9317, PoF: 6, PoA: 9, ZapF: 8, ZapA: 6 },
  { id: "guillermo", name: "Guillermo (CSV)", W: 28, L: 37, G: 65, dDW: -18, dPF: -869, dPo: -2, dZap: 1, pin: false, HF: 195, HA: 213, PF: 7508, PA: 8377, PoF: 5, PoA: 7, ZapF: 7, ZapA: 6 },
  // Valhalla.csv · 2 vs 2 · 55 · 21 games (Kevin+Jose vs Raulito+Rudelys)
  { id: "kevin", name: "Kevin (CSV)", W: 11, L: 10, G: 21, dDW: 9, dPF: 388, dPo: 5, dZap: -1, pin: true, HF: 70, HA: 61, PF: 2765, PA: 2377, PoF: 5, PoA: 0, ZapF: 1, ZapA: 2 },
  { id: "jose", name: "Jose (CSV)", W: 11, L: 10, G: 21, dDW: 9, dPF: 388, dPo: 5, dZap: -1, pin: false, HF: 70, HA: 61, PF: 2765, PA: 2377, PoF: 5, PoA: 0, ZapF: 1, ZapA: 2 },
  { id: "raulito", name: "Raulito (CSV)", W: 10, L: 11, G: 21, dDW: -9, dPF: -388, dPo: -5, dZap: 1, pin: false, HF: 61, HA: 70, PF: 2377, PA: 2765, PoF: 0, PoA: 5, ZapF: 2, ZapA: 1 },
  { id: "rudelys", name: "Rudelys (CSV)", W: 10, L: 11, G: 21, dDW: -9, dPF: -388, dPo: -5, dZap: 1, pin: false, HF: 61, HA: 70, PF: 2377, PA: 2765, PoF: 0, PoA: 5, ZapF: 2, ZapA: 1 },
];

const TEST_ROWS: TestRow[] = [
  { id: "test-pedro", name: "Pedro (test)", G: 30, W: 24, L: 6, HF: 106, HA: 94, PF: 4500, PA: 4380, PoF: 2, PoA: 0, ZapF: 1, ZapA: 0, pin: false },
  { id: "test-cesar", name: "Cesar (CSV stocks)", G: 29, W: 17, L: 12, HF: 94, HA: 75, PF: 3573, PA: 2964, PoF: 7, PoA: 3, ZapF: 2, ZapA: 3, pin: true },
  { id: "test-hot", name: "HotWeekend (test)", G: 8, W: 6, L: 2, HF: 41, HA: 28, PF: 1290, PA: 800, PoF: 1, PoA: 0, ZapF: 1, ZapA: 0, pin: true },
  { id: "test-ana", name: "Ana (test)", G: 30, W: 18, L: 12, HF: 100, HA: 92, PF: 4000, PA: 4060, PoF: 1, PoA: 0, ZapF: 0, ZapA: 0, pin: false },
  { id: "test-solid40", name: "Solid40 (test)", G: 40, W: 22, L: 18, HF: 105, HA: 95, PF: 4600, PA: 4300, PoF: 3, PoA: 2, ZapF: 2, ZapA: 1, pin: false },
  { id: "test-luis-loud", name: "Luis loud (test)", G: 30, W: 16, L: 14, HF: 120, HA: 80, PF: 5000, PA: 4100, PoF: 4, PoA: 0, ZapF: 5, ZapA: 0, pin: true },
  { id: "test-eliecer", name: "Short+2 (test)", G: 10, W: 6, L: 4, HF: 33, HA: 26, PF: 1208, PA: 940, PoF: 1, PoA: 2, ZapF: 1, ZapA: 0, pin: false },
  { id: "test-ugly", name: "Ugly+4 (test)", G: 30, W: 17, L: 13, HF: 70, HA: 95, PF: 3800, PA: 4500, PoF: 0, PoA: 3, ZapF: 0, ZapA: 2, pin: true },
  { id: "test-even-blow", name: "EvenBlow loud (test)", G: 30, W: 15, L: 15, HF: 120, HA: 80, PF: 5000, PA: 4100, PoF: 4, PoA: 0, ZapF: 5, ZapA: 0, pin: true },
  { id: "test-quiet2", name: "Quiet+2 (test)", G: 30, W: 16, L: 14, HF: 90, HA: 88, PF: 4000, PA: 3980, PoF: 0, PoA: 0, ZapF: 0, ZapA: 0, pin: false },
  { id: "test-h2h-a", name: "H2H A", G: 20, W: 8, L: 12, HF: 52, HA: 66, PF: 1880, PA: 2416, PoF: 4, PoA: 2, ZapF: 0, ZapA: 2, pin: false },
  { id: "test-h2h-b", name: "H2H B", G: 20, W: 12, L: 8, HF: 66, HA: 52, PF: 2416, PA: 1880, PoF: 2, PoA: 4, ZapF: 2, ZapA: 0, pin: false },
];

export const README_PLAYERS: LabPlayer[] = README_ROWS.map((row) => ({
  ...row,
  dataset: "readme",
  kind: kindFromName(row.name),
}));

export const TEST_PLAYERS: LabPlayer[] = TEST_ROWS.map((row) => ({
  id: row.id,
  name: row.name,
  W: row.W,
  L: row.L,
  G: row.G,
  dDW: row.HF - row.HA,
  dPF: row.PF - row.PA,
  dPo: row.PoF - row.PoA,
  dZap: row.ZapF - row.ZapA,
  pin: row.pin,
  dataset: "test",
  kind: kindFromName(row.name),
  HF: row.HF,
  HA: row.HA,
  PF: row.PF,
  PA: row.PA,
  PoF: row.PoF,
  PoA: row.PoA,
  ZapF: row.ZapF,
  ZapA: row.ZapA,
}));

export const DEFAULT_CSV_PINS = [
  "kevin",
  "raulito",
  "cesar",
  "eliecer",
  "randy",
  "guillermo",
] as const;

export const DEFAULT_MOCK_PINS = [
  "pedro",
  "hot-weekend",
  "ugly-plus4",
  "luis",
  "solid40",
] as const;
