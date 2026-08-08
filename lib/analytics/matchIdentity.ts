import {
  isValidMatchPublicId,
  resolveImportedMatchPublicId,
} from "./matchPublicId";
import type { OlympusExportData } from "./types";

/**
 * Assign / normalize public_id on every match row in an import or stored blob.
 * First duplicate in a batch keeps the id; later rows get new ones.
 */
export function ensureMatchesHavePublicIds(
  matches: readonly Record<string, unknown>[]
): Record<string, unknown>[] {
  const used = new Set<string>();
  return matches.map((row) => ({
    ...row,
    public_id: resolveImportedMatchPublicId(
      row.public_id as string | number | null | undefined,
      used
    ),
  }));
}

/**
 * Backfill public_id on raw `tables.matches` (and top-level `matches`).
 * Returns the same reference when nothing changed.
 */
export function withEnsuredMatchPublicIds(
  data: OlympusExportData
): OlympusExportData {
  const fromTables = data.tables.matches ?? data.matches ?? [];
  const matches = ensureMatchesHavePublicIds(fromTables);
  const unchanged =
    matches.length === fromTables.length &&
    matches.every((row, index) => {
      const prev = fromTables[index];
      return (
        prev != null &&
        String(prev.public_id ?? "") === String(row.public_id ?? "")
      );
    });

  if (unchanged) {
    const rawMissing = fromTables.some(
      (row) => !isValidMatchPublicId(row.public_id)
    );
    if (!rawMissing) return data;
  }

  return {
    ...data,
    matches,
    tables: {
      ...data.tables,
      matches,
    },
  };
}
