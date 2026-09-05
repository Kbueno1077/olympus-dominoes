import { describe, expect, it } from "vitest";
import { dedupeNights, findDuplicateNightGroups } from "./dedupeNights";
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

function teamScores(gameId: number, team2 = 90) {
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
      total_points: team2,
      hands_json: "[20,30,40]",
    },
  ];
}

function closedNight(opts: {
  matchId: number;
  gameId: number;
  endedAt: string;
  team2?: number;
}): Pick<
  OlympusExportData["tables"],
  "matches" | "match_players" | "games" | "game_team_scores"
> {
  const { matchId, gameId, endedAt, team2 } = opts;
  return {
    matches: [
      {
        id: matchId,
        title: `night-${matchId}`,
        ended_at: endedAt,
        players_amount: 4,
        mode_label: "2 vs 2",
        max_points: 150,
        is_closed: 1,
      },
    ],
    match_players: [
      { match_id: matchId, seat: 1, display_name: "Ana", player_id: 1 },
      { match_id: matchId, seat: 2, display_name: "Pedro", player_id: 2 },
      { match_id: matchId, seat: 3, display_name: "Luis", player_id: 3 },
      { match_id: matchId, seat: 4, display_name: "Maria", player_id: 4 },
    ],
    games: [
      { id: gameId, match_id: matchId, game_index: 1, winner_team: "Team 1" },
    ],
    game_team_scores: teamScores(gameId, team2),
  };
}

function data(
  ...nights: ReturnType<typeof closedNight>[]
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
    ],
    player_stats: [],
    player_h2h: [],
    matches: nights.flatMap((night) => night.matches ?? []),
    tables: {
      players: [],
      matches: nights.flatMap((night) => night.matches ?? []),
      match_players: nights.flatMap((night) => night.match_players ?? []),
      games: nights.flatMap((night) => night.games ?? []),
      game_team_scores: nights.flatMap((night) => night.game_team_scores ?? []),
    },
  };
}

describe("dedupeNights", () => {
  it("drops a second import of the same night and keeps the lowest match id", () => {
    const before = data(
      closedNight({
        matchId: 10,
        gameId: 100,
        endedAt: "2026-04-20T23:15:00.000Z",
      }),
      closedNight({
        matchId: 11,
        gameId: 101,
        endedAt: "2026-04-20T23:15:00.000Z",
      }),
      closedNight({
        matchId: 20,
        gameId: 200,
        endedAt: "2026-05-01T20:00:00.000Z",
      })
    );

    const groups = findDuplicateNightGroups(before);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.keepMatchId).toBe(10);
    expect(groups[0]?.dropMatchIds).toEqual([11]);

    const after = dedupeNights(before);
    expect(after.droppedCount).toBe(1);
    const ids = (after.data.tables.matches ?? []).map((row) => row.id);
    expect(ids).toEqual([10, 20]);
    const ana = after.data.player_stats.find((row) => row.player_id === 1);
    expect(ana?.games_played).toBe(2);
  });

  it("does not collapse nights with different scores", () => {
    const before = data(
      closedNight({
        matchId: 1,
        gameId: 10,
        endedAt: "2026-04-20T20:00:00.000Z",
        team2: 90,
      }),
      closedNight({
        matchId: 2,
        gameId: 11,
        endedAt: "2026-04-20T20:00:00.000Z",
        team2: 40,
      })
    );
    expect(findDuplicateNightGroups(before)).toEqual([]);
    expect(dedupeNights(before).droppedCount).toBe(0);
  });
});
