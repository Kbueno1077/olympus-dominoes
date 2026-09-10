import { describe, expect, it } from "vitest";
import {
  historyFilterActive,
  matchPassesHistoryFilter,
  matchPassesMatchupFilter,
  type HistoryFilter,
  type HistoryFilterPlayer,
  type HistorySeat,
} from "./historyFilters";

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
  const names = ["Ana", "Pedro", "Luis", "Maria"];
  return {
    playersAmount: 4,
    modeLabel: MODE,
    seats: ids.map((id, index) =>
      seat(index + 1, id, names[index])
    ) as HistorySeat[],
  };
}

const emptyFilter: HistoryFilter = { players: [] };
const match2v2 = table([1, 2, 3, 4]);

describe("historyFilterActive", () => {
  it("is inactive when empty", () => {
    expect(historyFilterActive(emptyFilter)).toBe(false);
  });

  it("is active when any player is listed", () => {
    expect(
      historyFilterActive({ players: [{ playerId: 1, team: null }] })
    ).toBe(true);
  });
});

describe("matchPassesHistoryFilter", () => {
  it("passes everything when the filter is empty", () => {
    expect(matchPassesHistoryFilter(match2v2, emptyFilter)).toBe(true);
  });

  it("requires every listed player to be seated", () => {
    expect(
      matchPassesHistoryFilter(match2v2, {
        players: [{ playerId: 1, team: null }],
      })
    ).toBe(true);

    expect(
      matchPassesHistoryFilter(match2v2, {
        players: [{ playerId: 99, team: null }],
      })
    ).toBe(false);
  });

  it("requires Team 1 picks to share the same side", () => {
    expect(
      matchPassesHistoryFilter(match2v2, {
        players: [
          { playerId: 1, team: 1 },
          { playerId: 3, team: 1 },
        ],
      })
    ).toBe(true);

    expect(
      matchPassesHistoryFilter(match2v2, {
        players: [
          { playerId: 1, team: 1 },
          { playerId: 2, team: 1 },
        ],
      })
    ).toBe(false);
  });

  it("requires Team 1 and Team 2 groups to be on opposite sides", () => {
    expect(
      matchPassesHistoryFilter(match2v2, {
        players: [
          { playerId: 1, team: 1 },
          { playerId: 3, team: 1 },
          { playerId: 2, team: 2 },
          { playerId: 4, team: 2 },
        ],
      })
    ).toBe(true);

    expect(
      matchPassesHistoryFilter(match2v2, {
        players: [
          { playerId: 1, team: 1 },
          { playerId: 3, team: 2 },
        ],
      })
    ).toBe(false);
  });

  it("allows unmarked players as presence-only alongside team marks", () => {
    expect(
      matchPassesHistoryFilter(match2v2, {
        players: [
          { playerId: 1, team: 1 },
          { playerId: 2, team: 2 },
          { playerId: 4, team: null },
        ],
      })
    ).toBe(true);
  });

  it("still requires every Any player to appear (unlike Compare matchup)", () => {
    expect(
      matchPassesHistoryFilter(match2v2, {
        players: [
          { playerId: 1, team: 1 },
          { playerId: 3, team: 1 },
          { playerId: 2, team: 2 },
          { playerId: 4, team: 2 },
          { playerId: 5, team: null },
        ],
      })
    ).toBe(false);
  });
});

describe("matchPassesMatchupFilter", () => {
  const ariel = 1;
  const eliecer = 2;
  const cesar = 3;
  const randy = 4;
  const guillermo = 5;

  const five: HistoryFilterPlayer[] = [
    { playerId: ariel, team: 1 },
    { playerId: cesar, team: 1 },
    { playerId: eliecer, team: 2 },
    { playerId: randy, team: 2 },
    { playerId: 5, team: null },
  ];

  it("counts Ariel+Cesar vs Eliecer+Randy when Guillermo sat out", () => {
    expect(
      matchPassesMatchupFilter(table([ariel, eliecer, cesar, randy]), {
        players: five,
      })
    ).toBe(true);
  });

  it("counts Guillermo Any replacing Randy on B", () => {
    expect(
      matchPassesMatchupFilter(table([ariel, eliecer, cesar, guillermo]), {
        players: five,
      })
    ).toBe(true);
  });

  it("rejects Ariel and Cesar on opposite teams", () => {
    expect(
      matchPassesMatchupFilter(table([ariel, cesar, eliecer, randy]), {
        players: five,
      })
    ).toBe(false);
  });

  it("rejects an outsider when the selected pool fills the table", () => {
    expect(
      matchPassesMatchupFilter(table([ariel, eliecer, cesar, 99]), {
        players: five,
      })
    ).toBe(false);
  });

  it("allows outsiders when the pool is smaller than the table", () => {
    expect(
      matchPassesMatchupFilter(table([1, 2, 8, 9]), {
        players: [
          { playerId: 1, team: 1 },
          { playerId: 2, team: 2 },
        ],
      })
    ).toBe(true);
  });

  it("treats an empty assignment list as inactive", () => {
    expect(matchPassesMatchupFilter(table([1, 2, 3, 4]), emptyFilter)).toBe(
      true
    );
  });
});
