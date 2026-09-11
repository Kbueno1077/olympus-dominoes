/**
 * Stable identity of one league / dataset file (same alphabet as player public_id).
 * Mirrors mobile `domain/dbMeta.ts` (schema v18).
 */

import {
  generatePlayerPublicId,
  isValidPlayerPublicId,
  PLAYER_PUBLIC_ID_LENGTH,
} from "./playerPublicId";
import { SCHEMA_VERSION } from "./schemaVersion";

export { SCHEMA_VERSION } from "./schemaVersion";

export const DB_IDENTIFIER_LENGTH = PLAYER_PUBLIC_ID_LENGTH;

/** Last web app version that writes db_meta (package.json). */
export const WRITING_APP_VERSION = "4.9.0";

/** UI-only brand line — not stored as app_version. */
export const APP_UI_SIGNATURE = `kbueno's v${WRITING_APP_VERSION}`;

export const DB_META_ORIGINS = ["local", "imported", "web"] as const;
export type DbMetaOrigin = (typeof DB_META_ORIGINS)[number];

/** Snake_case row shape — CSV / storage / mobile contract. */
export type DbMetaRow = {
  id: 1;
  db_identifier: string;
  created_at: string;
  updated_at: string;
  schema_version: number;
  app_version: string;
  label: string;
  origin: DbMetaOrigin;
};

export const DB_META_COLUMNS = [
  "id",
  "db_identifier",
  "created_at",
  "updated_at",
  "schema_version",
  "app_version",
  "label",
  "origin",
] as const;

export function getWritingAppVersion(): string {
  return WRITING_APP_VERSION;
}

export function generateDbIdentifier(): string {
  return generatePlayerPublicId();
}

export function isValidDbIdentifier(value: unknown): value is string {
  return isValidPlayerPublicId(value);
}

export function isValidDbMetaOrigin(value: unknown): value is DbMetaOrigin {
  return (
    typeof value === "string" &&
    (DB_META_ORIGINS as readonly string[]).includes(value)
  );
}

/**
 * Prefer a valid db_identifier from import data; otherwise allocate a new one.
 */
export function resolveImportedDbIdentifier(
  raw: string | number | null | undefined
): string {
  const asString = raw == null ? "" : String(raw);
  return isValidDbIdentifier(asString) ? asString : generateDbIdentifier();
}

export function seedDbMetaRow(options?: {
  dbIdentifier?: string;
  createdAt?: string;
  updatedAt?: string;
  label?: string;
  origin?: DbMetaOrigin;
}): DbMetaRow {
  const now = new Date().toISOString();
  return {
    id: 1,
    db_identifier: options?.dbIdentifier ?? generateDbIdentifier(),
    created_at: options?.createdAt ?? now,
    updated_at: options?.updatedAt ?? now,
    schema_version: SCHEMA_VERSION,
    app_version: getWritingAppVersion(),
    label: options?.label ?? "",
    origin: options?.origin ?? "local",
  };
}

/**
 * Build the single db_meta row from an imported CSV section (at most one data row).
 * Keeps a valid db_identifier; forces origin=imported; never a 2nd row.
 */
export function applyImportedDbMetaRow(
  rows: readonly Record<string, unknown>[],
  options?: { labelFallback?: string }
): DbMetaRow {
  const now = new Date().toISOString();
  const row = rows[0] ?? {};
  const createdRaw = row.created_at;
  const createdAt =
    typeof createdRaw === "string" && createdRaw.trim()
      ? createdRaw.trim()
      : now;
  const labelRaw = row.label;
  const label =
    labelRaw == null || String(labelRaw).trim() === ""
      ? (options?.labelFallback ?? "")
      : String(labelRaw);

  return {
    id: 1,
    db_identifier: resolveImportedDbIdentifier(
      row.db_identifier as string | number | null | undefined
    ),
    created_at: createdAt,
    updated_at: now,
    schema_version: SCHEMA_VERSION,
    app_version: getWritingAppVersion(),
    label,
    origin: "imported",
  };
}

/** After import with no db_meta section: seed one row marked imported. */
export function ensureImportedDbMetaRow(options?: {
  label?: string;
}): DbMetaRow {
  return seedDbMetaRow({
    origin: "imported",
    label: options?.label ?? "",
  });
}

/**
 * Reconstruct one db_meta row from a stored / CSV table row without forcing
 * import semantics (keeps origin / timestamps when valid).
 */
export function parseStoredDbMetaRow(
  row: Record<string, unknown> | undefined,
  options?: { originFallback?: DbMetaOrigin; labelFallback?: string }
): DbMetaRow {
  const raw = row ?? {};
  const now = new Date().toISOString();
  const createdRaw = raw.created_at;
  const updatedRaw = raw.updated_at;
  const labelRaw = raw.label;
  const label =
    labelRaw == null || String(labelRaw).trim() === ""
      ? (options?.labelFallback ?? "")
      : String(labelRaw);

  return syncDbMetaVersions({
    id: 1,
    db_identifier: resolveImportedDbIdentifier(
      raw.db_identifier as string | number | null | undefined
    ),
    created_at:
      typeof createdRaw === "string" && createdRaw.trim()
        ? createdRaw.trim()
        : now,
    updated_at:
      typeof updatedRaw === "string" && updatedRaw.trim()
        ? updatedRaw.trim()
        : now,
    schema_version: SCHEMA_VERSION,
    app_version: getWritingAppVersion(),
    label,
    origin: isValidDbMetaOrigin(raw.origin)
      ? raw.origin
      : (options?.originFallback ?? "web"),
  });
}

/** Bump updated_at (and refresh app/schema versions) after meaningful writes. */
export function touchDbMetaRow(
  row: DbMetaRow,
  options?: { label?: string }
): DbMetaRow {
  return {
    ...row,
    id: 1,
    updated_at: new Date().toISOString(),
    schema_version: SCHEMA_VERSION,
    app_version: getWritingAppVersion(),
    ...(options?.label != null ? { label: options.label } : null),
  };
}

/** Keep schema/app versions current without bumping updated_at (open / hydrate). */
export function syncDbMetaVersions(row: DbMetaRow): DbMetaRow {
  if (
    row.schema_version === SCHEMA_VERSION &&
    row.app_version === getWritingAppVersion() &&
    row.id === 1 &&
    isValidDbIdentifier(row.db_identifier) &&
    isValidDbMetaOrigin(row.origin)
  ) {
    return row;
  }
  return {
    ...row,
    id: 1,
    db_identifier: isValidDbIdentifier(row.db_identifier)
      ? row.db_identifier
      : generateDbIdentifier(),
    schema_version: SCHEMA_VERSION,
    app_version: getWritingAppVersion(),
    label: row.label ?? "",
    origin: isValidDbMetaOrigin(row.origin) ? row.origin : "web",
  };
}
