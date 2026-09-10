import { describe, expect, it } from "vitest";
import {
  parseHandsTakenJson,
  stripTrailingPadHands,
  stripTrailingPadHandsPair,
} from "./hands";

describe("stripTrailingPadHands", () => {
  it("removes trailing zeros and negatives only", () => {
    expect(stripTrailingPadHands([34, 8, 13, 22, 79, -6])).toEqual([
      34, 8, 13, 22, 79,
    ]);
    expect(stripTrailingPadHands([22, 27, 22, 79, 0])).toEqual([
      22, 27, 22, 79,
    ]);
    expect(stripTrailingPadHands([10, 20])).toEqual([10, 20]);
    expect(stripTrailingPadHands([])).toEqual([]);
    expect(stripTrailingPadHands([0])).toEqual([]);
    expect(stripTrailingPadHands([-5])).toEqual([]);
  });

  it("does not remove mid-list zeros or negatives", () => {
    expect(stripTrailingPadHands([0, 10, 20])).toEqual([0, 10, 20]);
    expect(stripTrailingPadHands([-1, 15])).toEqual([-1, 15]);
  });
});

describe("parseHandsTakenJson", () => {
  it("keeps a parallel take-order array", () => {
    expect(parseHandsTakenJson("[1,3,4]", 3)).toEqual([1, 3, 4]);
  });

  it("returns empty when missing or the length does not match", () => {
    expect(parseHandsTakenJson(null, 2)).toEqual([]);
    expect(parseHandsTakenJson("[1]", 2)).toEqual([]);
    expect(parseHandsTakenJson("nope", 1)).toEqual([]);
  });
});

describe("stripTrailingPadHandsPair", () => {
  it("strips matching take-order entries with pad hands", () => {
    expect(stripTrailingPadHandsPair([50, 0], [1, 2])).toEqual({
      hands: [50],
      taken: [1],
    });
  });

  it("drops take order when lengths do not match", () => {
    expect(stripTrailingPadHandsPair([50, 40], [1])).toEqual({
      hands: [50, 40],
      taken: [],
    });
  });
});
