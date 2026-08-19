/**
 * Durable CSV schema version.
 * Keep in lockstep with olympus-dominoes-app `src/domain/schemaVersion.ts`.
 *
 * 22 was the last shape change (`matches.is_closed`, `game_players`).
 * 23 is a Jose formula-only bump (no new columns vs 22).
 */
export const SCHEMA_VERSION = 23;

/** First schema that stores the current Jose formula (no / max(G, 25)). */
export const JOSES_FORMULA_SCHEMA = 23;

/** Pre-`db_meta` CSVs are treated as version 0 and still upgraded. */
export const MIN_IMPORT_SCHEMA = 0;

export function parseSchemaVersion(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.trunc(raw);
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return 0;
}

export const SCHEMA_TOO_NEW = "schema_too_new";

/**
 * @throws {Error} `schema_too_new:<fileVersion>` when the file needs a newer app
 * @throws {Error} `schema_too_old` when the file is below MIN_IMPORT_SCHEMA
 */
export function assertImportSchemaVersion(fileVersion: number): void {
  if (fileVersion > SCHEMA_VERSION) {
    throw new Error(`${SCHEMA_TOO_NEW}:${fileVersion}`);
  }
  if (fileVersion < MIN_IMPORT_SCHEMA) {
    throw new Error("schema_too_old");
  }
}

export function isSchemaTooNewError(code: string): boolean {
  return code === SCHEMA_TOO_NEW || code.startsWith(`${SCHEMA_TOO_NEW}:`);
}

/** File schema encoded in `schema_too_new:<n>`, or null if absent. */
export function fileVersionFromSchemaTooNew(code: string): number | null {
  const prefix = `${SCHEMA_TOO_NEW}:`;
  if (!code.startsWith(prefix)) return null;
  const n = Number(code.slice(prefix.length));
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/** Advertised schema on a stored/imported payload. Missing `db_meta` is 0. */
export function schemaVersionFromExport(data: {
  db_meta?: { schema_version?: unknown } | null;
  tables?: { db_meta?: Record<string, unknown>[] };
}): number {
  if (data.db_meta != null && data.db_meta.schema_version != null) {
    return parseSchemaVersion(data.db_meta.schema_version);
  }
  return parseSchemaVersion(data.tables?.db_meta?.[0]?.schema_version);
}

/** Same idea as mobile `needs_joses_recompute` on the schema-23 formula bump. */
export function needsJosesRecompute(fileSchema: number): boolean {
  return fileSchema < JOSES_FORMULA_SCHEMA;
}

export function normalizeImportedTileSet(value: unknown): "55" | "28" {
  return value === "28" || value === 28 ? "28" : "55";
}
