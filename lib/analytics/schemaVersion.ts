/**
 * Durable CSV schema version.
 * Keep in sync with olympus-dominoes-app `src/domain/schemaVersion.ts`.
 */
export const SCHEMA_VERSION = 22;

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

/**
 * @throws {Error} `schema_too_new` when the file needs a newer app
 * @throws {Error} `schema_too_old` when the file is below MIN_IMPORT_SCHEMA
 */
export function assertImportSchemaVersion(fileVersion: number): void {
  if (fileVersion > SCHEMA_VERSION) {
    throw new Error("schema_too_new");
  }
  if (fileVersion < MIN_IMPORT_SCHEMA) {
    throw new Error("schema_too_old");
  }
}

export function normalizeImportedTileSet(value: unknown): "55" | "28" {
  return value === "28" || value === 28 ? "28" : "55";
}
