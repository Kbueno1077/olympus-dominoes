import { describe, expect, it } from "vitest";
import {
  buildPodium,
  PODIUM_RATE_MIN_GAMES,
  type PodiumPlayerRow,
} from "./podium";

function row(
  overrides: Partial<PodiumPlayerRow> &
    Pick<PodiumPlayerRow, "playerId" | "playerName">
): PodiumPlayerRow {
  return {
    gamesPlayed: 10,
    gamesWon: 5,
    gamesLost: 5,
    pointsFor: 100,
    pointsAgainst: 100,
    handsWon: 10,
    handsLost: 10,
    handsPlayed: 20,
    handsFor: 10,
    handsAgainst: 10,
    pollosFor: 0,
    pollosAgainst: 0,
    zapatosFor: 0,
    zapatosAgainst: 0,
    josesCoefficient: 0,
    ...overrides,
  };
}

describe("buildPodium", () => {
  it("ranks glory, grind, and shame categories with winner and runner-up", () => {
    const podium = buildPodium([
      row({
        playerId: 1,
        playerName: "Ana",
        gamesPlayed: 20,
        gamesWon: 14,
        gamesLost: 6,
        josesCoefficient: 12,
        handsWon: 30,
        handsLost: 10,
        handsPlayed: 40,
        handsFor: 30,
        handsAgainst: 10,
        pointsFor: 400,
        pointsAgainst: 200,
        pollosFor: 5,
        pollosAgainst: 1,
        zapatosFor: 3,
        zapatosAgainst: 0,
      }),
      row({
        playerId: 2,
        playerName: "Ben",
        gamesPlayed: 15,
        gamesWon: 4,
        gamesLost: 11,
        josesCoefficient: 2,
        handsWon: 12,
        handsLost: 20,
        handsPlayed: 32,
        handsFor: 12,
        handsAgainst: 20,
        pointsFor: 150,
        pointsAgainst: 300,
        pollosFor: 1,
        pollosAgainst: 4,
        zapatosFor: 0,
        zapatosAgainst: 5,
      }),
      row({
        playerId: 3,
        playerName: "Cara",
        gamesPlayed: 8,
        gamesWon: 3,
        gamesLost: 5,
        josesCoefficient: 5,
        handsWon: 8,
        handsLost: 9,
        handsPlayed: 17,
        handsFor: 8,
        handsAgainst: 9,
        pointsFor: 120,
        pointsAgainst: 140,
        pollosFor: 2,
        pollosAgainst: 2,
        zapatosFor: 1,
        zapatosAgainst: 1,
      }),
    ]);

    const byId = Object.fromEntries(podium.map((c) => [c.id, c]));

    expect(byId.jose.kind).toBe("glory");
    expect(byId.jose.winner?.playerName).toBe("Ana");
    expect(byId.jose.runnerUp?.playerName).toBe("Cara");

    expect(byId.games.kind).toBe("grind");
    expect(byId.games.winner?.playerName).toBe("Ana");
    expect(byId.games.winner?.display).toBe("20");

    expect(byId.hands.winner?.playerName).toBe("Ana");

    expect(byId.bestLoser.kind).toBe("shame");
    expect(byId.bestLoser.winner?.playerName).toBe("Ben");
    expect(byId.bestLoser.winner?.value).toBe(11);
    expect(byId.bestLoser.runnerUp?.playerName).toBe("Ana");

    expect(byId.keepsComing.winner?.playerName).toBe("Ben");
    expect(byId.keepsComing.runnerUp?.playerName).toBe("Cara");

    expect(byId.pollosEaten.winner?.playerName).toBe("Ben");
    expect(byId.zapatosEaten.winner?.playerName).toBe("Ben");
  });

  it("excludes winners from keepsComing and does not fall back to them", () => {
    const podium = buildPodium([
      row({
        playerId: 1,
        playerName: "Winner",
        gamesPlayed: 50,
        gamesWon: 40,
        gamesLost: 10,
      }),
      row({
        playerId: 2,
        playerName: "Stubborn",
        gamesPlayed: 12,
        gamesWon: 4,
        gamesLost: 8,
      }),
    ]);
    const keeps = podium.find((c) => c.id === "keepsComing")!;
    expect(keeps.winner?.playerName).toBe("Stubborn");
    expect(keeps.runnerUp).toBeNull();
  });

  it("requires rate min games for pollo/zapato rates", () => {
    const podium = buildPodium([
      row({
        playerId: 1,
        playerName: "Hot",
        gamesPlayed: PODIUM_RATE_MIN_GAMES - 1,
        pollosFor: 10,
        zapatosFor: 10,
      }),
      row({
        playerId: 2,
        playerName: "Steady",
        gamesPlayed: PODIUM_RATE_MIN_GAMES,
        pollosFor: 3,
        zapatosFor: 2,
      }),
    ]);
    const polloRate = podium.find((c) => c.id === "polloRate")!;
    expect(polloRate.winner?.playerName).toBe("Steady");
    expect(polloRate.runnerUp).toBeNull();
  });

  it("tie-breaks by games played then name", () => {
    const podium = buildPodium([
      row({
        playerId: 1,
        playerName: "Zoe",
        gamesPlayed: 10,
        gamesLost: 7,
        gamesWon: 3,
      }),
      row({
        playerId: 2,
        playerName: "Amy",
        gamesPlayed: 10,
        gamesLost: 7,
        gamesWon: 3,
      }),
    ]);
    const bestLoser = podium.find((c) => c.id === "bestLoser")!;
    expect(bestLoser.winner?.playerName).toBe("Amy");
    expect(bestLoser.runnerUp?.playerName).toBe("Zoe");
  });

  it("ranks style categories with higher/lower directions", () => {
    const podium = buildPodium(
      [],
      [
        {
          playerId: 1,
          playerName: "Ana",
          gamesPlayed: 10,
          maxDataFor: 80,
          minDataFor: 20,
          maxDataAgainst: 40,
          minDataAgainst: 10,
          maxDatasToWin: 5,
          minDatasToWin: 1,
          maxDatasToLose: 4,
          minDatasToLose: 0,
        },
        {
          playerId: 2,
          playerName: "Ben",
          gamesPlayed: 8,
          maxDataFor: 60,
          minDataFor: 15,
          maxDataAgainst: 90,
          minDataAgainst: 5,
          maxDatasToWin: 3,
          minDatasToWin: 2,
          maxDatasToLose: 6,
          minDatasToLose: 1,
        },
      ]
    );
    const byId = Object.fromEntries(podium.map((c) => [c.id, c]));

    expect(byId.maxDataFor.kind).toBe("style");
    expect(byId.maxDataFor.winner?.playerName).toBe("Ana");
    expect(byId.minDatasToWin.winner?.playerName).toBe("Ana");
    expect(byId.maxDatasToWin.winner?.playerName).toBe("Ana");
    expect(byId.maxDatasToLose.winner?.playerName).toBe("Ben");
    expect(byId.minDatasToLose.winner?.playerName).toBe("Ana");
    expect(byId.maxDataAgainst.winner?.playerName).toBe("Ben");
  });
});
