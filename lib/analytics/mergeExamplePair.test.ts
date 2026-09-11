import { describe, expect, it } from "vitest";
import { analyzeMerge } from "./mergeDatasets";
import {
  casaViejaCsv,
  casaViejaData,
  maleconCsv,
  maleconData,
  MERGE_EXAMPLE_CASA_NAME,
  MERGE_EXAMPLE_MALECON_NAME,
} from "./mergeExamplePair";
import { parseOlympusExport } from "./parseExport";

describe("merge example pair", () => {
  it("surfaces a rename, two Marias, a disagreed night, and one skipped duplicate", () => {
    const plan = analyzeMerge([
      {
        datasetId: "casa",
        displayName: MERGE_EXAMPLE_CASA_NAME,
        data: casaViejaData(),
      },
      {
        datasetId: "malecon",
        displayName: MERGE_EXAMPLE_MALECON_NAME,
        data: maleconData(),
      },
    ]);

    expect(plan.playerNameConflicts).toHaveLength(1);
    expect(plan.playerNameConflicts[0]?.occurrences.map((o) => o.name).sort()).toEqual(
      ["Luis", "Luisito"]
    );

    expect(plan.playerIdentityConflicts).toHaveLength(1);
    expect(plan.playerIdentityConflicts[0]?.displayName).toBe("Maria");

    expect(plan.matchContentConflicts).toHaveLength(1);
    expect(plan.matchContentConflicts[0]?.endedAt).toBe(
      "2026-05-14T23:10:00.000Z"
    );

    expect(plan.matchesSkippedDuplicates).toHaveLength(1);
    expect(plan.matchesSkippedDuplicates[0]?.keep.endedAt).toBe(
      "2026-04-09T23:40:00.000Z"
    );
  });

  it("round-trips as importable CSV", () => {
    const casa = parseOlympusExport(casaViejaCsv(), "casa-vieja.csv");
    const malecon = parseOlympusExport(maleconCsv(), "malecon.csv");
    expect(casa.players).toHaveLength(6);
    expect(malecon.players).toHaveLength(6);
    expect(casa.tables.matches ?? casa.matches).toHaveLength(3);
    expect(malecon.tables.matches ?? malecon.matches).toHaveLength(3);
  });
});
