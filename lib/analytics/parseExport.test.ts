import { describe, expect, it } from "vitest";
import {
  defaultMatchIsClosed,
  parseOlympusExport,
  peekCsvSchemaVersion,
} from "./parseExport";
import { serializeOlympusExport } from "./serializeExport";
import {
  assertImportSchemaVersion,
  JOSES_FORMULA_SCHEMA,
  MIN_IMPORT_SCHEMA,
  needsJosesRecompute,
  SCHEMA_TOO_NEW,
  SCHEMA_VERSION,
} from "./schemaVersion";

function csv(sections: string): string {
  return sections.trimStart();
}

describe("defaultMatchIsClosed", () => {
  it("fills is_closed=1 on a legacy matches row", () => {
    expect(defaultMatchIsClosed(undefined)).toBe(1);
    expect(defaultMatchIsClosed(null)).toBe(1);
    expect(defaultMatchIsClosed("")).toBe(1);
    expect(defaultMatchIsClosed(0)).toBe(0);
    expect(defaultMatchIsClosed(1)).toBe(1);
  });
});

describe("parseOlympusExport schema 22", () => {
  it("accepts # game_players and strips surrogate ids", () => {
    const contents = csv(`
# db_meta
id,db_identifier,created_at,updated_at,schema_version,app_version,label,origin
1,Wgpr0j8jv6WzvMbq,2026-08-16T17:48:46.829Z,2026-08-16T17:48:46.829Z,${SCHEMA_VERSION},4.7.0,Panteon,imported

# players
id,name,name_key,public_id,created_at,is_myself
1,Guillermo,guillermo,GuillermoPub0001,2026-08-16T17:48:46.829Z,0

# matches
id,title,ended_at,players_amount,mode_label,tile_set,max_points,is_closed,public_id
1,t,2026-08-16T17:48:46.829Z,4,2 vs 2,55,150,0,CesarMatch000001

# game_players
id,game_id,seat,display_name,player_id
8,2,1,Guillermo,1
1,3,2,Kevin,6
`);
    const data = parseOlympusExport(contents, "open.csv");
    const rows = data.tables.game_players ?? [];
    expect(rows).toHaveLength(2);
    expect(rows[0]).not.toHaveProperty("id");
    expect(rows[0]?.game_id).toBe(2);
    expect(data.matches[0]?.is_closed).toBe(0);
  });

  it("defaults missing is_closed to 1 on a legacy matches row", () => {
    const contents = csv(`
# db_meta
id,db_identifier,created_at,updated_at,schema_version,app_version,label,origin
1,CesarLeague00001,2026-08-03T10:51:58.627Z,2026-08-05T22:03:46.955Z,17,4.3.0,Cesar,imported

# players
id,name,name_key,public_id,created_at,is_myself
1,Cesar,cesar,CesarPublicId001,2026-08-03T10:51:58.627Z,1

# matches
id,title,ended_at,players_amount,mode_label,max_points,public_id
1,t,2026-08-05T17:41:11.820Z,4,2 vs 2,150,CesarMatch000001
`);
    const data = parseOlympusExport(contents, "legacy.csv");
    expect(data.matches[0]?.is_closed).toBe(1);
  });

  it("throws schema_too_new before unknown_table on a future file", () => {
    const contents = csv(`
# db_meta
id,db_identifier,created_at,updated_at,schema_version,app_version,label,origin
1,CesarLeague00001,2026-08-03T10:51:58.627Z,2026-08-05T22:03:46.955Z,${SCHEMA_VERSION + 1},9.0.0,Cesar,imported

# widgets
id
1
`);
    expect(peekCsvSchemaVersion(contents)).toBe(SCHEMA_VERSION + 1);
    expect(() => parseOlympusExport(contents, "future.csv")).toThrow(
      `${SCHEMA_TOO_NEW}:${SCHEMA_VERSION + 1}`
    );
  });
});

describe("assertImportSchemaVersion", () => {
  it("accepts the current schema and older files", () => {
    expect(() => assertImportSchemaVersion(SCHEMA_VERSION)).not.toThrow();
    expect(() => assertImportSchemaVersion(MIN_IMPORT_SCHEMA)).not.toThrow();
    expect(() => assertImportSchemaVersion(17)).not.toThrow();
  });

  it("rejects SCHEMA_VERSION + 1 as schema_too_new with the file version", () => {
    expect(() => assertImportSchemaVersion(SCHEMA_VERSION + 1)).toThrow(
      `${SCHEMA_TOO_NEW}:${SCHEMA_VERSION + 1}`
    );
  });

  it("is schema 23, in lockstep with mobile, and treats 23 as current", () => {
    expect(SCHEMA_VERSION).toBe(23);
    expect(JOSES_FORMULA_SCHEMA).toBe(23);
    expect(() => assertImportSchemaVersion(23)).not.toThrow();
    expect(() => assertImportSchemaVersion(22)).not.toThrow();
    expect(needsJosesRecompute(0)).toBe(true);
    expect(needsJosesRecompute(22)).toBe(true);
    expect(needsJosesRecompute(23)).toBe(false);
  });
});

describe("schema 23 round-trip", () => {
  it("imports a schema 23 file and writes schema_version 23 on export", () => {
    const contents = csv(`
# db_meta
id,db_identifier,created_at,updated_at,schema_version,app_version,label,origin
1,Wgpr0j8jv6WzvMbq,2026-08-16T17:48:46.829Z,2026-08-16T17:48:46.829Z,23,4.8.0,Panteon,imported

# players
id,name,name_key,public_id,created_at,is_myself
1,Guillermo,guillermo,GuillermoPub0001,2026-08-16T17:48:46.829Z,0

# matches
id,title,ended_at,players_amount,mode_label,tile_set,max_points,is_closed,public_id
1,t,2026-08-16T17:48:46.829Z,4,2 vs 2,55,150,0,CesarMatch000001

# game_players
id,game_id,seat,display_name,player_id
8,2,1,Guillermo,1
`);
    expect(peekCsvSchemaVersion(contents)).toBe(23);
    const data = parseOlympusExport(contents, "mobile-23.csv");
    expect(data.db_meta?.schema_version).toBe(23);
    expect(data.matches[0]?.is_closed).toBe(0);
    expect(data.tables.game_players).toHaveLength(1);
    expect(data.tables.game_players?.[0]).not.toHaveProperty("id");

    const exported = serializeOlympusExport(data, { label: "Panteon" });
    expect(peekCsvSchemaVersion(exported)).toBe(23);
    const again = parseOlympusExport(exported, "web-23.csv");
    expect(again.tables.game_players).toHaveLength(1);
    expect(again.tables.game_players?.[0]?.game_id).toBe(2);
    expect(again.tables.game_players?.[0]?.display_name).toBe("Guillermo");
  });
});
