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

/**
 * Faces as shown on the rack (vertical bone). Optional 180° flip.
 */
export function rackDisplayFaces(tile: Tile): { top: number; bottom: number } {
  if (tile.rackFlip) return { top: tile.b, bottom: tile.a };
  return { top: tile.a, bottom: tile.b };
}

/**
 * Rack order: cluster tiles that share common faces, doubles first within a
 * suit, higher pip totals earlier inside each cluster. Also orients each bone
 * so the shared/primary face sits on the bottom (toward the stand).
 */
export function organizeHand(hand: Tile[]): Tile[] {
  if (hand.length === 0) return [];
  if (hand.length === 1) {
    const tile = hand[0];
    if (isDouble(tile)) return [{ ...tile, rackFlip: false }];
    // Prefer higher face on top for a lone tile.
    return [{ ...tile, rackFlip: false }];
  }

  const freq = new Map<number, number>();
  for (const tile of hand) {
    freq.set(tile.a, (freq.get(tile.a) ?? 0) + 1);
    if (tile.b !== tile.a) freq.set(tile.b, (freq.get(tile.b) ?? 0) + 1);
  }

  const primary = (tile: Tile) => {
    const fa = freq.get(tile.a) ?? 0;
    const fb = freq.get(tile.b) ?? 0;
    if (fa > fb) return tile.a;
    if (fb > fa) return tile.b;
    return Math.max(tile.a, tile.b);
  };

  const secondary = (tile: Tile) => {
    const p = primary(tile);
    return tile.a === p ? tile.b : tile.a;
  };

  const sorted = [...hand].sort((x, y) => {
    const px = primary(x);
    const py = primary(y);
    if (px !== py) return px - py;

    const dx = isDouble(x) ? 0 : 1;
    const dy = isDouble(y) ? 0 : 1;
    if (dx !== dy) return dx - dy;

    const sx = secondary(x);
    const sy = secondary(y);
    if (sx !== sy) return sx - sy;

    return tilePips(y) - tilePips(x);
  });

  return sorted.map((tile) => {
    if (isDouble(tile)) return { ...tile, rackFlip: false };
    // Put the grouping (primary) face on the bottom, toward the stand.
    const p = primary(tile);
    return { ...tile, rackFlip: p === tile.a };
  });
}

export function isDouble(tile: Tile): boolean {
  return tile.a === tile.b;
}

export function formatTile(tile: { a: number; b: number }): string {
  return `[${tile.a}|${tile.b}]`;
}
