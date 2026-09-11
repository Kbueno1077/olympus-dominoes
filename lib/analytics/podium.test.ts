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
    expect(byId.jose.first.map((p) => p.playerName)).toEqual(["Ana"]);
    expect(byId.jose.second.map((p) => p.playerName)).toEqual(["Cara"]);

    expect(byId.games.kind).toBe("grind");
    expect(byId.games.first[0]?.playerName).toBe("Ana");
    expect(byId.games.first[0]?.display).toBe("20");

    expect(byId.hands.first[0]?.playerName).toBe("Ana");

    expect(byId.bestLoser.kind).toBe("shame");
    expect(byId.bestLoser.first[0]?.playerName).toBe("Ben");
    expect(byId.bestLoser.first[0]?.value).toBe(11);
    expect(byId.bestLoser.second[0]?.playerName).toBe("Ana");

    expect(byId.keepsComing.first[0]?.playerName).toBe("Ben");
    expect(byId.keepsComing.second[0]?.playerName).toBe("Cara");
    expect(byId.keepsComing.first[0]?.display).toBe("11 / 15");

    expect(byId.floor.first[0]?.playerName).toBe("Ben");
    expect(byId.atm.first[0]?.playerName).toBe("Ben");
    expect(byId.atm.first[0]?.display).toBe("-150");
    expect(byId.polloEatenRate.first[0]?.playerName).toBe("Ben");

    expect(byId.pollosEaten.first[0]?.playerName).toBe("Ben");
    expect(byId.zapatosEaten.first[0]?.playerName).toBe("Ben");
    expect(byId.minDatasToLose).toBeUndefined();
  });

  it("ranks keepsComing by losses among losing records, not a tiny 100%", () => {
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
        playerName: "Grinder",
        gamesPlayed: 12,
        gamesWon: 4,
        gamesLost: 8,
      }),
      row({
        playerId: 3,
        playerName: "Perfect",
        gamesPlayed: 2,
        gamesWon: 0,
        gamesLost: 2,
      }),
    ]);
    const keeps = podium.find((c) => c.id === "keepsComing")!;
    expect(keeps.first[0]?.playerName).toBe("Grinder");
    expect(keeps.first[0]?.display).toBe("8 / 12");
    expect(keeps.second[0]?.playerName).toBe("Perfect");
    expect(keeps.second[0]?.display).toBe("2 / 2");
  });

  it("does not snark-tie keepsComing when a winning record sits outside the pool", () => {
    const podium = buildPodium([
      row({
        playerId: 1,
        playerName: "Winner",
        gamesPlayed: 10,
        gamesWon: 8,
        gamesLost: 2,
      }),
      row({
        playerId: 2,
        playerName: "Maria",
        gamesPlayed: 2,
        gamesWon: 0,
        gamesLost: 2,
      }),
      row({
        playerId: 3,
        playerName: "Pedro",
        gamesPlayed: 2,
        gamesWon: 0,
        gamesLost: 2,
      }),
    ]);
    const keeps = podium.find((c) => c.id === "keepsComing")!;
    expect(keeps.allTied).toBe(false);
    expect(keeps.first.map((p) => p.playerName)).toEqual(["Maria", "Pedro"]);
    expect(keeps.second).toEqual([]);
  });

  it("requires rate min games for pollo/zapato rates", () => {
    const podium = buildPodium([
      row({
        playerId: 1,
        playerName: "Hot",
        gamesPlayed: PODIUM_RATE_MIN_GAMES - 1,
        pollosFor: 10,
        pollosAgainst: 10,
        zapatosFor: 10,
      }),
      row({
        playerId: 2,
        playerName: "Steady",
        gamesPlayed: PODIUM_RATE_MIN_GAMES,
        pollosFor: 3,
        pollosAgainst: 3,
        zapatosFor: 2,
      }),
    ]);
    const polloRate = podium.find((c) => c.id === "polloRate")!;
    expect(polloRate.first[0]?.playerName).toBe("Steady");
    expect(polloRate.second).toEqual([]);
    const eatenRate = podium.find((c) => c.id === "polloEatenRate")!;
    expect(eatenRate.first[0]?.playerName).toBe("Steady");
    expect(eatenRate.second).toEqual([]);
  });

  it("lists a two-way first-place tie as 1st and hides 2nd", () => {
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
      row({
        playerId: 3,
        playerName: "Cal",
        gamesPlayed: 10,
        gamesLost: 2,
        gamesWon: 8,
      }),
    ]);
    const bestLoser = podium.find((c) => c.id === "bestLoser")!;
    expect(bestLoser.allTied).toBe(false);
    expect(bestLoser.first.map((p) => p.playerName)).toEqual(["Amy", "Zoe"]);
    expect(bestLoser.second).toEqual([]);
  });

  it("lists every name when more than two tie for first", () => {
    const podium = buildPodium([
      row({ playerId: 1, playerName: "Ana", pollosFor: 4 }),
      row({ playerId: 2, playerName: "Ben", pollosFor: 4 }),
      row({ playerId: 3, playerName: "Cara", pollosFor: 4 }),
      row({ playerId: 4, playerName: "Drew", pollosFor: 1 }),
    ]);
    const pollos = podium.find((c) => c.id === "pollos")!;
    expect(pollos.allTied).toBe(false);
    expect(pollos.first.map((p) => p.playerName)).toEqual(["Ana", "Ben", "Cara"]);
    expect(pollos.second).toEqual([]);
  });

  it("uses the all-tied snark when every eligible player matches", () => {
    const podium = buildPodium([
      row({ playerId: 1, playerName: "Amy", gamesLost: 7, gamesWon: 3 }),
      row({ playerId: 2, playerName: "Zoe", gamesLost: 7, gamesWon: 3 }),
    ]);
    const bestLoser = podium.find((c) => c.id === "bestLoser")!;
    expect(bestLoser.allTied).toBe(true);
    expect(bestLoser.first).toEqual([]);
    expect(bestLoser.second).toEqual([]);
    expect(bestLoser.allTiedDisplay).toBe("7");
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
    expect(byId.maxDataFor.first[0]?.playerName).toBe("Ana");
    expect(byId.minDataFor.first[0]?.playerName).toBe("Ben");
    expect(byId.minDatasToWin.first[0]?.playerName).toBe("Ana");
    expect(byId.maxDatasToWin.first[0]?.playerName).toBe("Ana");
    expect(byId.maxDatasToLose.first[0]?.playerName).toBe("Ben");
    expect(byId.maxDataAgainst.first[0]?.playerName).toBe("Ben");
    expect(byId.minDatasToLose).toBeUndefined();
  });
});
