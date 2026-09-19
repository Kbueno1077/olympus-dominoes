import type { LeaderboardRow } from "@/lib/analytics/types";
import { describe, expect, it } from "vitest";
import {
  defaultLivePins,
  labPlayerIdFromStats,
  labPlayersFromLeaderboard,
} from "./fromDataset";
import { personName } from "./data";

function row(
  overrides: Partial<LeaderboardRow> & Pick<LeaderboardRow, "playerId" | "playerName">
): LeaderboardRow {
  return {
    modeLabel: "2 vs 2",
    tileSet: "55",
    gamesPlayed: 10,
    gamesWon: 6,
    gamesLost: 4,
    pointsFor: 1600,
    pointsAgainst: 1400,
    handsFor: 40,
    handsAgainst: 30,
    handsWon: 40,
    handsLost: 30,
    handsPlayed: 70,
    pollosFor: 2,
    pollosAgainst: 1,
    zapatosFor: 1,
    zapatosAgainst: 0,
    josesCoefficient: 1,
    isMyself: false,
    ...overrides,
  };
}

describe("labPlayersFromLeaderboard", () => {
  it("maps Stats rows onto F-lab stocks with nets from for/against", () => {
    const [player] = labPlayersFromLeaderboard([
      row({
        playerId: 12,
        playerName: "Kevin",
        gamesPlayed: 55,
        gamesWon: 26,
        gamesLost: 29,
        handsWon: 165,
        handsLost: 169,
        pointsFor: 6660,
        pointsAgainst: 6716,
        pollosFor: 9,
        pollosAgainst: 4,
        zapatosFor: 4,
        zapatosAgainst: 5,
      }),
    ]);

    expect(player.id).toBe(labPlayerIdFromStats(12));
    expect(player.dataset).toBe("live");
    expect(player.kind).toBe("csv");
    expect(personName(player)).toBe("Kevin");
    expect(player.G).toBe(55);
    expect(player.W).toBe(26);
    expect(player.L).toBe(29);
    expect(player.dDW).toBe(-4);
    expect(player.dPF).toBe(-56);
    expect(player.dPo).toBe(5);
    expect(player.dZap).toBe(-1);
    expect(player.HF).toBe(165);
    expect(player.PA).toBe(6716);
  });
});

describe("defaultLivePins", () => {
  it("pins the static Panteon names when they appear in the active set", () => {
    const players = labPlayersFromLeaderboard([
      row({ playerId: 1, playerName: "Ana", gamesPlayed: 80 }),
      row({ playerId: 2, playerName: "Jose", gamesPlayed: 12 }),
      row({ playerId: 3, playerName: "Kevin", gamesPlayed: 8 }),
    ]);
    expect(defaultLivePins(players)).toEqual([
      labPlayerIdFromStats(2),
      labPlayerIdFromStats(3),
    ]);
  });

  it("falls back to the six busiest seasons", () => {
    const players = labPlayersFromLeaderboard(
      Array.from({ length: 8 }, (_, i) =>
        row({
          playerId: i + 1,
          playerName: `P${i + 1}`,
          gamesPlayed: 10 - i,
        })
      )
    );
    expect(defaultLivePins(players)).toEqual(
      [1, 2, 3, 4, 5, 6].map(labPlayerIdFromStats)
    );
  });
});
