import type { DominoSetId, PlayModeId, Tile } from "./types";

export function setConfig(setId: DominoSetId) {
  if (setId === "double_nine") {
    return { maxPip: 9, tilesInSet: 55, tilesPerHand: 10 };
  }
  return { maxPip: 6, tilesInSet: 28, tilesPerHand: 7 };
}

export function modeConfig(modeId: PlayModeId) {
  switch (modeId) {
    case "1v1":
      return { players: 2, teams: false, label: "1 vs 1" };
    case "2v2":
      return { players: 4, teams: true, label: "2 vs 2" };
    case "ffa4":
      return { players: 4, teams: false, label: "Free for all" };
    default: {
      const _exhaustive: never = modeId;
      return _exhaustive;
    }
  }
}

export function buildSet(maxPip: number): Tile[] {
  const tiles: Tile[] = [];
  let n = 0;
  for (let a = 0; a <= maxPip; a += 1) {
    for (let b = a; b <= maxPip; b += 1) {
      tiles.push({ id: `t${n++}`, a, b });
    }
  }
  return tiles;
}

/** Fisher–Yates with optional seed for reproducible deals in debug. */
export function shuffleTiles(tiles: Tile[], seed?: number): Tile[] {
  const out = tiles.slice();
  let s = seed ?? Date.now() % 2147483647;
  const rand = () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function tilePips(tile: Tile): number {
  return tile.a + tile.b;
}

export function handPips(hand: Tile[]): number {
  return hand.reduce((sum, tile) => sum + tilePips(tile), 0);
}

export function isDouble(tile: Tile): boolean {
  return tile.a === tile.b;
}

export function formatTile(tile: { a: number; b: number }): string {
  return `[${tile.a}|${tile.b}]`;
}
