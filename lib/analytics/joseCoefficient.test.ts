import { describe, expect, it } from "vitest";
import {
  computeJosesCoefficient,
  formatJosesCoefficient,
  josesLeadTerm,
  josesSecondaryTerm,
  type JosesCoefficientInput,
} from "./joseCoefficient";

function row(
  partial: Partial<JosesCoefficientInput> &
    Pick<JosesCoefficientInput, "gamesPlayed" | "gamesWon" | "gamesLost">
): JosesCoefficientInput {
  return {
    handsFor: 0,
    handsAgainst: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pollosFor: 0,
    pollosAgainst: 0,
    zapatosFor: 0,
    zapatosAgainst: 0,
    ...partial,
  };
}

describe("josesLeadTerm", () => {
  it("is 2.5 × net games, signed and uncapped", () => {
    expect(josesLeadTerm(0)).toBe(0);
    expect(josesLeadTerm(2)).toBe(5);
    expect(josesLeadTerm(4)).toBe(10);
    expect(josesLeadTerm(18)).toBe(45);
    expect(josesLeadTerm(30)).toBe(75);
    expect(josesLeadTerm(-5)).toBe(-12.5);
  });
});

describe("computeJosesCoefficient", () => {
  it("returns null when no games played", () => {
    expect(
      computeJosesCoefficient(row({ gamesPlayed: 0, gamesWon: 0, gamesLost: 0 }))
    ).toBeNull();
  });

  it("uses 2.5 × ΔG for the same net regardless of G when secondaries are zero", () => {
    const a = computeJosesCoefficient(
      row({ gamesPlayed: 10, gamesWon: 6.5, gamesLost: 3.5 })
    );
    const b = computeJosesCoefficient(
      row({ gamesPlayed: 100, gamesWon: 51.5, gamesLost: 48.5 })
    );
    expect(a!).toBeCloseTo(josesLeadTerm(3), 5);
    expect(b!).toBeCloseTo(a!, 5);
  });

  it("matches R = 2.5ΔG + ΔDW/3.5 + ΔPF/150 + 2.5×(ΔPo/4 + 0.4×ΔZap/4)", () => {
    const stats = row({
      gamesPlayed: 29,
      gamesWon: 17,
      gamesLost: 12,
      handsFor: 94,
      handsAgainst: 75,
      pointsFor: 3573,
      pointsAgainst: 2964,
      pollosFor: 7,
      pollosAgainst: 3,
      zapatosFor: 2,
      zapatosAgainst: 3,
    });
    const deltaG = 5;
    const deltaDW = 19;
    const deltaPF = 609;
    const deltaPo = 4;
    const deltaZap = -1;
    const expected =
      2.5 * deltaG +
      deltaDW / 3.5 +
      deltaPF / 150 +
      2.5 * (deltaPo / 4 + (0.4 * deltaZap) / 4);

    expect(computeJosesCoefficient(stats)).toBeCloseTo(expected, 10);
  });

  it("does not divide secondaries by max(G, 25)", () => {
    const extras = {
      handsFor: 20,
      handsAgainst: 0,
      pointsFor: 165,
      pointsAgainst: 0,
      pollosFor: 0,
      pollosAgainst: 0,
      zapatosFor: 0,
      zapatosAgainst: 0,
    };
    const short = computeJosesCoefficient(
      row({ gamesPlayed: 8, gamesWon: 5, gamesLost: 3, ...extras })
    );
    const long = computeJosesCoefficient(
      row({ gamesPlayed: 80, gamesWon: 41, gamesLost: 39, ...extras })
    );
    expect(short!).toBeCloseTo(josesLeadTerm(2) + 20 / 3.5 + 165 / 150, 10);
    expect(long!).toBeCloseTo(short!, 10);
  });

  it("ranks Pedro ≫ Ana > Luis, and Solid +4 above Luis", () => {
    const pedro = computeJosesCoefficient(
      row({
        gamesPlayed: 30,
        gamesWon: 24,
        gamesLost: 6,
        handsFor: 106,
        handsAgainst: 50,
        pointsFor: 4500,
        pointsAgainst: 2490,
        pollosFor: 3,
        pollosAgainst: 0,
        zapatosFor: 1,
        zapatosAgainst: 0,
      })
    );
    const luis = computeJosesCoefficient(
      row({
        gamesPlayed: 30,
        gamesWon: 16,
        gamesLost: 14,
        handsFor: 64,
        handsAgainst: 56,
        pointsFor: 2630,
        pointsAgainst: 2370,
        pollosFor: 2,
        pollosAgainst: 0,
        zapatosFor: 2,
        zapatosAgainst: 0,
      })
    );
    const ana = computeJosesCoefficient(
      row({
        gamesPlayed: 30,
        gamesWon: 18,
        gamesLost: 12,
        handsFor: 54,
        handsAgainst: 45,
        pointsFor: 2165,
        pointsAgainst: 1835,
        pollosFor: 1,
        pollosAgainst: 0,
      })
    );
    const solid40 = computeJosesCoefficient(
      row({
        gamesPlayed: 40,
        gamesWon: 22,
        gamesLost: 18,
        handsFor: 55,
        handsAgainst: 45,
        pointsFor: 2190,
        pointsAgainst: 1810,
        pollosFor: 1,
        pollosAgainst: 0,
      })
    );

    expect(pedro!).toBeGreaterThan(ana!);
    expect(ana!).toBeGreaterThan(luis!);
    expect(solid40!).toBeGreaterThan(luis!);
  });

  it("keeps Cesar above a short heater on these fixtures", () => {
    const hotWeekend = computeJosesCoefficient(
      row({
        gamesPlayed: 8,
        gamesWon: 6,
        gamesLost: 2,
        handsFor: 41,
        handsAgainst: 28,
        pointsFor: 1290,
        pointsAgainst: 800,
        pollosFor: 1,
        pollosAgainst: 0,
        zapatosFor: 1,
        zapatosAgainst: 0,
      })
    );
    const cesar = computeJosesCoefficient(
      row({
        gamesPlayed: 29,
        gamesWon: 17,
        gamesLost: 12,
        handsFor: 94,
        handsAgainst: 75,
        pointsFor: 3573,
        pointsAgainst: 2964,
        pollosFor: 7,
        pollosAgainst: 3,
        zapatosFor: 2,
        zapatosAgainst: 3,
      })
    );
    const hot2nds = hotWeekend! - josesLeadTerm(4);
    const cesar2nds = cesar! - josesLeadTerm(5);
    expect(cesar2nds).toBeGreaterThan(hot2nds);
    expect(cesar!).toBeGreaterThan(hotWeekend!);
  });

  it("anchors docs Cesar / Pedro / HotWeekend values", () => {
    const fromDeltas = (
      net: number,
      deltaDW: number,
      deltaPF: number,
      deltaPo: number,
      deltaZap: number
    ) =>
      josesLeadTerm(net) + josesSecondaryTerm(deltaDW, deltaPF, deltaPo, deltaZap);

    expect(fromDeltas(18, 56, 2010, 3, 1)).toBeCloseTo(76.5, 1);
    expect(fromDeltas(5, 19, 609, 4, -1)).toBeCloseTo(24.2, 1);
    expect(fromDeltas(4, 13, 490, 1, 1)).toBeCloseTo(17.9, 1);
  });

  it("mirrors for a closed head-to-head", () => {
    const a = computeJosesCoefficient(
      row({
        gamesPlayed: 20,
        gamesWon: 8,
        gamesLost: 12,
        handsFor: 52,
        handsAgainst: 66,
        pointsFor: 1880,
        pointsAgainst: 2416,
        pollosFor: 4,
        pollosAgainst: 2,
        zapatosFor: 0,
        zapatosAgainst: 2,
      })
    );
    const b = computeJosesCoefficient(
      row({
        gamesPlayed: 20,
        gamesWon: 12,
        gamesLost: 8,
        handsFor: 66,
        handsAgainst: 52,
        pointsFor: 2416,
        pointsAgainst: 1880,
        pollosFor: 2,
        pollosAgainst: 4,
        zapatosFor: 2,
        zapatosAgainst: 0,
      })
    );
    expect(a!).toBeCloseTo(-b!, 5);
  });
});

describe("formatJosesCoefficient", () => {
  it("formats one decimal and dashes null", () => {
    expect(formatJosesCoefficient(17.56)).toBe("17.6");
    expect(formatJosesCoefficient(null)).toBe("—");
  });
});
