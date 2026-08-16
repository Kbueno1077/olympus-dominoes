import { DB_META_COLUMNS } from "./dbMeta";
import { withEnsuredDbMeta } from "./dbMetaState";
import {
  EXPORT_TABLES,
  type ExportTable,
  type OlympusExportData,
  type PlayerRow,
} from "./types";

const PLAYER_COLUMNS = [
  "id",
  "name",
  "name_key",
  "public_id",
  "created_at",
  "is_myself",
] as const;

const APP_SETTINGS_COLUMNS = ["key", "value"] as const;

const MATCH_COLUMNS = [
  "id",
  "title",
  "ended_at",
  "players_amount",
  "mode_label",
  "tile_set",
  "max_points",
  "public_id",
] as const;

const MATCH_PLAYER_COLUMNS = [
  "id",
  "match_id",
  "seat",
  "display_name",
  "player_id",
] as const;

const GAME_COLUMNS = ["id", "match_id", "game_index", "winner_team"] as const;

const GAME_TEAM_SCORE_COLUMNS = [
  "id",
  "game_id",
  "team_number",
  "total_points",
  "hands_json",
  "hand_count",
] as const;

const PLAYER_STATS_COLUMNS = [
  "player_id",
  "mode_label",
  "tile_set",
  "games_played",
  "games_won",
  "games_lost",
  "points_for",
  "points_against",
  "hands_for",
  "hands_against",
  "hands_won",
  "hands_lost",
  "hands_played",
  "pollos_for",
  "pollos_against",
  "zapatos_for",
  "zapatos_against",
  "joses_coefficient",
] as const;

const PLAYER_H2H_COLUMNS = [
  "player_id",
  "opponent_id",
  "mode_label",
  "tile_set",
  "wins",
  "losses",
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function knownColumns(table: ExportTable): readonly string[] {
  switch (table) {
    case "db_meta":
      return DB_META_COLUMNS;
    case "players":
      return PLAYER_COLUMNS;
    case "app_settings":
      return APP_SETTINGS_COLUMNS;
    case "matches":
      return MATCH_COLUMNS;
    case "match_players":
      return MATCH_PLAYER_COLUMNS;
    case "games":
      return GAME_COLUMNS;
    case "game_team_scores":
      return GAME_TEAM_SCORE_COLUMNS;
    case "player_stats":
      return PLAYER_STATS_COLUMNS;
    case "player_h2h":
      return PLAYER_H2H_COLUMNS;
    default: {
      const _never: never = table;
      return _never;
    }
  }
}

function playerToRow(player: PlayerRow): Record<string, unknown> {
  return {
    id: player.id,
    name: player.name,
    name_key: player.name_key,
    public_id: player.public_id,
    created_at: player.created_at ?? "",
    is_myself: player.is_myself ?? 0,
  };
}

function dbMetaToRow(data: OlympusExportData): Record<string, unknown>[] {
  const fromTables = data.tables.db_meta ?? [];
  if (fromTables.length > 0) return fromTables.slice(0, 1);
  if (!data.db_meta) return [];
  const row = data.db_meta;
  return [
    {
      id: row.id,
      db_identifier: row.db_identifier,
      created_at: row.created_at,
      updated_at: row.updated_at,
      schema_version: row.schema_version,
      app_version: row.app_version,
      label: row.label,
      origin: row.origin,
    },
  ];
}

function rowsForTable(
  data: OlympusExportData,
  table: ExportTable
): Record<string, unknown>[] {
  switch (table) {
    case "db_meta":
      return dbMetaToRow(data);
    case "players":
      return data.players.map(playerToRow);
    case "player_stats":
      return data.player_stats.map((row) => ({ ...row }));
    case "player_h2h":
      return data.player_h2h.map((row) => ({ ...row }));
    case "matches":
      return data.tables.matches ?? data.matches ?? [];
    case "app_settings":
    case "match_players":
    case "games":
    case "game_team_scores":
      return data.tables[table] ?? [];
    default: {
      const _never: never = table;
      return _never;
    }
  }
}

function columnsForRows(
  table: ExportTable,
  rows: Record<string, unknown>[]
): string[] {
  const known = [...knownColumns(table)];
  const extras = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!known.includes(key)) extras.add(key);
    }
  }
  return extras.size === 0 ? known : [...known, ...Array.from(extras)];
}

function serializeTable(
  table: ExportTable,
  rows: Record<string, unknown>[]
): string {
  const lines = [`# ${table}`];
  if (rows.length === 0) {
    lines.push("");
    return lines.join("\n");
  }
  const cols = columnsForRows(table, rows);
  lines.push(cols.map(csvEscape).join(","));
  for (const row of rows) {
    lines.push(cols.map((col) => csvEscape(row[col])).join(","));
  }
  lines.push("");
  return lines.join("\n");
}

export function serializeOlympusExport(
  data: OlympusExportData,
  options?: { label?: string }
): string {
  const ensured = withEnsuredDbMeta(data, {
    origin: data.db_meta?.origin ?? "web",
    label: options?.label ?? data.db_meta?.label,
  });
  return EXPORT_TABLES.map((table) =>
    serializeTable(table, rowsForTable(ensured, table))
  ).join("\n");
}

export function exportBasenameForDataset(displayName: string): string {
  const slug =
    displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "dataset";
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `olympus-${slug}-${yyyy}-${mm}-${dd}`;
}

export function downloadOlympusCsv(basename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${basename}.csv`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
