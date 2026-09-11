import { describe, expect, it } from "vitest";
import type { HistoryGame, HistorySeat, MatchDetail } from "./history";
import type { MatchGame, NamedSeat } from "./matchStats";
import {
  accumulateStylePoints,
  stylePointsFromData,
  stylePointsFromDetail,
} from "./stylePoints";
import type { OlympusExportData } from "./types";

function seats2v2(): NamedSeat[] {
  return [
    { seat: 1, displayName: "Ana", playerId: 1 },
    { seat: 2, displayName: "Pedro", playerId: 2 },
    { seat: 3, displayName: "Luis", playerId: 3 },
    { seat: 4, displayName: "Maria", playerId: 4 },
  ];
}

function historySeats(): HistorySeat[] {
  return seats2v2();
}

function game(partial: Partial<MatchGame>): MatchGame {
  return {
    t1Datas: [],
    t1TotalPoints: 0,
    t2Datas: [],
    t2TotalPoints: 0,
    t3Datas: [],
    t3TotalPoints: 0,
    t4Datas: [],
    t4TotalPoints: 0,
    winner: "none",
    ...partial,
  };
}

describe("accumulateStylePoints", () => {
  it("tracks biggest/smallest single datas and datas to win or lose", () => {
    const acc = new Map();
    accumulateStylePoints(acc, {
      modeLabel: "2 vs 2",
      playersAmount: 4,
      seats: seats2v2(),
      games: [
        {
          game: game({
            t1Datas: [50, 50, 50],
            t1TotalPoints: 150,
            t2Datas: [20, 30, 40],
            t2TotalPoints: 90,
            winner: "Team 1",
          }),
          seats: seats2v2(),
        },
        {
          game: game({
            t1Datas: [80],
            t1TotalPoints: 80,
            t2Datas: [],
            t2TotalPoints: 0,
            winner: "Team 1",
          }),
          seats: seats2v2(),
        },
      ],
    });

    const ana = acc.get(1)!;
    expect(ana.maxDataFor).toBe(80);
    expect(ana.minDataFor).toBe(50);
    expect(ana.maxDataAgainst).toBe(40);
    expect(ana.minDataAgainst).toBe(20);
    expect(ana.maxDatasToWin).toBe(3);
    expect(ana.minDatasToWin).toBe(1);
    expect(ana.maxDatasToLose).toBeNull();
    expect(ana.minDatasToLose).toBeNull();

    const pedro = acc.get(2)!;
    expect(pedro.maxDataFor).toBe(40);
    expect(pedro.minDataFor).toBe(20);
    expect(pedro.maxDataAgainst).toBe(80);
    expect(pedro.minDataAgainst).toBe(50);
    expect(pedro.maxDatasToLose).toBe(3);
    expect(pedro.minDatasToLose).toBe(0);
    expect(pedro.maxDatasToWin).toBeNull();
  });
});

describe("stylePointsFromDetail", () => {
  it("uses per-game seats on an open table", () => {
    const closed: HistorySeat[] = historySeats();
    const later: HistorySeat[] = [
      { seat: 1, displayName: "Cesar", playerId: 5 },
      { seat: 2, displayName: "Pedro", playerId: 2 },
      { seat: 3, displayName: "Luis", playerId: 3 },
      { seat: 4, displayName: "Maria", playerId: 4 },
    ];
    const asHistory = (g: MatchGame, seats: HistorySeat[]): HistoryGame => ({
      t1Datas: g.t1Datas,
      t1TotalPoints: g.t1TotalPoints,
      t1Taken: [],
      t2Datas: g.t2Datas,
      t2TotalPoints: g.t2TotalPoints,
      t2Taken: [],
      t3Datas: g.t3Datas,
      t3TotalPoints: g.t3TotalPoints,
      t3Taken: [],
      t4Datas: g.t4Datas,
      t4TotalPoints: g.t4TotalPoints,
      t4Taken: [],
      winner: g.winner,
      seats,
    });
    const detail: MatchDetail = {
      id: 1,
      title: "open",
      endedAt: "2026-04-20T12:00:00.000Z",
      playersAmount: 4,
      modeLabel: "2 vs 2",
      tileSet: "55",
      maxPoints: 150,
      isClosed: false,
      seats: [],
      games: [
        asHistory(
          game({
            t1Datas: [60],
            t1TotalPoints: 60,
            t2Datas: [10],
            t2TotalPoints: 10,
            winner: "Team 1",
          }),
          closed
        ),
        asHistory(
          game({
            t1Datas: [25, 25],
            t1TotalPoints: 50,
            t2Datas: [15],
            t2TotalPoints: 15,
            winner: "Team 1",
          }),
          later
        ),
      ],
    };

    const map = stylePointsFromDetail(detail);
    expect(map.get(1)?.maxDataFor).toBe(60);
    expect(map.get(5)?.maxDataFor).toBe(25);
    expect(map.get(5)?.minDatasToWin).toBe(2);
    expect(map.get(1)?.maxDatasToWin).toBe(1);
  });
});

function styleExport(
  tables: OlympusExportData["tables"]
): OlympusExportData {
  return {
    source: "csv",
    fileName: "test.csv",
    importedAt: "2026-08-17T00:00:00.000Z",
    players: [
      { id: 1, name: "Ana", name_key: "ana", public_id: "anaPublicId00001", created_at: null, is_myself: 0 },
      { id: 2, name: "Pedro", name_key: "pedro", public_id: "pedroPublicId001", created_at: null, is_myself: 0 },
      { id: 3, name: "Luis", name_key: "luis", public_id: "luisPublicId0001", created_at: null, is_myself: 0 },
      { id: 4, name: "Maria", name_key: "maria", public_id: "mariaPublicId001", created_at: null, is_myself: 0 },
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

describe("stylePointsFromData matchup filter", () => {
  it("keeps extrema only from nights that match the Compare seating", () => {
    const data = styleExport({
      matches: [
        {
          id: 1,
          title: "night",
          ended_at: "2026-08-17T00:00:00.000Z",
          players_amount: 4,
          mode_label: "2 vs 2",
          tile_set: "55",
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
      games: [{ id: 10, match_id: 1, game_index: 1, winner_team: "Team 1" }],
      game_team_scores: [
        {
          game_id: 10,
          team_number: 1,
          total_points: 150,
          hands_json: "[80,70]",
        },
        {
          game_id: 10,
          team_number: 2,
          total_points: 40,
          hands_json: "[40]",
        },
      ],
    });

    const all = stylePointsFromData(data, { modeLabel: "2 vs 2", tileSet: "55" });
    expect(all.get(1)?.maxDataFor).toBe(80);

    const matchup = stylePointsFromData(data, {
      modeLabel: "2 vs 2",
      tileSet: "55",
      matchup: {
        players: [
          { playerId: 1, team: 1 },
          { playerId: 2, team: 2 },
        ],
      },
    });
    expect(matchup.get(1)?.maxDataFor).toBe(80);

    const miss = stylePointsFromData(data, {
      modeLabel: "2 vs 2",
      tileSet: "55",
      matchup: {
        players: [
          { playerId: 1, team: 1 },
          { playerId: 99, team: 2 },
        ],
      },
    });
    expect(miss.get(1)).toBeUndefined();
  });
});
