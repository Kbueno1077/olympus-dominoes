import { describe, expect, it } from "vitest";
import {
  computeHistoryMatchStatsDelta,
  type MatchGame,
  type NamedSeat,
} from "./matchStats";

function namedSeats2v2(
  overrides?: Partial<Record<number, Partial<NamedSeat>>>
): NamedSeat[] {
  const base: NamedSeat[] = [
    { seat: 1, displayName: "Ana", playerId: 1 },
    { seat: 2, displayName: "Pedro", playerId: 2 },
    { seat: 3, displayName: "Luis", playerId: 3 },
    { seat: 4, displayName: "Maria", playerId: 4 },
  ];
  return base.map((seat) => ({ ...seat, ...overrides?.[seat.seat] }));
}

function normalWinGame(): MatchGame {
  return {
    t1Datas: [50, 50, 50],
    t1TotalPoints: 150,
    t2Datas: [20, 30, 40],
    t2TotalPoints: 90,
    t3Datas: [],
    t3TotalPoints: 0,
    t4Datas: [],
    t4TotalPoints: 0,
    winner: "Team 1",
  };
}

function byId(
  stats: ReturnType<typeof computeHistoryMatchStatsDelta>["playerStats"]
) {
  return new Map(stats.map((row) => [row.playerId, row]));
}

describe("computeHistoryMatchStatsDelta", () => {
  it("credits closed matches with one seating for every game", () => {
    const closed = computeHistoryMatchStatsDelta({
      isClosed: true,
      modeLabel: "2 vs 2",
      playersAmount: 4,
      matchSeats: namedSeats2v2(),
      games: [
        { game: normalWinGame(), seats: [] },
        { game: normalWinGame(), seats: [] },
      ],
    });
    const map = byId(closed.playerStats);
    expect(map.get(1)!.gamesPlayed).toBe(2);
    expect(map.get(3)!.gamesPlayed).toBe(2);
  });

  it("credits open-table sitters only for the games they sat", () => {
    const game2Seats = namedSeats2v2({
      1: { displayName: "Cesar", playerId: 5 },
    });
    const delta = computeHistoryMatchStatsDelta({
      isClosed: false,
      modeLabel: "2 vs 2",
      playersAmount: 4,
      matchSeats: [],
      games: [
        { game: normalWinGame(), seats: namedSeats2v2() },
        { game: normalWinGame(), seats: game2Seats },
      ],
    });
    const map = byId(delta.playerStats);

    expect(map.get(1)!.gamesPlayed).toBe(1);
    expect(map.get(5)!.gamesPlayed).toBe(1);
    expect(map.get(3)!.gamesPlayed).toBe(2);
    expect(map.get(2)!.gamesPlayed).toBe(2);
  });
});
