import type { HistoryFilterPlayer } from "@/lib/analytics/historyFilters";

export const HISTORY_FILTERS_KEY = "olympus-web-history-filters-v1";

export type HistoryUiFilters = {
  datasetId: string;
  query: string;
  modeFilter: string;
  rosterFilter: HistoryFilterPlayer[];
};

const DEFAULT_FILTERS: Omit<HistoryUiFilters, "datasetId"> = {
  query: "",
  modeFilter: "all",
  rosterFilter: [],
};

/** Survives History remounts within the tab (list ↔ match, other routes). */
let memory: HistoryUiFilters | null = null;

function isTeam(value: unknown): value is HistoryFilterPlayer["team"] {
  return value === 1 || value === 2 || value === null;
}

function sanitizeRoster(
  raw: unknown,
  validPlayerIds?: ReadonlySet<number>
): HistoryFilterPlayer[] {
  if (!Array.isArray(raw)) return [];
  const out: HistoryFilterPlayer[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const playerId = Number((entry as { playerId?: unknown }).playerId);
    const team = (entry as { team?: unknown }).team;
    if (!Number.isFinite(playerId)) continue;
    if (!isTeam(team)) continue;
    if (validPlayerIds && !validPlayerIds.has(playerId)) continue;
    out.push({ playerId, team });
  }
  return out;
}

export function defaultHistoryUiFilters(datasetId: string): HistoryUiFilters {
  return { datasetId, ...DEFAULT_FILTERS };
}

export function loadHistoryUiFilters(
  datasetId: string,
  validPlayerIds?: ReadonlySet<number>
): HistoryUiFilters {
  const fromMemory =
    memory && memory.datasetId === datasetId ? memory : null;
  if (fromMemory) {
    return {
      ...fromMemory,
      rosterFilter: sanitizeRoster(fromMemory.rosterFilter, validPlayerIds),
    };
  }

  if (typeof window === "undefined") {
    return defaultHistoryUiFilters(datasetId);
  }

  try {
    const raw = window.sessionStorage.getItem(HISTORY_FILTERS_KEY);
    if (!raw) return defaultHistoryUiFilters(datasetId);
    const parsed = JSON.parse(raw) as Partial<HistoryUiFilters>;
    if (parsed.datasetId !== datasetId) {
      return defaultHistoryUiFilters(datasetId);
    }
    const next: HistoryUiFilters = {
      datasetId,
      query: typeof parsed.query === "string" ? parsed.query : "",
      modeFilter:
        typeof parsed.modeFilter === "string" && parsed.modeFilter
          ? parsed.modeFilter
          : "all",
      rosterFilter: sanitizeRoster(parsed.rosterFilter, validPlayerIds),
    };
    memory = next;
    return next;
  } catch {
    return defaultHistoryUiFilters(datasetId);
  }
}

export function saveHistoryUiFilters(next: HistoryUiFilters) {
  memory = next;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(HISTORY_FILTERS_KEY, JSON.stringify(next));
  } catch {
    // Quota / private mode.
  }
}
