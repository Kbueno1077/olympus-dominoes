import { describe, expect, it } from "vitest";
import { sessionStatsFromDetail } from "@/lib/analytics/sessionStats";
import { stylePointsFromDetail } from "@/lib/analytics/stylePoints";
import {
  gamesFromLiveSnapshot,
  matchDetailFromLiveSnapshot,
} from "./fromSnapshot";
import type { LiveWatchGame, LiveWatchSeat, LiveWatchSnapshot } from "./types";

const seats: LiveWatchSeat[] = [
  { seat: 1, displayName: "Ana", playerId: 1 },
  { seat: 2, displayName: "Pedro", playerId: 2 },
  { seat: 3, displayName: "Cesar", playerId: 3 },
  { seat: 4, displayName: "Maria", playerId: 4 },
];

function emptyGame(partial?: Partial<LiveWatchGame>): LiveWatchGame {
  return {
    t1Datas: [],
    t1TotalPoints: 0,
    t1Taken: [],
    t2Datas: [],
    t2TotalPoints: 0,
    t2Taken: [],
    t3Datas: [],
    t3TotalPoints: 0,
    t3Taken: [],
    t4Datas: [],
    t4TotalPoints: 0,
    t4Taken: [],
    winner: "none",
    seats,
    ...partial,
  };
}

const finishedGame = emptyGame({
  t1Datas: [150],
  t1TotalPoints: 150,
  t1Taken: [1],
  t2Datas: [110],
  t2TotalPoints: 110,
  t2Taken: [2],
  winner: "Team 1",
});

const liveHand = emptyGame({
  t1Datas: [40],
  t1TotalPoints: 40,
  t1Taken: [1],
  t2Datas: [25],
  t2TotalPoints: 25,
  t2Taken: [2],
});

function snapshot(
  partial?: Partial<LiveWatchSnapshot>
): LiveWatchSnapshot {
  return {
    matchId: "m-live",
    title: "Thursday night",
    modeLabel: "2 vs 2",
    tileSet: "55",
    maxPoints: 150,
    playersAmount: 4,
    isClosed: true,
    gameIndex: 2,
    completedGames: 1,
    teams: [],
    currentSeats: ["Ana", "Pedro", "Cesar", "Maria"],
    overallLine: "AC 1 – PM 0",
    currentLine: "AC 40 – PM 25",
    updatedAt: 1,
    seats,
    games: [finishedGame],
    currentGame: liveHand,
    ...partial,
  };
}

describe("gamesFromLiveSnapshot", () => {
  it("includes the in-progress pad once a hand is scored", () => {
    const games = gamesFromLiveSnapshot(snapshot());
    expect(games).toHaveLength(2);
    expect(games[1]?.t1TotalPoints).toBe(40);
    expect(games[1]?.winner).toBe("");
  });

  it("skips a blank current game before the first hand", () => {
    const games = gamesFromLiveSnapshot(
      snapshot({ currentGame: emptyGame() })
    );
    expect(games).toHaveLength(1);
    expect(games[0]?.t1TotalPoints).toBe(150);
  });

  it("does not double-count when currentGame is the last finished game", () => {
    const games = gamesFromLiveSnapshot(
      snapshot({ currentGame: finishedGame })
    );
    expect(games).toHaveLength(1);
  });
});

describe("matchDetailFromLiveSnapshot stats", () => {
  it("credits points and hands from the live game before it ends", () => {
    const detail = matchDetailFromLiveSnapshot(snapshot());
    expect(detail).not.toBeNull();
    if (!detail) return;
    const session = sessionStatsFromDetail(detail);
    const ana = session.players.find((row) => row.playerId === 1)?.stats;
    expect(ana?.gamesPlayed).toBe(2);
    expect(ana?.gamesWon).toBe(1);
    expect(ana?.pointsFor).toBe(190);
    expect(ana?.pointsAgainst).toBe(135);
    expect(ana?.handsWon).toBe(2);
    const style = stylePointsFromDetail(detail).get(1);
    expect(style?.maxDataFor).toBe(150);
    expect(style?.minDataFor).toBe(40);
  });

  it("computes first-game stats from the live pad alone", () => {
    const detail = matchDetailFromLiveSnapshot(
      snapshot({
        games: [],
        completedGames: 0,
        gameIndex: 1,
        currentGame: liveHand,
      })
    );
    expect(detail).not.toBeNull();
    if (!detail) return;
    const session = sessionStatsFromDetail(detail);
    const ana = session.players.find((row) => row.playerId === 1)?.stats;
    expect(ana?.gamesPlayed).toBe(1);
    expect(ana?.gamesWon).toBe(0);
    expect(ana?.gamesLost).toBe(0);
    expect(ana?.pointsFor).toBe(40);
    expect(ana?.pointsAgainst).toBe(25);
  });
});
