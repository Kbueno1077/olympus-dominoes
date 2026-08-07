export const COMPARE_FILTERS_KEY = "olympus-web-compare-filters-v1";

export type CompareUiFilters = {
  datasetId: string;
  modeLabel: string | null;
  selectedIds: number[];
  teams: Record<number, 1 | 2 | null>;
  matchupMode: boolean;
};

const DEFAULT_FILTERS: Omit<CompareUiFilters, "datasetId"> = {
  modeLabel: null,
  selectedIds: [],
  teams: {},
  matchupMode: false,
};

/** In-memory cache so remounts within the tab restore instantly. */
let memory: CompareUiFilters | null = null;

function isTeamSide(value: unknown): value is 1 | 2 | null {
  return value === 1 || value === 2 || value === null;
}

function sanitizeIds(
  raw: unknown,
  validPlayerIds?: ReadonlySet<number>
): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const entry of raw) {
    const id = Number(entry);
    if (!Number.isFinite(id)) continue;
    if (validPlayerIds && !validPlayerIds.has(id)) continue;
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

function sanitizeTeams(
  raw: unknown,
  selectedIds: number[]
): Record<number, 1 | 2 | null> {
  if (!raw || typeof raw !== "object") return {};
  const allowed = new Set(selectedIds);
  const out: Record<number, 1 | 2 | null> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number(key);
    if (!Number.isFinite(id) || !allowed.has(id)) continue;
    if (!isTeamSide(value)) continue;
    out[id] = value;
  }
  return out;
}

export function defaultCompareUiFilters(datasetId: string): CompareUiFilters {
  return { datasetId, ...DEFAULT_FILTERS };
}

export function loadCompareUiFilters(
  datasetId: string,
  validPlayerIds?: ReadonlySet<number>,
  validModes?: readonly string[]
): CompareUiFilters {
  const fromMemory =
    memory && memory.datasetId === datasetId ? memory : null;

  const source = fromMemory ?? readStored(datasetId);
  if (!source) return defaultCompareUiFilters(datasetId);

  const selectedIds = sanitizeIds(source.selectedIds, validPlayerIds);
  let modeLabel =
    typeof source.modeLabel === "string" ? source.modeLabel : null;
  if (modeLabel && validModes && !validModes.includes(modeLabel)) {
    modeLabel = validModes[0] ?? null;
  }

  const next: CompareUiFilters = {
    datasetId,
    modeLabel,
    selectedIds,
    teams: sanitizeTeams(source.teams, selectedIds),
    matchupMode: Boolean(source.matchupMode),
  };
  memory = next;
  return next;
}

function readStored(datasetId: string): CompareUiFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COMPARE_FILTERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CompareUiFilters>;
    if (parsed.datasetId !== datasetId) return null;
    return {
      datasetId,
      modeLabel:
        typeof parsed.modeLabel === "string" || parsed.modeLabel === null
          ? (parsed.modeLabel as string | null)
          : null,
      selectedIds: Array.isArray(parsed.selectedIds)
        ? parsed.selectedIds.map(Number)
        : [],
      teams:
        parsed.teams && typeof parsed.teams === "object"
          ? (parsed.teams as Record<number, 1 | 2 | null>)
          : {},
      matchupMode: Boolean(parsed.matchupMode),
    };
  } catch {
    return null;
  }
}

export function saveCompareUiFilters(next: CompareUiFilters) {
  memory = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COMPARE_FILTERS_KEY, JSON.stringify(next));
  } catch {
    // Quota / private mode.
  }
}
