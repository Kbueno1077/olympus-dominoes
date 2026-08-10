import type { PlacedTile } from "./types";

export type TrainDir = "E" | "S" | "W" | "N";

export type LaidTile = {
  tile: PlacedTile;
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: "horizontal" | "vertical";
  faceA: number;
  faceB: number;
  dir: TrainDir;
};

export type ChainLayout = {
  tiles: LaidTile[];
  leftAnchor: { x: number; y: number };
  rightAnchor: { x: number; y: number };
};

/** User / auto bend prefs — never free-position tiles. */
export type LayoutPrefs = {
  /** Travel direction of the opening toward the logical right end. */
  startDir: TrainDir;
  /**
   * Forced travel direction for a tile id (user 90° pivots).
   * Dir is growth away from the opening along that arm.
   */
  dirById: Record<string, TrainDir>;
};

export const DEFAULT_LAYOUT_PREFS: LayoutPrefs = {
  startDir: "E",
  dirById: {},
};

export function turnCW(dir: TrainDir): TrainDir {
  const order: TrainDir[] = ["E", "S", "W", "N"];
  return order[(order.indexOf(dir) + 1) % 4];
}

export function turnCCW(dir: TrainDir): TrainDir {
  const order: TrainDir[] = ["E", "S", "W", "N"];
  return order[(order.indexOf(dir) + 3) % 4];
}

function opposite(dir: TrainDir): TrainDir {
  return turnCW(turnCW(dir));
}

function isDouble(tile: PlacedTile): boolean {
  return tile.a === tile.b;
}

/**
 * Pixel size of a tile traveling in `dir`.
 * Doubles sit across the line; singles lie along it.
 */
function boxFor(tile: PlacedTile, dir: TrainDir, face: number) {
  const double = isDouble(tile);
  const eastWest = dir === "E" || dir === "W";
  if (eastWest) {
    return {
      w: double ? face : face * 2,
      h: double ? face * 2 : face,
      orientation: (double ? "vertical" : "horizontal") as
        | "horizontal"
        | "vertical",
    };
  }
  return {
    w: double ? face * 2 : face,
    h: double ? face : face * 2,
    orientation: (double ? "horizontal" : "vertical") as
      | "horizontal"
      | "vertical",
  };
}

/**
 * Faces along growth `dir` (away from opening).
 * `towardOpening` is the face value that must touch the previous tile.
 */
function facesForGrowth(
  tile: PlacedTile,
  dir: TrainDir,
  towardOpening: number
): { faceA: number; faceB: number } {
  if (isDouble(tile)) return { faceA: tile.a, faceB: tile.b };

  const away =
    tile.left === towardOpening
      ? tile.right
      : tile.right === towardOpening
        ? tile.left
        : tile.right;

  switch (dir) {
    case "E":
      return { faceA: towardOpening, faceB: away };
    case "W":
      return { faceA: away, faceB: towardOpening };
    case "S":
      return { faceA: towardOpening, faceB: away };
    case "N":
      return { faceA: away, faceB: towardOpening };
    default: {
      const _exhaustive: never = dir;
      return _exhaustive;
    }
  }
}

function exitMid(
  x: number,
  y: number,
  width: number,
  height: number,
  dir: TrainDir
): { x: number; y: number } {
  switch (dir) {
    case "E":
      return { x: x + width, y: y + height / 2 };
    case "W":
      return { x: x, y: y + height / 2 };
    case "S":
      return { x: x + width / 2, y: y + height };
    case "N":
      return { x: x + width / 2, y: y };
    default: {
      const _exhaustive: never = dir;
      return _exhaustive;
    }
  }
}

/** Straight placement: entry edge center sits `gap` past `exit` along `dir`. */
function placeStraight(
  exit: { x: number; y: number },
  w: number,
  h: number,
  dir: TrainDir,
  gap: number
): { x: number; y: number } {
  switch (dir) {
    case "E":
      return { x: exit.x + gap, y: exit.y - h / 2 };
    case "W":
      return { x: exit.x - gap - w, y: exit.y - h / 2 };
    case "S":
      return { x: exit.x - w / 2, y: exit.y + gap };
    case "N":
      return { x: exit.x - w / 2, y: exit.y - gap - h };
    default: {
      const _exhaustive: never = dir;
      return _exhaustive;
    }
  }
}

/**
 * 90° elbow like a table snake: next tile sits past the corner so the train
 * twists along the wall instead of straddling the previous end.
 *
 * CW:  E→S, S→W, W→N, N→E
 * CCW: E→N, N→W, W→S, S→E
 */
function placeElbow(
  from: { x: number; y: number; width: number; height: number },
  fromDir: TrainDir,
  toDir: TrainDir,
  w: number,
  h: number,
  gap: number
): { x: number; y: number } | null {
  const cw = turnCW(fromDir);
  const ccw = turnCCW(fromDir);
  if (toDir !== cw && toDir !== ccw) return null;

  const { x, y, width, height } = from;

  // Outer corner of the previous tile in the turn direction.
  if (fromDir === "E" && toDir === "S") {
    return { x: x + width - w, y: y + height + gap };
  }
  if (fromDir === "E" && toDir === "N") {
    return { x: x + width - w, y: y - gap - h };
  }
  if (fromDir === "W" && toDir === "S") {
    return { x: x, y: y + height + gap };
  }
  if (fromDir === "W" && toDir === "N") {
    return { x: x, y: y - gap - h };
  }
  if (fromDir === "S" && toDir === "W") {
    return { x: x - gap - w, y: y + height - h };
  }
  if (fromDir === "S" && toDir === "E") {
    return { x: x + width + gap, y: y + height - h };
  }
  if (fromDir === "N" && toDir === "W") {
    return { x: x - gap - w, y: y };
  }
  if (fromDir === "N" && toDir === "E") {
    return { x: x + width + gap, y: y };
  }
  return null;
}

function placeTile(
  from: { x: number; y: number; width: number; height: number; dir: TrainDir },
  toDir: TrainDir,
  w: number,
  h: number,
  gap: number
): { x: number; y: number } {
  if (toDir === from.dir) {
    const exit = exitMid(from.x, from.y, from.width, from.height, from.dir);
    return placeStraight(exit, w, h, toDir, gap);
  }
  const elbow = placeElbow(from, from.dir, toDir, w, h, gap);
  if (elbow) return elbow;
  // U-turn fallback: step from the far end in the new direction.
  const exit = exitMid(from.x, from.y, from.width, from.height, from.dir);
  return placeStraight(exit, w, h, toDir, gap);
}

function fits(
  x: number,
  y: number,
  w: number,
  h: number,
  boardW: number,
  boardH: number,
  pad: number
) {
  return x >= pad && y >= pad && x + w <= boardW - pad && y + h <= boardH - pad;
}

function overlaps(
  x: number,
  y: number,
  w: number,
  h: number,
  others: Array<{ x: number; y: number; width: number; height: number }>,
  margin = 1
) {
  for (const o of others) {
    if (
      x < o.x + o.width + margin &&
      x + w + margin > o.x &&
      y < o.y + o.height + margin &&
      y + h + margin > o.y
    ) {
      return true;
    }
  }
  return false;
}

function uniqueDirs(dirs: TrainDir[]): TrainDir[] {
  const seen = new Set<TrainDir>();
  const out: TrainDir[] = [];
  for (const d of dirs) {
    if (seen.has(d)) continue;
    seen.add(d);
    out.push(d);
  }
  return out;
}

function clampTl(
  tl: { x: number; y: number },
  w: number,
  h: number,
  boardW: number,
  boardH: number,
  pad: number
) {
  return {
    x: Math.min(Math.max(tl.x, pad), Math.max(pad, boardW - pad - w)),
    y: Math.min(Math.max(tl.y, pad), Math.max(pad, boardH - pad - h)),
  };
}

/**
 * Pivot tile at `index` 90° CW — that tile and the arm beyond it (away from
 * the opening) re-snake. Opening pivot turns the whole spine.
 */
export function prefsAfterRotate(
  prefs: LayoutPrefs,
  chain: PlacedTile[],
  index: number,
  currentDir: TrainDir,
  openingIndex: number
): LayoutPrefs {
  const nextDir = turnCW(currentDir);
  const dirById: Record<string, TrainDir> = { ...prefs.dirById };

  if (index === openingIndex) {
    return {
      startDir: nextDir,
      dirById: { [chain[index].id]: nextDir },
    };
  }

  if (index > openingIndex) {
    for (let i = index; i < chain.length; i += 1) {
      delete dirById[chain[i].id];
    }
    dirById[chain[index].id] = nextDir;
    return { ...prefs, dirById };
  }

  for (let i = 0; i <= index; i += 1) {
    delete dirById[chain[i].id];
  }
  dirById[chain[index].id] = nextDir;
  return { ...prefs, dirById };
}

type ArmNode = {
  tile: PlacedTile;
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: "horizontal" | "vertical";
  faceA: number;
  faceB: number;
  /** Growth direction away from the opening. */
  dir: TrainDir;
  /** Open face at the far end of this arm segment. */
  farFace: number;
};

function roomAhead(
  from: ArmNode,
  dir: TrainDir,
  boardW: number,
  boardH: number,
  pad: number
): number {
  const exit = exitMid(from.x, from.y, from.width, from.height, from.dir);
  switch (dir) {
    case "E":
      return boardW - pad - exit.x;
    case "W":
      return exit.x - pad;
    case "S":
      return boardH - pad - exit.y;
    case "N":
      return exit.y - pad;
    default: {
      const _exhaustive: never = dir;
      return _exhaustive;
    }
  }
}

function placeArmTile(
  tile: PlacedTile,
  from: ArmNode,
  prefs: LayoutPrefs,
  boardW: number,
  boardH: number,
  face: number,
  gap: number,
  pad: number,
  occupied: ArmNode[]
): ArmNode {
  const towardOpening = from.farFace;
  const forced = prefs.dirById[tile.id];
  const continueDir = from.dir;
  const minStraight = face * 2 + gap;

  const finish = (cand: TrainDir, tl: { x: number; y: number }) => {
    const box = boxFor(tile, cand, face);
    const faces = facesForGrowth(tile, cand, towardOpening);
    const farFace =
      tile.left === towardOpening
        ? tile.right
        : tile.right === towardOpening
          ? tile.left
          : tile.left === tile.right
            ? tile.left
            : tile.right;
    return {
      tile,
      x: tl.x,
      y: tl.y,
      width: box.w,
      height: box.h,
      orientation: box.orientation,
      faceA: faces.faceA,
      faceB: faces.faceB,
      dir: cand,
      farFace,
    };
  };

  const tryDir = (cand: TrainDir): ArmNode | null => {
    const box = boxFor(tile, cand, face);
    const tl = placeTile(from, cand, box.w, box.h, gap);
    if (!fits(tl.x, tl.y, box.w, box.h, boardW, boardH, pad)) return null;
    if (overlaps(tl.x, tl.y, box.w, box.h, occupied)) return null;
    return finish(cand, tl);
  };

  if (forced) {
    const hit = tryDir(forced);
    if (hit) return hit;
    const box = boxFor(tile, forced, face);
    const tl = clampTl(
      placeTile(from, forced, box.w, box.h, gap),
      box.w,
      box.h,
      boardW,
      boardH,
      pad
    );
    return finish(forced, tl);
  }

  // Near a wall: prefer twisting before the straight run runs out of room.
  const straightRoom = roomAhead(from, continueDir, boardW, boardH, pad);
  const preferTurn = straightRoom < minStraight;

  const cw = turnCW(continueDir);
  const ccw = turnCCW(continueDir);
  const cwRoom = roomAhead(from, cw, boardW, boardH, pad);
  const ccwRoom = roomAhead(from, ccw, boardW, boardH, pad);
  const betterTurn = cwRoom >= ccwRoom ? cw : ccw;
  const otherTurn = betterTurn === cw ? ccw : cw;

  const candidates = uniqueDirs(
    preferTurn
      ? [betterTurn, otherTurn, continueDir, opposite(continueDir)]
      : [continueDir, betterTurn, otherTurn, opposite(continueDir)]
  );

  for (const cand of candidates) {
    const hit = tryDir(cand);
    if (hit) return hit;
  }

  // Last resort: twist toward open space and clamp into the pad.
  const cand = betterTurn;
  const box = boxFor(tile, cand, face);
  const tl = clampTl(
    placeTile(from, cand, box.w, box.h, gap),
    box.w,
    box.h,
    boardW,
    boardH,
    pad
  );
  return finish(cand, tl);
}

/**
 * Snake the chain inside the square with the opening tile fixed at center.
 * Arms grow both ways and twist 90° near walls (table-style elbows).
 */
export function layoutChain(
  chain: PlacedTile[],
  boardW: number,
  boardH: number,
  face = 26,
  gap = 2,
  prefs: LayoutPrefs = DEFAULT_LAYOUT_PREFS,
  openingTileId: string | null = null
): ChainLayout {
  // Keep a comfortable gutter so twists happen before tiles kiss the rail.
  const pad = Math.max(28, Math.floor(face * 1.15));

  if (chain.length === 0) {
    return {
      tiles: [],
      leftAnchor: { x: boardW / 2, y: boardH / 2 },
      rightAnchor: { x: boardW / 2, y: boardH / 2 },
    };
  }

  let openingIndex = openingTileId
    ? chain.findIndex((t) => t.id === openingTileId)
    : 0;
  if (openingIndex < 0) openingIndex = 0;

  const opening = chain[openingIndex];
  const spineDir = prefs.dirById[opening.id] ?? prefs.startDir;
  const openingBox = boxFor(opening, spineDir, face);
  const ox = (boardW - openingBox.w) / 2;
  const oy = (boardH - openingBox.h) / 2;
  const openingFaces = isDouble(opening)
    ? { faceA: opening.a, faceB: opening.b }
    : spineDir === "E" || spineDir === "S"
      ? { faceA: opening.left, faceB: opening.right }
      : { faceA: opening.right, faceB: opening.left };

  const openingNode: ArmNode = {
    tile: opening,
    x: ox,
    y: oy,
    width: openingBox.w,
    height: openingBox.h,
    orientation: openingBox.orientation,
    faceA: openingFaces.faceA,
    faceB: openingFaces.faceB,
    dir: spineDir,
    farFace: opening.right,
  };

  const occupied: ArmNode[] = [openingNode];

  // Right arm: opening → … → chain end (logical right)
  const rightNodes: ArmNode[] = [];
  let cursor: ArmNode = {
    ...openingNode,
    farFace: opening.right,
  };
  for (let i = openingIndex + 1; i < chain.length; i += 1) {
    cursor = placeArmTile(
      chain[i],
      cursor,
      prefs,
      boardW,
      boardH,
      face,
      gap,
      pad,
      occupied
    );
    rightNodes.push(cursor);
    occupied.push(cursor);
  }

  // Left arm: opening → … → chain start (logical left)
  const leftNodes: ArmNode[] = [];
  cursor = {
    ...openingNode,
    dir: opposite(spineDir),
    farFace: opening.left,
  };
  for (let i = openingIndex - 1; i >= 0; i -= 1) {
    cursor = placeArmTile(
      chain[i],
      cursor,
      prefs,
      boardW,
      boardH,
      face,
      gap,
      pad,
      occupied
    );
    leftNodes.push(cursor);
    occupied.push(cursor);
  }

  const tiles: LaidTile[] = [
    ...leftNodes
      .slice()
      .reverse()
      .map(({ farFace: _f, ...laid }) => laid),
    (({ farFace: _f, ...laid }) => laid)(openingNode),
    ...rightNodes.map(({ farFace: _f, ...laid }) => laid),
  ];

  const leftTip =
    leftNodes.length > 0 ? leftNodes[leftNodes.length - 1] : openingNode;
  const rightTip =
    rightNodes.length > 0 ? rightNodes[rightNodes.length - 1] : openingNode;
  // Drop zones are face×1.5 (PlayChain); center so their near edge clears the tile by 4px.
  const dropHalf = Math.round(face * 1.5) / 2;
  const anchorOut = dropHalf + 4;

  const leftGrowthDir =
    leftNodes.length > 0
      ? leftNodes[leftNodes.length - 1].dir
      : opposite(spineDir);
  const rightGrowthDir =
    rightNodes.length > 0 ? rightNodes[rightNodes.length - 1].dir : spineDir;

  return {
    tiles,
    leftAnchor: nudgeAnchor(
      exitMid(
        leftTip.x,
        leftTip.y,
        leftTip.width,
        leftTip.height,
        leftGrowthDir
      ),
      leftGrowthDir,
      anchorOut
    ),
    rightAnchor: nudgeAnchor(
      exitMid(
        rightTip.x,
        rightTip.y,
        rightTip.width,
        rightTip.height,
        rightGrowthDir
      ),
      rightGrowthDir,
      anchorOut
    ),
  };
}

function nudgeAnchor(
  point: { x: number; y: number },
  dir: TrainDir,
  amount: number
): { x: number; y: number } {
  switch (dir) {
    case "E":
      return { x: point.x + amount, y: point.y };
    case "W":
      return { x: point.x - amount, y: point.y };
    case "S":
      return { x: point.x, y: point.y + amount };
    case "N":
      return { x: point.x, y: point.y - amount };
    default: {
      const _exhaustive: never = dir;
      return _exhaustive;
    }
  }
}
