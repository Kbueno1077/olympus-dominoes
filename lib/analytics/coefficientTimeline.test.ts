import { describe, expect, it } from "vitest";
import {
  buildCoefficientTimeline,
  coefficientAxisTicks,
  mapTimelineScores,
  thinTimelinePoints,
  timelinePointsForPlayers,
  timelineStockToJosesInput,
  timelineWindowStart,
} from "./coefficientTimeline";
import { computeJosesCoefficient } from "./joseCoefficient";
import { recomputeAggregatesFromMatches } from "./recomputeFromMatches";
import type { OlympusExportData } from "./types";

function player(
  id: number,
  name: string,
  hidden = false
): OlympusExportData["players"][number] {
  return {
    id,
    name,
    name_key: name.toLowerCase(),
    public_id: `${name}PublicId0001`.slice(0, 16),
    created_at: null,
    is_myself: 0,
    is_hidden: hidden ? 1 : 0,
  };
}

function emptyData(
  tables: OlympusExportData["tables"],
  players: OlympusExportData["players"]
): OlympusExportData {
  return {
    source: "csv",
    fileName: "test.csv",
    importedAt: "2026-08-17T00:00:00.000Z",
    players,
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

const roster = [
  player(1, "Ana"),
  player(2, "Pedro"),
  player(3, "Luis"),
  player(4, "Maria"),
  player(5, "Cesar"),
];

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

function closedMatch(options: {
  id: number;
  title: string;
  endedAt: string;
  modeLabel: string;
  tileSet?: "55" | "28";
  playersAmount: number;
  seats: { seat: number; name: string; playerId: number }[];
  gameId: number;
}) {
  return {
    match: {
      id: options.id,
      title: options.title,
      ended_at: options.endedAt,
      players_amount: options.playersAmount,
      mode_label: options.modeLabel,
      tile_set: options.tileSet ?? "55",
      max_points: 150,
      is_closed: 1,
    },
    seats: options.seats.map((seat) => ({
      match_id: options.id,
      seat: seat.seat,
      display_name: seat.name,
      player_id: seat.playerId,
    })),
    game: {
      id: options.gameId,
      match_id: options.id,
      game_index: 1,
      winner_team: "Team 1",
    },
    scores: teamScores(options.gameId),
  };
}

const four = [
  { seat: 1, name: "Ana", playerId: 1 },
  { seat: 2, name: "Pedro", playerId: 2 },
  { seat: 3, name: "Luis", playerId: 3 },
  { seat: 4, name: "Maria", playerId: 4 },
];

const withoutAna = [
  { seat: 1, name: "Cesar", playerId: 5 },
  { seat: 2, name: "Pedro", playerId: 2 },
  { seat: 3, name: "Luis", playerId: 3 },
  { seat: 4, name: "Maria", playerId: 4 },
];

function dataFrom(
  parts: ReturnType<typeof closedMatch>[],
  players: OlympusExportData["players"] = roster
) {
  return emptyData(
    {
      matches: parts.map((part) => part.match),
      match_players: parts.flatMap((part) => part.seats),
      games: parts.map((part) => part.game),
      game_team_scores: parts.flatMap((part) => part.scores),
    },
    players
  );
}

function scoreOf(
  timeline: ReturnType<typeof buildCoefficientTimeline>,
  pointIndex: number,
  playerId: number
) {
  const stock = timeline.points[pointIndex]?.stocks[playerId];
  if (!stock) return null;
  return computeJosesCoefficient(timelineStockToJosesInput(stock));
}

describe("coefficientAxisTicks", () => {
  it("uses the coefficient scale, not raw point totals", () => {
    const ticks = coefficientAxisTicks(-61.5, 41.6);
    expect(ticks[0]).toBeLessThanOrEqual(-61.5);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(41.6);
    expect(Math.max(...ticks.map((tick) => Math.abs(tick)))).toBeLessThan(200);
    for (let i = 1; i < ticks.length; i += 1) {
      expect(ticks[i]! - ticks[i - 1]!).toBeCloseTo(
        ticks[1]! - ticks[0]!,
        5
      );
    }
  });
});

describe("timelineWindowStart", () => {
  it("opens on the newest dates and clamps a scroll", () => {
    expect(timelineWindowStart(20, 6, null)).toBe(14);
    expect(timelineWindowStart(20, 15, null)).toBe(5);
    expect(timelineWindowStart(4, 6, null)).toBe(0);
    expect(timelineWindowStart(20, 6, 3)).toBe(3);
    expect(timelineWindowStart(20, 6, -4)).toBe(0);
    expect(timelineWindowStart(20, 6, 99)).toBe(14);
  });
});

describe("timelinePointsForPlayers", () => {
  it("drops a date when every player who sat it is off the chart", () => {
    const points = [
      { title: "March", playedIds: [1, 2, 3, 4] },
      { title: "April", playedIds: [5, 2, 3, 4] },
    ];

    expect(
      timelinePointsForPlayers(points, new Set([1])).map((point) => point.title)
    ).toEqual(["March"]);
    expect(
      timelinePointsForPlayers(points, new Set([2])).map((point) => point.title)
    ).toEqual(["March", "April"]);
    expect(timelinePointsForPlayers(points, new Set())).toEqual([]);
  });
});

describe("thinTimelinePoints", () => {
  it("keeps every match at stride 1 and always keeps the newest", () => {
    const points = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    expect(thinTimelinePoints(points, 1)).toEqual(points);
    expect(thinTimelinePoints(points, 5)).toEqual([0, 5, 10, 11]);
    expect(thinTimelinePoints(points.slice(0, 11), 5)).toEqual([0, 5, 10]);
  });
});

describe("buildCoefficientTimeline", () => {
  const march = closedMatch({
    id: 2,
    title: "March",
    endedAt: "2026-03-15T18:00:00.000Z",
    modeLabel: "2 vs 2",
    playersAmount: 4,
    seats: four,
    gameId: 20,
  });
  const april = closedMatch({
    id: 1,
    title: "April",
    endedAt: "2026-04-20T18:00:00.000Z",
    modeLabel: "2 vs 2",
    playersAmount: 4,
    seats: withoutAna,
    gameId: 10,
  });

  it("walks matches oldest first and carries a sitter's coefficient", () => {
    const data = dataFrom([april, march]);
    const timeline = buildCoefficientTimeline(data, {
      modeLabel: "2 vs 2",
      tileSet: "55",
    });

    expect(timeline.points.map((point) => point.matchId)).toEqual([2, 1]);
    expect([...(timeline.points[0]?.playedIds ?? [])].sort()).toEqual([
      1, 2, 3, 4,
    ]);
    expect([...(timeline.points[1]?.playedIds ?? [])].sort()).toEqual([
      2, 3, 4, 5,
    ]);
    expect(scoreOf(timeline, 0, 1)).not.toBeNull();
    expect(timeline.points[1]?.stocks[1]).toEqual(timeline.points[0]?.stocks[1]);
    expect(timeline.points[0]?.stocks[2]?.gamesPlayed).toBe(1);
    expect(timeline.points[1]?.stocks[2]?.gamesPlayed).toBe(2);
    expect(scoreOf(timeline, 1, 2)).not.toBe(scoreOf(timeline, 0, 2));

    const scored = mapTimelineScores(timeline, (stock) =>
      computeJosesCoefficient(timelineStockToJosesInput(stock))
    );
    expect(scored[1]?.values[1]).toBe(scored[0]?.values[1]);
    expect(scored[0]?.values[5]).toBeUndefined();
    expect(scored[1]?.values[5]).toEqual(expect.any(Number));

    const rebuilt = recomputeAggregatesFromMatches(data);
    const pedro = rebuilt.player_stats.find((row) => row.player_id === 2);
    const lastPedro = timeline.points[1]?.stocks[2];
    expect(lastPedro?.gamesPlayed).toBe(pedro?.games_played);
    expect(
      lastPedro
        ? computeJosesCoefficient(timelineStockToJosesInput(lastPedro))
        : null
    ).toBe(pedro?.joses_coefficient);
  });

  it("keeps only matches inside the date range", () => {
    const data = dataFrom([march, april]);
    const timeline = buildCoefficientTimeline(data, {
      modeLabel: "2 vs 2",
      tileSet: "55",
      dateRange: { startDate: "2026-04-01", endDate: "2026-04-30" },
    });

    expect(timeline.points.map((point) => point.title)).toEqual(["April"]);
    expect(timeline.players.some((player) => player.playerId === 1)).toBe(
      false
    );
    expect(timeline.points[0]?.stocks[2]?.gamesPlayed).toBe(1);
  });

  it("pools every mode when no mode is set, and can stay on one mode", () => {
    const singles = closedMatch({
      id: 3,
      title: "Singles",
      endedAt: "2026-05-01T18:00:00.000Z",
      modeLabel: "1 vs 1",
      playersAmount: 2,
      seats: [
        { seat: 1, name: "Ana", playerId: 1 },
        { seat: 2, name: "Pedro", playerId: 2 },
      ],
      gameId: 30,
    });
    const data = dataFrom([march, singles]);

    const filtered = buildCoefficientTimeline(data, {
      modeLabel: "2 vs 2",
      tileSet: "55",
    });
    expect(filtered.points).toHaveLength(1);
    expect(filtered.points[0]?.stocks[1]?.gamesPlayed).toBe(1);

    const global = buildCoefficientTimeline(data);
    expect(global.points.map((point) => point.matchId)).toEqual([2, 3]);
    expect(global.points[1]?.stocks[1]?.gamesPlayed).toBe(2);
  });

  it("drops matches from another tile set", () => {
    const doubles28 = closedMatch({
      id: 4,
      title: "Double-six",
      endedAt: "2026-06-01T18:00:00.000Z",
      modeLabel: "2 vs 2",
      tileSet: "28",
      playersAmount: 4,
      seats: four,
      gameId: 40,
    });
    const data = dataFrom([march, doubles28]);
    const timeline = buildCoefficientTimeline(data, {
      modeLabel: "2 vs 2",
      tileSet: "55",
    });

    expect(timeline.points.map((point) => point.matchId)).toEqual([2]);
    expect(timeline.points[0]?.stocks[1]?.gamesPlayed).toBe(1);
  });

  it("omits hidden players without dropping their partners", () => {
    const data = dataFrom(
      [march],
      roster.map((person) =>
        person.id === 4 ? player(4, "Maria", true) : person
      )
    );
    const timeline = buildCoefficientTimeline(data, { modeLabel: "2 vs 2" });

    expect(timeline.players.map((person) => person.playerId)).not.toContain(4);
    expect(timeline.points[0]?.stocks[1]?.gamesPlayed).toBe(1);
    expect(timeline.points[0]?.stocks[4]).toBeUndefined();
    expect(timeline.points[0]?.playedIds).not.toContain(4);
  });

  it("records an open table as one match, crediting only who sat", () => {
    const data = emptyData(
      {
        matches: [
          {
            id: 1,
            title: "open",
            ended_at: "2026-08-17T00:00:00.000Z",
            players_amount: 4,
            mode_label: "2 vs 2",
            tile_set: "55",
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
      },
      roster
    );

    const timeline = buildCoefficientTimeline(data, { modeLabel: "2 vs 2" });
    expect(timeline.points).toHaveLength(1);
    expect(timeline.points[0]?.stocks[1]?.gamesPlayed).toBe(1);
    expect(timeline.points[0]?.stocks[2]?.gamesPlayed).toBe(2);
    expect(timeline.points[0]?.stocks[5]?.gamesPlayed).toBe(1);
  });
});
