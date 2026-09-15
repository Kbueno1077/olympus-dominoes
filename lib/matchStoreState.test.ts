import { describe, expect, it } from "vitest";
import { matchStateFromRecoilPersist } from "./matchStoreState";

describe("matchStateFromRecoilPersist", () => {
  it("copies known recoil-persist atom keys", () => {
    expect(
      matchStateFromRecoilPersist({
        playersAmount: 2,
        gameMode: { label: "1 vs 1" },
        player1: "Ana",
        isGameStarted: true,
        textState: 12,
      })
    ).toEqual({
      playersAmount: 2,
      gameMode: { label: "1 vs 1" },
      player1: "Ana",
      isGameStarted: true,
    });
  });

  it("ignores malformed values", () => {
    expect(
      matchStateFromRecoilPersist({
        playersAmount: "4",
        gameMode: { name: "2 vs 2" },
      })
    ).toEqual({});
  });
});
