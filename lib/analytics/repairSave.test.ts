import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "./dbMeta";
import { isValidMatchPublicId } from "./matchPublicId";
import { isValidPlayerPublicId } from "./playerPublicId";
import { repairSave } from "./repairSave";
import type { OlympusExportData } from "./types";

function player(
  id: number,
  name: string,
  publicId = ""
): OlympusExportData["players"][number] {
  return {
    id,
    name,
    name_key: name.toLowerCase(),
    public_id: publicId,
    created_at: null,
    is_myself: 0,
    is_hidden: 0,
  };
}

describe("repairSave", () => {
  it("fills missing ids, seats, schema, and aggregates", () => {
    const before: OlympusExportData = {
      source: "csv",
      fileName: "broken.csv",
      importedAt: "2026-08-17T00:00:00.000Z",
      db_meta: {
        id: 1,
        db_identifier: "abcdefghijklmnop",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        schema_version: 22,
        app_version: "4.0.0",
        label: "Broken",
        origin: "imported",
      },
      players: [player(1, "Ana"), player(2, "Pedro")],
      player_stats: [],
      player_h2h: [],
      matches: [],
      tables: {
        players: [],
        matches: [
          {
            id: 1,
            title: "night",
            ended_at: "2026-04-20T12:00:00.000Z",
            players_amount: 2,
            mode_label: "1 vs 1",
            max_points: 150,
            is_closed: 1,
            public_id: "",
          },
        ],
        match_players: [
          { match_id: 1, seat: 1, display_name: "Ana", player_id: null },
          { match_id: 1, seat: 2, display_name: "Pedro", player_id: null },
        ],
        games: [
          { id: 10, match_id: 1, game_index: 1, winner_team: "Team 1" },
        ],
        game_team_scores: [
          {
            game_id: 10,
            team_number: 1,
            total_points: 150,
            hands_json: "[50,50,50]",
          },
          {
            game_id: 10,
            team_number: 2,
            total_points: 90,
            hands_json: "[20,30,40]",
          },
        ],
      },
    };

    const { data, report } = repairSave(before);
    expect(report.schemaVersionBefore).toBe(22);
    expect(report.schemaVersionAfter).toBe(SCHEMA_VERSION);
    expect(report.playerPublicIdsFilled).toBe(2);
    expect(report.matchPublicIdsFilled).toBe(1);
    expect(report.seatsBackfilled).toBe(2);
    expect(report.aggregatesRecomputed).toBe(true);
    expect(data.players.every((row) => isValidPlayerPublicId(row.public_id))).toBe(
      true
    );
    expect(
      isValidMatchPublicId((data.tables.matches ?? [])[0]?.public_id)
    ).toBe(true);
    expect(
      (data.tables.match_players ?? []).map((row) => row.player_id)
    ).toEqual([1, 2]);
    expect(
      data.player_stats.find((row) => row.player_id === 1)?.games_played
    ).toBe(1);
  });
});
