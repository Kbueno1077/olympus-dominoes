import {
  EXPORT_TABLES,
  type ExportTable,
  type OlympusExportData,
  type PlayerH2HRow,
  type PlayerRow,
  type PlayerStatsRow,
} from "./types";

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
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
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

/**
 * Split SQL VALUES (...) respecting quoted strings.
 */
function splitSqlValues(valuesBlob: string): (string | number | null)[] {
  const values: (string | number | null)[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < valuesBlob.length; i++) {
    const ch = valuesBlob[i];
    if (inQuotes) {
      if (ch === "'") {
        if (valuesBlob[i + 1] === "'") {
          current += "'";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === "'") {
      inQuotes = true;
    } else if (ch === ",") {
      values.push(coerceSqlLiteral(current.trim()));
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim() !== "" || valuesBlob.endsWith(",")) {
    values.push(coerceSqlLiteral(current.trim()));
  }
  return values;
}

function coerceSqlLiteral(raw: string): string | number | null {
  if (raw === "" || /^null$/i.test(raw)) return null;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if (
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('"') && raw.endsWith('"'))
  ) {
    return raw
      .slice(1, -1)
      .replace(/''/g, "'")
      .replace(/""/g, '"');
  }
  return raw;
}

function parseSql(contents: string): Partial<
  Record<ExportTable, Record<string, unknown>[]>
> {
  const tables = emptyTables();
  const cleaned = contents
    .split("\n")
    .map((line) => line.replace(/--.*$/, "").trim())
    .filter(Boolean)
    .join("\n");

  const statements = cleaned
    .split(";")
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length > 0 &&
        !/^PRAGMA/i.test(s) &&
        !/^(BEGIN|COMMIT)/i.test(s) &&
        !/^DELETE\s+FROM/i.test(s)
    );

  const insertRe =
    /^INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]*)\)$/i;

  for (const statement of statements) {
    if (!/^INSERT\s+INTO\s+/i.test(statement)) continue;
    const match = insertRe.exec(statement);
    if (!match) continue;

    const tableName = match[1];
    if (!isExportTable(tableName)) continue;

    const columns = match[2].split(",").map((c) => c.trim());
    const values = splitSqlValues(match[3].trim());
    const row: Record<string, unknown> = {};
    columns.forEach((col, index) => {
      row[col] = values[index] ?? null;
    });
    tables[tableName]!.push(row);
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
  return rows.map((row) => ({
    id: asNumber(row.id),
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

function detectFormat(
  fileName: string,
  contents: string
): "csv" | "sql" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".sql")) return "sql";
  if (lower.endsWith(".csv")) return "csv";
  if (/^\s*--\s*Olympus/i.test(contents) || /INSERT\s+INTO/i.test(contents)) {
    return "sql";
  }
  if (/^\s*#\s*\w+/m.test(contents)) return "csv";
  throw new Error("unknown_format");
}

export function parseOlympusExport(
  contents: string,
  fileName: string
): OlympusExportData {
  const source = detectFormat(fileName, contents);
  const tables = source === "csv" ? parseCsv(contents) : parseSql(contents);

  const players = normalizePlayers(tables.players ?? []);
  const player_stats = normalizeStats(tables.player_stats ?? []);
  const player_h2h = normalizeH2H(tables.player_h2h ?? []);

  if (players.length === 0 && player_stats.length === 0) {
    throw new Error("empty_export");
  }

  return {
    source,
    fileName,
    importedAt: new Date().toISOString(),
    players,
    player_stats,
    player_h2h,
    matches: tables.matches ?? [],
    tables,
  };
}
