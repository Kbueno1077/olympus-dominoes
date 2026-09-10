import { describe, expect, it } from "vitest";
import { emptyGame } from "@/utils/matchSettings";
import {
  buildTeams,
  formatTeamInitials,
  normalizeNameKey,
  resolveTeamInitialLabels,
  teamInitialLabelsByNumber,
  teamScoresFromGame,
  teamsFromRoster,
} from "./teams";

type Seat = { number: number; name: string };
type Team = { number: number; members: Seat[] };

const seats = (names: string[]): Seat[] =>
  names.map((name, index) => ({ number: index + 1, name }));

const memberNames = (team: Team) => team.members.map((m) => m.name);
const memberNumbers = (team: Team) => team.members.map((m) => m.number);

describe("buildTeams", () => {
  it("puts two players on opposite teams", () => {
    const teams: Team[] = buildTeams(2, false, seats(["A", "B"]));
    expect(teams).toHaveLength(2);
    expect(memberNames(teams[0])).toEqual(["A"]);
    expect(memberNames(teams[1])).toEqual(["B"]);
  });

  it("pairs seats 1+3 and 2 for 2 vs 1", () => {
    const teams: Team[] = buildTeams(3, false, seats(["A", "B", "C"]));
    expect(memberNumbers(teams[0])).toEqual([1, 3]);
    expect(memberNumbers(teams[1])).toEqual([2]);
  });

  it("pairs seats 1+3 vs 2+4 for 2 vs 2", () => {
    const teams: Team[] = buildTeams(4, false, seats(["A", "B", "C", "D"]));
    expect(memberNumbers(teams[0])).toEqual([1, 3]);
    expect(memberNumbers(teams[1])).toEqual([2, 4]);
  });

  it("gives each seat its own team in Free For All", () => {
    const teams: Team[] = buildTeams(4, true, seats(["A", "B", "C", "D"]));
    expect(teams.map((t) => t.number)).toEqual([1, 2, 3, 4]);
    expect(teams.every((t) => t.members.length === 1)).toBe(true);
  });
});

describe("teamsFromRoster", () => {
  it("treats Free For All mode label as FFA seating", () => {
    const teams: Team[] = teamsFromRoster(3, "Free For All", [
      "A",
      "B",
      "C",
      "",
    ]);
    expect(teams).toHaveLength(3);
    expect(teams[2].members[0].name).toBe("C");
  });

  it("uses partner seating for 2 vs 2", () => {
    const teams: Team[] = teamsFromRoster(4, "2 vs 2", ["A", "B", "C", "D"]);
    expect(memberNames(teams[0])).toEqual(["A", "C"]);
  });
});

describe("normalizeNameKey", () => {
  it("trims and lowercases", () => {
    expect(normalizeNameKey("  Ana  ")).toBe("ana");
  });
});

describe("formatTeamInitials / resolveTeamInitialLabels", () => {
  it("uses one letter per player when labels differ", () => {
    expect(formatTeamInitials(["Kevin", "Jose"], 1)).toBe("KJ");
    expect(formatTeamInitials(["Raul", "Rudelys"], 1)).toBe("RR");
    expect(
      resolveTeamInitialLabels([
        ["Kevin", "Jose"],
        ["Raul", "Rudelys"],
      ])
    ).toEqual(["KJ", "RR"]);
  });

  it("escalates to two letters when short labels collide", () => {
    expect(
      resolveTeamInitialLabels([
        ["raul", "rudelys"],
        ["roman", "rother"],
      ])
    ).toEqual(["RaRu", "RoRo"]);
  });

  it("maps roster seating to team numbers for 2 vs 2", () => {
    const labels = teamInitialLabelsByNumber(4, "2 vs 2", [
      "Kevin",
      "Raul",
      "Jose",
      "Rudelys",
    ]) as Record<number, string>;
    expect(labels[1]).toBe("KJ");
    expect(labels[2]).toBe("RR");
  });
});

describe("teamScoresFromGame", () => {
  it("reads hands and totals for active teams", () => {
    const game = {
      ...emptyGame,
      t1Datas: [10, 20],
      t1TotalPoints: 30,
      t2Datas: [5],
      t2TotalPoints: 5,
    };
    const scores = teamScoresFromGame(game, [1, 2]);
    expect(scores[0]).toMatchObject({
      teamNumber: 1,
      totalPoints: 30,
      handCount: 2,
    });
    expect(scores[1].handCount).toBe(1);
  });

  it("strips trailing pad hands from handCount", () => {
    const game = {
      ...emptyGame,
      t1Datas: [48, 55],
      t1TotalPoints: 103,
      t2Datas: [34, 8, 13, 22, 79, -6],
      t2TotalPoints: 156,
    };
    const scores = teamScoresFromGame(game, [1, 2]);
    expect(scores[0].handCount).toBe(2);
    expect(scores[1].handCount).toBe(5);
    expect(scores[1].hands).toEqual([34, 8, 13, 22, 79]);
  });
});
