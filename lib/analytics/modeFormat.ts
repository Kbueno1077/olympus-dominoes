/**
 * Canonical Mode (tile set) and Format lists — same catalog as the mobile app.
 * Persistence values stay English / numeric; UI maps them for display.
 */

export const FREE_FOR_ALL = "Free For All";

export const ALL_FORMAT_LABELS = [
  "1 vs 1",
  "2 vs 2",
  "2 vs 1",
  FREE_FOR_ALL,
] as const;

export type FormatLabel = (typeof ALL_FORMAT_LABELS)[number];

export const DEFAULT_FORMAT_LABEL: FormatLabel = "2 vs 2";

export type TileSet = "55" | "28";

export const TILE_SET_OPTIONS: readonly TileSet[] = ["55", "28"] as const;

export const DEFAULT_TILE_SET: TileSet = "55";

export function isTileSet(value: unknown): value is TileSet {
  return value === "55" || value === "28";
}

export function isFormatLabel(value: unknown): value is FormatLabel {
  return (
    typeof value === "string" &&
    (ALL_FORMAT_LABELS as readonly string[]).includes(value)
  );
}

export function tileSetIcon(option: string): string {
  switch (option) {
    case "28":
      return "mdi:cards-outline";
    case "55":
      return "mdi:cards";
    case "all":
      return "mdi:view-grid-outline";
    default:
      return "mdi:cards-variant";
  }
}

/** Web notepad / play store set ids as the Mode tile-set value. */
export function tileSetFromDominoSetId(id: string): TileSet {
  return id === "double_six" ? "28" : "55";
}

/** Bot-play mode ids as the stored Format label. */
export function formatLabelFromPlayModeId(id: string): string {
  switch (id) {
    case "1v1":
      return "1 vs 1";
    case "2v2":
      return "2 vs 2";
    case "ffa4":
      return FREE_FOR_ALL;
    default:
      return id;
  }
}

export function formatIcon(mode: string): string {
  switch (mode) {
    case "1 vs 1":
      return "mdi:account-outline";
    case "2 vs 1":
      return "mdi:account-multiple-outline";
    case "2 vs 2":
      return "mdi:account-group-outline";
    case FREE_FOR_ALL:
      return "mdi:account-switch-outline";
    case "all":
      return "mdi:view-grid-outline";
    default:
      return "mdi:sword-cross";
  }
}
