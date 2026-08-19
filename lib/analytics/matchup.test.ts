import { describe, expect, it } from "vitest";
import {
  matchPassesHistoryFilter,
  matchPassesMatchupFilter,
  type HistoryFilter,
  type HistorySeat,
} from "./historyFilters";
import { matchupAlignmentReady, matchupFilterFromTeams } from "./matchup";

const MODE = "2 vs 2";

function seat(n: number, playerId: number | null, name: string): HistorySeat {
  return {
    seat: n,
    displayName: name,
    playerId,
    nameKey: name.toLowerCase(),
  };
}

/** 2v2: seats 1+3 are team 1, seats 2+4 are team 2. */
function table(
  ids: [number | null, number | null, number | null, number | null]
) {
  const names = ["p1", "p2", "p3", "p4"];
  return {
    playersAmount: 4,
    modeLabel: MODE,
    seats: ids.map((id, index) =>
      seat(index + 1, id, names[index])
    ) as HistorySeat[],
  };
}

describe("matchupAlignmentReady", () => {
  it("is ready when someone is Any, even with only one side", () => {
    expect(matchupAlignmentReady([1, 2, 3], { 1: 1, 2: null, 3: null })).toBe(
      true
    );
  });

  it("is ready when everyone is Any", () => {
    expect(
      matchupAlignmentReady([1, 2, 3], { 1: null, 2: null, 3: null })
    ).toBe(true);
  });

  it("still needs both sides when nobody is Any", () => {
    expect(matchupAlignmentReady([1, 2, 3], { 1: 1, 2: 1, 3: 1 })).toBe(
      false
    );
    expect(matchupAlignmentReady([1, 2], { 1: 1, 2: 2 })).toBe(true);
  });
});

describe("matchPassesMatchupFilter", () => {
  const pool: HistoryFilter = {
    players: [
      { playerId: 1, team: 1 },
      { playerId: 2, team: 2 },
      { playerId: 3, team: null },
      { playerId: 4, team: null },
      { playerId: 5, team: null },
    ],
  };

  it("does not require every A/B person when Any extras sit instead", () => {
    expect(matchPassesMatchupFilter(table([3, 4, 5, 1]), pool)).toBe(true);
  });

  it("lets Any sit on either side", () => {
    // 5 partners 1 (team 1), 3 partners 2 (team 2)
    expect(matchPassesMatchupFilter(table([1, 2, 5, 3]), pool)).toBe(true);
    // 5 partners 2, 3 partners 1
    expect(matchPassesMatchupFilter(table([1, 5, 3, 2]), pool)).toBe(true);
  });

  it("rejects an outsider when the pool fills the table", () => {
    expect(matchPassesMatchupFilter(table([1, 2, 3, 99]), pool)).toBe(false);
  });

  it("treats A/B as partners and Any as either team", () => {
    // Ariel A, Cesar A vs Eliecer B, Randy B — plus Jose Any.
    const ariel = 1;
    const eliecer = 2;
    const cesar = 3;
    const randy = 4;
    const jose = 5;
    const filter: HistoryFilter = {
      players: [
        { playerId: ariel, team: 1 },
        { playerId: cesar, team: 1 },
        { playerId: eliecer, team: 2 },
        { playerId: randy, team: 2 },
        { playerId: jose, team: null },
      ],
    };
    // Exact couples.
    expect(
      matchPassesMatchupFilter(table([ariel, eliecer, cesar, randy]), filter)
    ).toBe(true);
    // Jose sits with Eliecer instead of Randy — we don't care which team Jose is on.
    expect(
      matchPassesMatchupFilter(table([ariel, eliecer, cesar, jose]), filter)
    ).toBe(true);
    // Jose sits with Ariel instead of Cesar.
    expect(
      matchPassesMatchupFilter(table([ariel, eliecer, jose, randy]), filter)
    ).toBe(true);
    // Ariel and Cesar on opposite teams.
    expect(
      matchPassesMatchupFilter(table([ariel, cesar, eliecer, randy]), filter)
    ).toBe(false);
  });

  it("rejects A and B as partners", () => {
    expect(matchPassesMatchupFilter(table([1, 3, 2, 4]), pool)).toBe(false);
  });

  it("keeps a full A/B lineup exact when nobody is Any", () => {
    const exact: HistoryFilter = {
      players: [
        { playerId: 1, team: 1 },
        { playerId: 3, team: 1 },
        { playerId: 2, team: 2 },
        { playerId: 4, team: 2 },
      ],
    };
    expect(matchPassesMatchupFilter(table([1, 2, 3, 4]), exact)).toBe(true);
    expect(matchPassesMatchupFilter(table([1, 2, 3, 5]), exact)).toBe(false);
  });

  it("allows outsiders when A vs B and the pool is smaller than the table", () => {
    const pair: HistoryFilter = {
      players: [
        { playerId: 1, team: 1 },
        { playerId: 2, team: 2 },
      ],
    };
    expect(matchPassesMatchupFilter(table([1, 2, 8, 9]), pair)).toBe(true);
  });

  it("counts any 4-subset when everyone is Any", () => {
    const anyPool: HistoryFilter = {
      players: [1, 2, 3, 4, 5].map((playerId) => ({
        playerId,
        team: null,
      })),
    };
    expect(matchPassesMatchupFilter(table([1, 2, 3, 4]), anyPool)).toBe(true);
    expect(matchPassesMatchupFilter(table([1, 5, 3, 4]), anyPool)).toBe(true);
    expect(matchPassesMatchupFilter(table([1, 2, 3, 99]), anyPool)).toBe(
      false
    );
  });

  it("counts A plus Any without a B side", () => {
    const oneSide: HistoryFilter = {
      players: [
        { playerId: 1, team: 1 },
        { playerId: 3, team: null },
        { playerId: 4, team: null },
        { playerId: 5, team: null },
      ],
    };
    expect(matchPassesMatchupFilter(table([1, 3, 5, 4]), oneSide)).toBe(true);
    expect(matchPassesMatchupFilter(table([3, 4, 5, 2]), oneSide)).toBe(false);
  });

  it("requires a small Any pool to all be seated", () => {
    const pair: HistoryFilter = {
      players: [
        { playerId: 1, team: null },
        { playerId: 2, team: null },
      ],
    };
    expect(matchPassesMatchupFilter(table([1, 2, 8, 9]), pair)).toBe(true);
    expect(matchPassesMatchupFilter(table([1, 8, 9, 7]), pair)).toBe(false);
  });
});

describe("matchPassesHistoryFilter Any", () => {
  it("still requires every listed player to appear", () => {
    const filter: HistoryFilter = {
      players: [
        { playerId: 1, team: 1 },
        { playerId: 2, team: 2 },
        { playerId: 3, team: null },
        { playerId: 4, team: null },
        { playerId: 5, team: null },
      ],
    };
    expect(matchPassesHistoryFilter(table([1, 2, 3, 4]), filter)).toBe(false);
  });
});

describe("matchupFilterFromTeams", () => {
  it("maps missing assignments to Any", () => {
    expect(matchupFilterFromTeams([1, 2], { 1: 1 })).toEqual({
      players: [
        { playerId: 1, team: 1 },
        { playerId: 2, team: null },
      ],
    });
  });
});
