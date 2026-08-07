import {
  EXPORT_TABLES,
  type ExportTable,
  type OlympusExportData,
  type PlayerH2HRow,
  type PlayerRow,
  type PlayerStatsRow,
} from "./types";
import { withEnsuredPlayerPublicIds } from "./playerIdentity";
import { resolveImportedPublicId } from "./playerPublicId";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function coerceCell(raw: string): string | number | null {
  if (raw === "") return null;
  // Keep long digit strings as text so 16-char public_ids stay exact.
  if (/^-?\d+$/.test(raw) && raw.replace(/^-/, "").length < 16) {
    return Number(raw);
  }
  if (/^-?\d+\.\d+$/.test(raw)) return Number(raw);
  return raw;
}

function emptyTables(): Partial<Record<ExportTable, Record<string, unknown>[]>> {
  const tables: Partial<Record<ExportTable, Record<string, unknown>[]>> = {};
  for (const table of EXPORT_TABLES) {
    tables[table] = [];
  }
  return tables;
}

function isExportTable(name: string): name is ExportTable {
  return (EXPORT_TABLES as readonly string[]).includes(name);
}

function parseCsv(contents: string): Partial<
  Record<ExportTable, Record<string, unknown>[]>
> {
  const tables = emptyTables();
  const lines = contents.split(/\r?\n/);
  let table: ExportTable | null = null;
  let columns: string[] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      table = null;
      columns = null;
      continue;
    }

    if (line.startsWith("# ")) {
      const name = line.slice(2).trim();
      if (!isExportTable(name)) {
        throw new Error(`unknown_table:${name}`);
      }
      table = name;
      columns = null;
      continue;
    }

    if (!table) continue;

    const cells = parseCsvLine(line);
    if (!columns) {
      columns = cells;
      continue;
    }

    const row: Record<string, unknown> = {};
    columns.forEach((col, index) => {
      row[col] = coerceCell(cells[index] ?? "");
    });
    tables[table]!.push(row);
  }

  return tables;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = asNumber(value, Number.NaN);
  return Number.isFinite(n) ? n : null;
}

function asString(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function normalizePlayers(rows: Record<string, unknown>[]): PlayerRow[] {
  const used = new Set<string>();
  return rows.map((row) => ({
    id: asNumber(row.id),
    public_id: resolveImportedPublicId(
      row.public_id as string | number | null | undefined,
      used
    ),
    name: asString(row.name),
    name_key: asString(row.name_key, asString(row.name).trim().toLowerCase()),
    created_at: row.created_at == null ? null : asString(row.created_at),
    is_myself: asNumber(row.is_myself, 0),
  }));
}

function normalizeStats(rows: Record<string, unknown>[]): PlayerStatsRow[] {
  return rows.map((row) => {
    const hands_for = asNumber(row.hands_for);
    const hands_against = asNumber(row.hands_against);
    // Scored / conceded identity (for/against are the durable measures).
    // Old exports used game-outcome buckets for won/lost — normalize here.
    const hands_won = hands_for;
    const hands_lost = hands_against;
    const importedPlayed = asNullableNumber(row.hands_played);
    const hands_played =
      importedPlayed != null && importedPlayed > 0
        ? importedPlayed
        : hands_won + hands_lost;

    return {
      player_id: asNumber(row.player_id),
      mode_label: asString(row.mode_label),
      games_played: asNumber(row.games_played),
      games_won: asNumber(row.games_won),
      games_lost: asNumber(row.games_lost),
      points_for: asNumber(row.points_for),
      points_against: asNumber(row.points_against),
      hands_for,
      hands_against,
      hands_won,
      hands_lost,
      hands_played,
      pollos_for: asNumber(row.pollos_for),
      pollos_against: asNumber(row.pollos_against),
      zapatos_for: asNumber(row.zapatos_for),
      zapatos_against: asNumber(row.zapatos_against),
      joses_coefficient: asNullableNumber(row.joses_coefficient),
    };
  });
}

function normalizeH2H(rows: Record<string, unknown>[]): PlayerH2HRow[] {
  return rows.map((row) => ({
    player_id: asNumber(row.player_id),
    opponent_id: asNumber(row.opponent_id),
    mode_label: asString(row.mode_label),
    wins: asNumber(row.wins),
    losses: asNumber(row.losses),
  }));
}

function assertCsvExport(fileName: string, contents: string): void {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".sql")) {
    throw new Error("sql_unsupported");
  }
  if (
    /^\s*--\s*Olympus/i.test(contents) ||
    (/INSERT\s+INTO/i.test(contents) && !/^\s*#\s*\w+/m.test(contents))
  ) {
    throw new Error("sql_unsupported");
  }
  if (lower.endsWith(".csv") || /^\s*#\s*\w+/m.test(contents)) return;
  throw new Error("unknown_format");
}

export function parseOlympusExport(
  contents: string,
  fileName: string
): OlympusExportData {
  const normalized = contents.replace(/^\uFEFF/, "");
  assertCsvExport(fileName, normalized);
  const tables = parseCsv(normalized);

  const players = normalizePlayers(tables.players ?? []);
  const player_stats = normalizeStats(tables.player_stats ?? []);
  const player_h2h = normalizeH2H(tables.player_h2h ?? []);

  if (players.length === 0 && player_stats.length === 0) {
    throw new Error("empty_export");
  }

  // Mirror public_id onto raw table rows and catch any remaining gaps.
  return withEnsuredPlayerPublicIds({
    source: "csv",
    fileName,
    importedAt: new Date().toISOString(),
    players,
    player_stats,
    player_h2h,
    matches: tables.matches ?? [],
    tables,
  });
}
