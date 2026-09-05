import { dropMatchesById } from "./dropMatches";
import {
  isDateRangeActive,
  matchInDateRange,
  type DateRange,
} from "./dateRangeFilter";
import { asMatchId, listNightMatches } from "./matchNightKey";
import { recomputeAggregatesFromMatches } from "./recomputeFromMatches";
import type { OlympusExportData } from "./types";

export type ExtractDatasetOptions = {
  dateRange?: DateRange | null;
  playerIds?: readonly number[];
};

export type ExtractDatasetResult =
  | { ok: true; data: OlympusExportData; keptMatchCount: number }
  | { ok: false; reason: "need_filter" | "no_matches" };

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function matchRows(data: OlympusExportData): Record<string, unknown>[] {
  return data.tables.matches ?? data.matches ?? [];
}

export function extractDataset(
  data: OlympusExportData,
  options: ExtractDatasetOptions
): ExtractDatasetResult {
  const dateRange = options.dateRange ?? null;
  const playerIds = (options.playerIds ?? []).filter((id) => id > 0);
  const hasDate = isDateRangeActive(dateRange);
  const hasPeople = playerIds.length > 0;

  if (!hasDate && !hasPeople) {
    return { ok: false, reason: "need_filter" };
  }

  const allowed = new Set(playerIds);
  const nights = listNightMatches(data);
  const keepIds = new Set<number>();

  for (const row of matchRows(data)) {
    const matchId = asMatchId(row.id);
    if (!matchId) continue;
    if (hasDate && !matchInDateRange(asString(row.ended_at), dateRange)) {
      continue;
    }
    if (hasPeople) {
      const night = nights.find((item) => item.matchId === matchId);
      const seated = night?.playerIds ?? [];
      if (seated.length === 0) continue;
      if (!seated.every((id) => allowed.has(id))) continue;
    }
    keepIds.add(matchId);
  }

  if (keepIds.size === 0) {
    return { ok: false, reason: "no_matches" };
  }

  const dropIds = matchRows(data)
    .map((row) => asMatchId(row.id))
    .filter((id) => id > 0 && !keepIds.has(id));

  const sliced = dropMatchesById(data, dropIds);
  const keepPlayerIds = new Set<number>();
  if (hasPeople) {
    for (const id of playerIds) keepPlayerIds.add(id);
  } else {
    for (const night of listNightMatches(sliced)) {
      for (const id of night.playerIds) keepPlayerIds.add(id);
    }
  }

  const players = sliced.players.filter((player) =>
    keepPlayerIds.has(player.id)
  );
  const rawPlayers = (sliced.tables.players ?? []).filter((row) =>
    keepPlayerIds.has(asMatchId(row.id))
  );

  return {
    ok: true,
    data: recomputeAggregatesFromMatches({
      ...sliced,
      players,
      tables: {
        ...sliced.tables,
        players: rawPlayers.length > 0 ? rawPlayers : sliced.tables.players,
      },
    }),
    keptMatchCount: keepIds.size,
  };
}
