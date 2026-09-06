import { describe, expect, it } from "vitest";
import type { HistoryGame, HistorySeat, MatchDetail } from "./history";
import { sessionStatsFromDetail } from "./sessionStats";

function seat(
  n: number,
  name: string,
  playerId: number | null
): HistorySeat {
  return { seat: n, displayName: name, playerId };
}

function winGame(seats: HistorySeat[]): HistoryGame {
  return {
    t1Datas: [50, 50, 50],
    t1TotalPoints: 150,
    t1Taken: [],
    t2Datas: [20, 30, 40],
    t2TotalPoints: 90,
    t2Taken: [],
    t3Datas: [],
    t3TotalPoints: 0,
    t3Taken: [],
    t4Datas: [],
    t4TotalPoints: 0,
    t4Taken: [],
    winner: "Team 1",
    seats,
  };
}

const closedSeats = [
  seat(1, "Ana", 1),
  seat(2, "Pedro", 2),
  seat(3, "Luis", 3),
  seat(4, "Maria", 4),
];

function detail(partial?: Partial<MatchDetail>): MatchDetail {
  return {
    id: 10,
    title: "night",
    endedAt: "2026-04-20T12:00:00.000Z",
    playersAmount: 4,
    modeLabel: "2 vs 2",
    tileSet: "55",
    maxPoints: 150,
    isClosed: true,
    seats: closedSeats,
    games: [winGame(closedSeats)],
    ...partial,
  };
}

describe("sessionStatsFromDetail", () => {
  it("only lists people who sat this match and credits this night only", () => {
    const session = sessionStatsFromDetail(detail());
    expect(session.matchId).toBe(10);
    expect(session.players.map((row) => row.name)).toEqual([
      "Ana",
      "Pedro",
      "Luis",
      "Maria",
    ]);
    const ana = session.players.find((row) => row.playerId === 1)?.stats;
    expect(ana?.gamesPlayed).toBe(1);
    expect(ana?.gamesWon).toBe(1);
    const pedro = session.players.find((row) => row.playerId === 2)?.stats;
    expect(pedro?.gamesWon).toBe(0);
    expect(pedro?.gamesLost).toBe(1);
    expect(session.h2h.every((row) => [1, 2, 3, 4].includes(row.playerId))).toBe(
      true
    );
    expect(session.players.find((row) => row.playerId === 1)?.teamNumber).toBe(1);
    expect(session.players.find((row) => row.playerId === 2)?.teamNumber).toBe(2);
    expect(session.teams.map((team) => team.label)).toEqual(["AL", "PM"]);
  });

  it("on an open table, includes sitters from later games only when they sat", () => {
    const first = closedSeats;
    const second = [
      seat(1, "Cesar", 5),
      seat(2, "Pedro", 2),
      seat(3, "Luis", 3),
      seat(4, "Maria", 4),
    ];
    const session = sessionStatsFromDetail(
      detail({
        isClosed: false,
        seats: [],
        games: [winGame(first), winGame(second)],
      })
    );
    expect(session.players.map((row) => row.playerId)).toEqual([1, 2, 3, 4, 5]);
    expect(
      session.players.find((row) => row.playerId === 1)?.stats?.gamesPlayed
    ).toBe(1);
    expect(
      session.players.find((row) => row.playerId === 5)?.stats?.gamesPlayed
    ).toBe(1);
    expect(
      session.players.find((row) => row.playerId === 2)?.stats?.gamesPlayed
    ).toBe(2);
  });
});
