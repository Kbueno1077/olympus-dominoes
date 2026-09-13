import { describe, expect, it } from "vitest";
import {
  addHandToGame,
  emptyGame,
  removeHandFromGame,
  winnerFromGameTotals,
} from "./matchSettings";

describe("winnerFromGameTotals", () => {
  it("is empty while nobody has reached the target", () => {
    const game = addHandToGame(emptyGame, 1, 40);
    expect(winnerFromGameTotals(game, 100, [1, 2])).toBe("");
  });

  it("names the one team at or past the target", () => {
    const game = addHandToGame(emptyGame, 1, 120);
    expect(winnerFromGameTotals(game, 100, [1, 2])).toBe("Team 1");
  });

  it("clears the winner after the overshooting hand is removed", () => {
    const won = addHandToGame(emptyGame, 1, 120);
    expect(winnerFromGameTotals(won, 100, [1, 2])).toBe("Team 1");

    const edited = removeHandFromGame(won, 1, 0);
    expect(edited.t1TotalPoints).toBe(0);
    expect(winnerFromGameTotals(edited, 100, [1, 2])).toBe("");
  });

  it("stays empty when two teams are both over so the pad can be edited", () => {
    const game = addHandToGame(addHandToGame(emptyGame, 1, 110), 2, 105);
    expect(winnerFromGameTotals(game, 100, [1, 2])).toBe("");
  });
});
