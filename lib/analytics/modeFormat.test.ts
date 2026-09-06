import { describe, expect, it } from "vitest";
import {
  ALL_FORMAT_LABELS,
  FREE_FOR_ALL,
  TILE_SET_OPTIONS,
  formatIcon,
  formatLabelFromPlayModeId,
  isFormatLabel,
  isTileSet,
  tileSetFromDominoSetId,
  tileSetIcon,
} from "./modeFormat";

describe("modeFormat catalog", () => {
  it("always lists both tile sets and every format", () => {
    expect(TILE_SET_OPTIONS).toEqual(["55", "28"]);
    expect(ALL_FORMAT_LABELS).toEqual([
      "1 vs 1",
      "2 vs 2",
      "2 vs 1",
      FREE_FOR_ALL,
    ]);
  });

  it("recognizes stored tile-set and format values", () => {
    expect(isTileSet("55")).toBe(true);
    expect(isTileSet("28")).toBe(true);
    expect(isTileSet("all")).toBe(false);
    expect(isFormatLabel("2 vs 2")).toBe(true);
    expect(isFormatLabel(FREE_FOR_ALL)).toBe(true);
    expect(isFormatLabel("all")).toBe(false);
  });

  it("uses the same icon names as the mobile pills", () => {
    expect(tileSetIcon("28")).toBe("mdi:cards-outline");
    expect(tileSetIcon("55")).toBe("mdi:cards");
    expect(tileSetIcon("all")).toBe("mdi:view-grid-outline");
    expect(formatIcon("1 vs 1")).toBe("mdi:account-outline");
    expect(formatIcon("2 vs 1")).toBe("mdi:account-multiple-outline");
    expect(formatIcon("2 vs 2")).toBe("mdi:account-group-outline");
    expect(formatIcon(FREE_FOR_ALL)).toBe("mdi:account-switch-outline");
    expect(formatIcon("all")).toBe("mdi:view-grid-outline");
  });

  it("maps notepad / play ids onto the shared catalog", () => {
    expect(tileSetFromDominoSetId("double_six")).toBe("28");
    expect(tileSetFromDominoSetId("double_nine")).toBe("55");
    expect(formatLabelFromPlayModeId("1v1")).toBe("1 vs 1");
    expect(formatLabelFromPlayModeId("2v2")).toBe("2 vs 2");
    expect(formatLabelFromPlayModeId("ffa4")).toBe(FREE_FOR_ALL);
  });
});
