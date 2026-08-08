import {
  applyImportedDbMetaRow,
  ensureImportedDbMetaRow,
  parseStoredDbMetaRow,
  seedDbMetaRow,
  syncDbMetaVersions,
  touchDbMetaRow,
  type DbMetaOrigin,
  type DbMetaRow,
} from "./dbMeta";
import type { OlympusExportData } from "./types";

function dbMetaToTableRow(row: DbMetaRow): Record<string, unknown> {
  return {
    id: row.id,
    db_identifier: row.db_identifier,
    created_at: row.created_at,
    updated_at: row.updated_at,
    schema_version: row.schema_version,
    app_version: row.app_version,
    label: row.label,
    origin: row.origin,
  };
}

function withDbMetaTables(
  data: OlympusExportData,
  db_meta: DbMetaRow
): OlympusExportData {
  return {
    ...data,
    db_meta,
    tables: {
      ...data.tables,
      // Exactly one row — never 0 or 2+.
      db_meta: [dbMetaToTableRow(db_meta)],
    },
  };
}

/**
 * After CSV parse: apply `# db_meta` when present, else seed imported meta.
 * Always leaves exactly one row.
 */
export function withResolvedImportDbMeta(
  data: OlympusExportData,
  options?: { label?: string }
): OlympusExportData {
  const raw = data.tables.db_meta ?? [];
  const db_meta =
    raw.length > 0
      ? applyImportedDbMetaRow(raw, { labelFallback: options?.label })
      : ensureImportedDbMetaRow({ label: options?.label });
  return withDbMetaTables(data, db_meta);
}

/**
 * Ensure a single db_meta row exists on stored / hydrated data.
 * Legacy blobs without the field get a web-origin seed (or imported if preferred).
 */
export function withEnsuredDbMeta(
  data: OlympusExportData,
  options?: { origin?: DbMetaOrigin; label?: string }
): OlympusExportData {
  if (data.db_meta) {
    const synced = syncDbMetaVersions(data.db_meta);
    const label =
      options?.label != null && options.label !== ""
        ? options.label
        : synced.label;
    const next =
      label !== synced.label ? { ...synced, label } : synced;
    if (
      next === data.db_meta &&
      (data.tables.db_meta?.length ?? 0) === 1
    ) {
      return data;
    }
    return withDbMetaTables(data, next);
  }

  const fromTable = data.tables.db_meta ?? [];
  if (fromTable.length > 0) {
    return withDbMetaTables(
      data,
      parseStoredDbMetaRow(fromTable[0], {
        originFallback: options?.origin ?? "web",
        labelFallback: options?.label,
      })
    );
  }

  return withDbMetaTables(
    data,
    seedDbMetaRow({
      origin: options?.origin ?? "web",
      label: options?.label ?? "",
    })
  );
}

/** Bump updated_at after meaningful durable writes. */
export function withTouchedDbMeta(
  data: OlympusExportData,
  options?: { label?: string }
): OlympusExportData {
  const base = withEnsuredDbMeta(data, {
    label: options?.label,
    origin: "web",
  });
  const current = base.db_meta ?? seedDbMetaRow({ origin: "web" });
  return withDbMetaTables(base, touchDbMetaRow(current, options));
}

/** Set display label and bump updated_at (dataset rename). */
export function withDbMetaLabel(
  data: OlympusExportData,
  label: string
): OlympusExportData {
  return withTouchedDbMeta(data, { label });
}
