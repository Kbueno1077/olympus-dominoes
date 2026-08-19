import {
  SCHEMA_VERSION,
  fileVersionFromSchemaTooNew,
  isSchemaTooNewError,
} from "./schemaVersion";

type Translate = (key: string, values?: Record<string, unknown>) => string;

/** Map a parse/import error code to the player-facing string. */
export function importErrorMessage(t: Translate, code: string): string {
  if (code.startsWith("unknown_table:")) return t("analyticsErrorUnknownTable");
  if (code === "empty_export") return t("analyticsErrorEmpty");
  if (code === "unknown_format") return t("analyticsErrorFormat");
  if (code === "sql_unsupported") return t("analyticsErrorSqlUnsupported");
  if (isSchemaTooNewError(code)) {
    return t("analyticsErrorSchemaTooNew", {
      supported: SCHEMA_VERSION,
      file: fileVersionFromSchemaTooNew(code) ?? SCHEMA_VERSION,
    });
  }
  if (code === "schema_too_old") return t("analyticsErrorSchemaTooOld");
  return t("analyticsErrorGeneric");
}
