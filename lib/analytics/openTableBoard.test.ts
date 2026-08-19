import { describe, expect, it } from "vitest";
import { emptyGame } from "@/utils/matchSettings";
import { tallyOpenTablePlayers } from "./openTableBoard";

const ROSTER_A = ["Ana", "Pedro", "Luis", "Maria"];
const ROSTER_B = ["Cesar", "Pedro", "Luis", "Maria"];

function gameWithScores(partial: {
  t1?: number[];
  t2?: number[];
  winner: string;
}) {
  const t1 = partial.t1 ?? [];
  const t2 = partial.t2 ?? [];
  return {
    ...emptyGame,
    t1Datas: t1,
    t1TotalPoints: t1.reduce((a, b) => a + b, 0),
    t2Datas: t2,
    t2TotalPoints: t2.reduce((a, b) => a + b, 0),
    winner: partial.winner,
  };
}

function normalWinGame() {
  return gameWithScores({
    t1: [50, 50, 50],
    t2: [20, 30, 40],
    winner: "Team 1",
  });
}

function polloGame() {
  return gameWithScores({ t1: [150], t2: [], winner: "Team 1" });
}

function zapatoGame() {
  return gameWithScores({ t1: [100, 50], t2: [40], winner: "Team 1" });
}

describe("tallyOpenTablePlayers", () => {
  it("credits only the people who sat each game", () => {
    const lines = tallyOpenTablePlayers(
      [normalWinGame(), normalWinGame()],
      [ROSTER_A, ROSTER_B],
      4,
      "2 vs 2"
    );
    const byName = Object.fromEntries(lines.map((row) => [row.name, row]));

    expect(byName.Ana).toMatchObject({ gamesWon: 1, gamesLost: 0 });
    expect(byName.Cesar).toMatchObject({ gamesWon: 1, gamesLost: 0 });
    expect(byName.Luis).toMatchObject({ gamesWon: 2, gamesLost: 0 });
    expect(byName.Pedro).toMatchObject({ gamesWon: 0, gamesLost: 2 });
  });

  it("credits pollos and zapatos to everyone on the winning side", () => {
    const lines = tallyOpenTablePlayers(
      [polloGame(), zapatoGame()],
      [ROSTER_A, ROSTER_A],
      4,
      "2 vs 2"
    );
    const byName = Object.fromEntries(lines.map((row) => [row.name, row]));

    expect(byName.Ana).toMatchObject({
      gamesWon: 2,
      pollosFor: 1,
      zapatosFor: 1,
    });
    expect(byName.Luis).toMatchObject({
      gamesWon: 2,
      pollosFor: 1,
      zapatosFor: 1,
    });
    expect(byName.Pedro).toMatchObject({
      gamesWon: 0,
      gamesLost: 2,
      pollosFor: 0,
      zapatosFor: 0,
    });
  });

  it("merges the same name_key across games into one row", () => {
    const lines = tallyOpenTablePlayers(
      [normalWinGame(), normalWinGame()],
      [ROSTER_A, ["ANA", "Pedro", "Luis", "Maria"]],
      4,
      "2 vs 2"
    );
    expect(lines.filter((row) => row.nameKey === "ana")).toHaveLength(1);
    expect(lines.find((row) => row.nameKey === "ana")?.gamesWon).toBe(2);
  });

  it("sorts by GW, then fewer losses, then pollos, zapatos, then name", () => {
    const names = tallyOpenTablePlayers(
      [normalWinGame(), normalWinGame()],
      [ROSTER_A, ROSTER_B],
      4,
      "2 vs 2"
    ).map((row) => row.name);
    expect(names[0]).toBe("Luis");
  });
});
