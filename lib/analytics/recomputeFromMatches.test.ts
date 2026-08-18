import { describe, expect, it } from "vitest";
import { recomputeAggregatesFromMatches } from "./recomputeFromMatches";
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
  };
}

function emptyData(
  tables: OlympusExportData["tables"]
): OlympusExportData {
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
    matches: tables.matches ?? [],
    tables: {
      players: [],
      matches: [],
      match_players: [],
      games: [],
      game_players: [],
      game_team_scores: [],
      ...tables,
    },
  };
}

const teamScores = (gameId: number) => [
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

describe("recomputeAggregatesFromMatches open vs closed", () => {
  it("gives Ana one game when she sits game 1 only on an open table", () => {
    const data = emptyData({
      matches: [
        {
          id: 1,
          title: "open",
          ended_at: "2026-08-17T00:00:00.000Z",
          players_amount: 4,
          mode_label: "2 vs 2",
          max_points: 150,
          is_closed: 0,
        },
      ],
      games: [
        { id: 10, match_id: 1, game_index: 1, winner_team: "Team 1" },
        { id: 11, match_id: 1, game_index: 2, winner_team: "Team 1" },
      ],
      game_players: [
        { game_id: 10, seat: 1, display_name: "Ana", player_id: 1 },
        { game_id: 10, seat: 2, display_name: "Pedro", player_id: 2 },
        { game_id: 10, seat: 3, display_name: "Luis", player_id: 3 },
        { game_id: 10, seat: 4, display_name: "Maria", player_id: 4 },
        { game_id: 11, seat: 1, display_name: "Cesar", player_id: 5 },
        { game_id: 11, seat: 2, display_name: "Pedro", player_id: 2 },
        { game_id: 11, seat: 3, display_name: "Luis", player_id: 3 },
        { game_id: 11, seat: 4, display_name: "Maria", player_id: 4 },
      ],
      game_team_scores: [...teamScores(10), ...teamScores(11)],
    });

    const out = recomputeAggregatesFromMatches(data);
    const byId = new Map(out.player_stats.map((row) => [row.player_id, row]));
    expect(byId.get(1)?.games_played).toBe(1);
    expect(byId.get(2)?.games_played).toBe(2);
    expect(byId.get(5)?.games_played).toBe(1);
  });

  it("credits closed two-game match seating to every game", () => {
    const data = emptyData({
      matches: [
        {
          id: 1,
          title: "closed",
          ended_at: "2026-08-17T00:00:00.000Z",
          players_amount: 4,
          mode_label: "2 vs 2",
          max_points: 150,
          is_closed: 1,
        },
      ],
      match_players: [
        { match_id: 1, seat: 1, display_name: "Ana", player_id: 1 },
        { match_id: 1, seat: 2, display_name: "Pedro", player_id: 2 },
        { match_id: 1, seat: 3, display_name: "Luis", player_id: 3 },
        { match_id: 1, seat: 4, display_name: "Maria", player_id: 4 },
      ],
      games: [
        { id: 10, match_id: 1, game_index: 1, winner_team: "Team 1" },
        { id: 11, match_id: 1, game_index: 2, winner_team: "Team 1" },
      ],
      game_team_scores: [...teamScores(10), ...teamScores(11)],
    });

    const out = recomputeAggregatesFromMatches(data);
    const byId = new Map(out.player_stats.map((row) => [row.player_id, row]));
    expect(byId.get(1)?.games_played).toBe(2);
    expect(byId.get(3)?.games_played).toBe(2);
  });
});
