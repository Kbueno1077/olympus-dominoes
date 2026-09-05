import { describe, expect, it } from "vitest";
import { extractDataset } from "./extractDataset";
import type { OlympusExportData } from "./types";

function player(
  id: number,
  name: string
): OlympusExportData["players"][number] {
  return {
    id,
    name,
    name_key: name.toLowerCase(),
    public_id: `${name}PublicId0001`.slice(0, 16),
    created_at: null,
    is_myself: 0,
    is_hidden: 0,
  };
}

function teamScores(gameId: number) {
  return [
    {
      game_id: gameId,
      team_number: 1,
      total_points: 150,
      hands_json: "[50,50,50]",
    },
    {
      game_id: gameId,
      team_number: 2,
      total_points: 90,
      hands_json: "[20,30,40]",
    },
  ];
}

function sampleData(): OlympusExportData {
  return {
    source: "csv",
    fileName: "test.csv",
    importedAt: "2026-08-17T00:00:00.000Z",
    players: [
      player(1, "Ana"),
      player(2, "Pedro"),
      player(3, "Luis"),
      player(4, "Maria"),
      player(5, "Cesar"),
    ],
    player_stats: [],
    player_h2h: [],
    matches: [],
    tables: {
      players: [],
      matches: [
        {
          id: 1,
          title: "march",
          ended_at: "2026-03-15T12:00:00.000Z",
          players_amount: 4,
          mode_label: "2 vs 2",
          max_points: 150,
          is_closed: 1,
        },
        {
          id: 2,
          title: "april-pair",
          ended_at: "2026-04-20T12:00:00.000Z",
          players_amount: 2,
          mode_label: "1 vs 1",
          max_points: 150,
          is_closed: 1,
        },
      ],
      match_players: [
        { match_id: 1, seat: 1, display_name: "Ana", player_id: 1 },
        { match_id: 1, seat: 2, display_name: "Pedro", player_id: 2 },
        { match_id: 1, seat: 3, display_name: "Luis", player_id: 3 },
        { match_id: 1, seat: 4, display_name: "Maria", player_id: 4 },
        { match_id: 2, seat: 1, display_name: "Ana", player_id: 1 },
        { match_id: 2, seat: 2, display_name: "Pedro", player_id: 2 },
      ],
      games: [
        { id: 10, match_id: 1, game_index: 1, winner_team: "Team 1" },
        { id: 11, match_id: 2, game_index: 1, winner_team: "Team 1" },
      ],
      game_team_scores: [...teamScores(10), ...teamScores(11)],
    },
  };
}

describe("extractDataset", () => {
  it("requires a date range or people filter", () => {
    expect(extractDataset(sampleData(), {})).toEqual({
      ok: false,
      reason: "need_filter",
    });
  });

  it("keeps only nights in the date range", () => {
    const result = extractDataset(sampleData(), {
      dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.keptMatchCount).toBe(1);
    expect((result.data.tables.matches ?? []).map((row) => row.id)).toEqual([2]);
    expect(result.data.players.map((row) => row.id)).toEqual([1, 2]);
  });

  it("keeps nights whose seats are a subset of the selected people", () => {
    const pairOnly = extractDataset(sampleData(), { playerIds: [1, 2] });
    expect(pairOnly.ok).toBe(true);
    if (!pairOnly.ok) return;
    expect((pairOnly.data.tables.matches ?? []).map((row) => row.id)).toEqual([
      2,
    ]);

    const table = extractDataset(sampleData(), { playerIds: [1, 2, 3, 4] });
    expect(table.ok).toBe(true);
    if (!table.ok) return;
    expect((table.data.tables.matches ?? []).map((row) => row.id)).toEqual([
      1, 2,
    ]);
  });

  it("returns no_matches when the slice is empty", () => {
    expect(
      extractDataset(sampleData(), {
        dateRange: { startDate: "2025-01-01", endDate: "2025-01-31" },
      })
    ).toEqual({ ok: false, reason: "no_matches" });
  });
});
