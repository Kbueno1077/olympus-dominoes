import { describe, expect, it } from "vitest";
import {
  buildH2HCompareLaunch,
  compareLaunchFromQueryString,
  compareLaunchFromSearchParams,
  compareLaunchToSearchParams,
} from "./compareLaunch";

describe("H2H Compare launch", () => {
  it("puts the current player and the opponent on the query string", () => {
    const launch = buildH2HCompareLaunch({
      modeLabel: "2 vs 2",
      playerId: 2,
      opponentId: 7,
      tileSet: "55",
    });
    const params = compareLaunchToSearchParams(launch);
    expect(params.get("players")).toBe("2,7");
    expect(params.get("mode")).toBe("2 vs 2");
    expect(params.get("tiles")).toBe("55");
    expect(compareLaunchFromSearchParams(params)).toEqual(launch);
  });

  it("still reads repeated p= keys from an older URL", () => {
    expect(
      compareLaunchFromSearchParams(new URLSearchParams("p=2&p=7&mode=2+vs+2"))
    ).toEqual({
      modeLabel: "2 vs 2",
      tileSet: undefined,
      playerIds: [2, 7],
      teams: {},
      matchupMode: false,
    });
  });

  it("reads a query string from the address bar", () => {
    expect(
      compareLaunchFromQueryString("?players=2,7&mode=2+vs+2&tiles=55")
    ).toEqual({
      modeLabel: "2 vs 2",
      tileSet: "55",
      playerIds: [2, 7],
      teams: {},
      matchupMode: false,
    });
  });

  it("ignores a query with no players", () => {
    expect(
      compareLaunchFromSearchParams(new URLSearchParams("mode=2+vs+2"))
    ).toBeNull();
  });
});
