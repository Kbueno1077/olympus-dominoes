import { legalMovesForSeat, openEnds } from "./engine";
import type { BotBrainId } from "./botBrain";
import { choosePimcMove } from "./botPimc";
import { formatTile, handPips, isDouble, tilePips } from "./tiles";
import type { GameSnapshot, LegalMove, PlacedTile, Seat, Tile } from "./types";

export type BotDecision =
  | { type: "play"; move: LegalMove; reason: string }
  | { type: "drawOrPass"; reason: string };

/** Rough mesa prior: unknown remaining tiles ≈ this many pips each. */
const UNKNOWN_TILE_PIP_PRIOR = 5;

function countSuitInHand(hand: Tile[], suit: number): number {
  return hand.filter((t) => t.a === suit || t.b === suit).length;
}

function voidsFor(state: GameSnapshot, seatIndex: number): Set<number> {
  return new Set(state.suitVoids[seatIndex] ?? []);
}

function nextSeatIndex(state: GameSnapshot): number {
  return (state.turn + 1) % state.seats.length;
}

/** Suit value this move attaches to on the chosen side (the end being covered). */
function coveredEnd(
  move: LegalMove,
  ends: { left: number; right: number } | null,
  tile: Tile
): number {
  if (!ends) return move.side === "right" ? tile.a : tile.b;
  return move.side === "right" ? ends.right : ends.left;
}

/** New open face this move leaves on the chosen side. */
function leavingEnd(move: LegalMove): number {
  return move.side === "right" ? move.right : move.left;
}

function endsAfterMove(
  ends: { left: number; right: number },
  move: LegalMove
): { left: number; right: number } {
  if (move.side === "right") return { left: ends.left, right: move.right };
  return { left: move.left, right: ends.right };
}

/** Seat cannot play either open end, based only on recorded pass-voids. */
function seatStuckOnEnds(
  state: GameSnapshot,
  seatIndex: number,
  left: number,
  right: number
): boolean {
  const voids = voidsFor(state, seatIndex);
  if (left === right) return voids.has(left);
  return voids.has(left) && voids.has(right);
}

/** Public tiles this seat has already laid (consistency + pip dumps). */
function playedBySeat(chain: PlacedTile[], seatIndex: number): PlacedTile[] {
  return chain.filter((tile) => tile.playedBy === seatIndex);
}

function suitPlayCounts(played: PlacedTile[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const tile of played) {
    counts.set(tile.a, (counts.get(tile.a) ?? 0) + 1);
    if (tile.b !== tile.a) {
      counts.set(tile.b, (counts.get(tile.b) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Gamble remaining pip total for a hidden hand:
 * start at 5×tiles, then tilt from how heavy/light their played bones were.
 */
function estimateHiddenPips(state: GameSnapshot, seat: Seat): number {
  const tilesLeft = seat.hand.length;
  if (tilesLeft <= 0) return 0;
  const played = playedBySeat(state.chain, seat.index);
  let estimate = tilesLeft * UNKNOWN_TILE_PIP_PRIOR;
  if (played.length === 0) return estimate;

  const avgPlayed =
    played.reduce((sum, tile) => sum + tile.a + tile.b, 0) / played.length;
  // Dumped heavy → remaining likely lighter; played light → remaining may be heavier.
  const tilt = (UNKNOWN_TILE_PIP_PRIOR - avgPlayed) / UNKNOWN_TILE_PIP_PRIOR;
  estimate *= 1 + Math.max(-0.35, Math.min(0.35, tilt));
  return estimate;
}

type ScoredMove = {
  move: LegalMove;
  score: number;
  reason: string;
};

/**
 * Classic heuristics (hand shape only — blind to the table's pass story).
 */
function scoreClassicMove(
  state: GameSnapshot,
  seatIndex: number,
  move: LegalMove,
  tile: Tile
): ScoredMove {
  const seat = state.seats[seatIndex];
  const partner = state.seats.find(
    (s) => s.team === seat.team && s.index !== seat.index
  );
  const opponents = state.seats.filter((s) => s.team !== seat.team);
  const oppMinHand = Math.min(...opponents.map((s) => s.hand.length));
  const ends = openEnds(state.chain);

  const handAfter = seat.hand.length - 1;
  let score = 0;
  const notes: string[] = [];

  if (handAfter === 0) {
    score += 10_000;
    notes.push("goes out");
  }

  if (isDouble(tile)) {
    score += 40;
    notes.push("double");
  }

  const pip = tilePips(tile);
  if (oppMinHand <= 2) {
    score -= pip * 2;
    notes.push("keep low vs short rival");
  } else {
    score += pip;
    notes.push(`dump ${pip} pips`);
  }

  const suitPlayed = coveredEnd(move, ends, tile);
  const suitCount = countSuitInHand(seat.hand, suitPlayed);
  score += suitCount * 8;
  if (suitCount >= 3) notes.push(`thick in ${suitPlayed}s`);

  const newEnd = leavingEnd(move);
  const keepCount = countSuitInHand(
    seat.hand.filter((t) => t.id !== tile.id),
    newEnd
  );
  score += keepCount * 6;
  if (keepCount === 0) {
    score -= 15;
    notes.push(`exposes bare ${newEnd}`);
  } else {
    notes.push(`keeps ${keepCount}×${newEnd}`);
  }

  if (partner && partner.hand.length <= 3) {
    score += 5;
    notes.push("partner is short — pressure");
  }

  if (state.chain.length > 4 && move.side === "left") {
    score += 1;
  }

  return {
    move,
    score,
    reason: `${formatTile(tile)} on ${move.side} · score ${score.toFixed(0)} · ${notes.join(", ")}`,
  };
}

/**
 * Table-sense layer: only public facts (passes / open ends / counts).
 * No peeking at hidden hands or boneyard faces.
 */
function scoreTableSenseMove(
  state: GameSnapshot,
  seatIndex: number,
  move: LegalMove,
  tile: Tile,
  base: ScoredMove
): ScoredMove {
  const seat = state.seats[seatIndex];
  const partner = state.seats.find(
    (s) => s.team === seat.team && s.index !== seat.index
  );
  const opponents = state.seats.filter((s) => s.team !== seat.team);
  const oppMinHand = Math.min(...opponents.map((s) => s.hand.length));
  const ends = openEnds(state.chain);
  if (!ends) return base;

  const next = nextSeatIndex(state);
  const nextSeat = state.seats[next];
  const nextVoids = voidsFor(state, next);
  const partnerVoids = partner ? voidsFor(state, partner.index) : null;
  const covering = coveredEnd(move, ends, tile);
  const leaving = leavingEnd(move);
  const afterEnds = endsAfterMove(ends, move);
  const handAfter = seat.hand.filter((t) => t.id !== tile.id);

  let score = base.score;
  const notes: string[] = [];

  const nextIsPartner = !!partner && nextSeat.index === partner.index;
  const nextIsOpponent = nextSeat.team !== seat.team;

  // --- Stay consistent with suits this seat already committed to ---
  const myPlayed = playedBySeat(state.chain, seatIndex);
  const mySuitCounts = suitPlayCounts(myPlayed);
  const myFaceHits =
    (mySuitCounts.get(tile.a) ?? 0) +
    (tile.b === tile.a ? 0 : (mySuitCounts.get(tile.b) ?? 0));
  const lineHits =
    (mySuitCounts.get(covering) ?? 0) + (mySuitCounts.get(leaving) ?? 0);
  if (myFaceHits > 0 || lineHits > 0) {
    const consistency = myFaceHits * 10 + lineHits * 6;
    score += consistency;
    notes.push(`stay on my line (+${consistency})`);
  } else if (myPlayed.length >= 2) {
    score -= 8;
    notes.push("off my line");
  }

  // --- Next player (highest attention) ---
  if (nextIsOpponent) {
    if (nextVoids.has(leaving)) {
      score += 55;
      notes.push(`next rival void ${leaving}`);
    } else {
      score -= 12;
      notes.push(`may feed next ${leaving}`);
    }
    if (nextVoids.has(covering) && !nextVoids.has(leaving)) {
      score -= 48;
      notes.push(`kills rival void ${covering}`);
    }
  }

  if (nextIsPartner && partnerVoids) {
    if (partnerVoids.has(leaving)) {
      score -= 52;
      notes.push(`leaves partner void ${leaving}`);
    } else {
      let help = 28;
      if (partner.hand.length >= 5 && oppMinHand <= 3) {
        help = 8;
        notes.push("race — soft partner feed");
      } else if (partner.hand.length <= 2) {
        help = 38;
        notes.push("partner near out — feed");
      } else {
        notes.push(`feed partner ${leaving}`);
      }
      score += help;
    }
    if (partnerVoids.has(covering) && !partnerVoids.has(leaving)) {
      score += 10;
    }
  }

  // --- Team-good vs rival-good ends (opener-seeded favored list, live updates) ---
  const ourFavored = new Set(state.favoredSuitsByTeam?.[seat.team] ?? []);
  const teamLikes = (suit: number) => {
    if (ourFavored.has(suit)) return true;
    if (countSuitInHand(seat.hand, suit) > 0) return true;
    if (partnerVoids && !partnerVoids.has(suit)) return true;
    return false;
  };
  const rivalsLike = (suit: number) =>
    opponents.some((opp) => !voidsFor(state, opp.index).has(suit));

  if (ourFavored.has(leaving)) {
    score += 24;
    notes.push(`keep favored ${leaving}`);
  }
  if (ourFavored.has(covering) && !ourFavored.has(leaving)) {
    score -= 36;
    notes.push(`kills favored ${covering}`);
  }

  if (partner && teamLikes(covering) && partnerVoids?.has(leaving)) {
    score -= 42;
    notes.push(`don't kill our ${covering}`);
  }

  if (rivalsLike(leaving) && nextIsOpponent && !nextVoids.has(leaving)) {
    score -= 8;
  }

  const thick = countSuitInHand(seat.hand, covering);
  if (thick >= 3 && rivalsLike(covering)) {
    score += 14;
    notes.push(`dump hot ${covering}`);
  }

  // --- Close the table (block) gamble ---
  // Only chase a block when we're shorter than every rival; otherwise skip it.
  const myTilesAfter = handAfter.length;
  const shorterThanRivals =
    opponents.length > 0 &&
    opponents.every((opp) => myTilesAfter < opp.hand.length);

  const others = state.seats.filter((s) => s.index !== seatIndex);
  const stuckOthers = others.filter((s) =>
    seatStuckOnEnds(state, s.index, afterEnds.left, afterEnds.right)
  );
  const closeConfidence =
    others.length === 0 ? 0 : stuckOthers.length / others.length;
  const knownFullClose =
    stuckOthers.length === others.length && others.length > 0;

  if (shorterThanRivals && closeConfidence > 0) {
    const myPips = handPips(handAfter);
    const partnerEst = partner ? estimateHiddenPips(state, partner) : null;
    const ourBest =
      partnerEst == null ? myPips : Math.min(myPips, partnerEst);
    const theirBest = Math.min(
      ...opponents.map((opp) => estimateHiddenPips(state, opp))
    );
    const pipEdge = theirBest - ourBest;

    if (knownFullClose) {
      if (pipEdge > 0) {
        const bonus = 70 + Math.min(40, pipEdge * 2);
        score += bonus;
        notes.push(
          `close table · edge ~${pipEdge.toFixed(0)} pips (+${bonus.toFixed(0)})`
        );
      } else {
        score -= 25;
        notes.push(
          `close table · our pips look worse (~${(-pipEdge).toFixed(0)})`
        );
      }
    } else if (closeConfidence >= 0.5 && pipEdge > 2) {
      const bonus = 20 + closeConfidence * 25;
      score += bonus;
      notes.push(
        `block pressure ${stuckOthers.length}/${others.length} · gamble (+${bonus.toFixed(0)})`
      );
    }
  } else if (!shorterThanRivals && knownFullClose) {
    notes.push("close available · disregard (not shorter)");
  }

  const tag = notes.length > 0 ? ` · ${notes.join(", ")}` : "";

  return {
    move,
    score,
    reason: `${formatTile(tile)} on ${move.side} · score ${score.toFixed(0)}${tag}`,
  };
}

function pickBest(
  state: GameSnapshot,
  seatIndex: number,
  moves: LegalMove[],
  brain: BotBrainId
): BotDecision {
  const seat = state.seats[seatIndex];
  let best: ScoredMove | null = null;

  for (const move of moves) {
    const tile = seat.hand.find((t) => t.id === move.tileId);
    if (!tile) continue;
    const classic = scoreClassicMove(state, seatIndex, move, tile);
    const scored =
      brain === "table_sense"
        ? scoreTableSenseMove(state, seatIndex, move, tile, classic)
        : classic;
    if (!best || scored.score > best.score) best = scored;
  }

  if (!best) {
    return {
      type: "drawOrPass",
      reason: "No scorable move",
    };
  }

  return { type: "play", move: best.move, reason: best.reason };
}

/**
 * Bot chooser.
 * - `classic` — hand heuristics only
 * - `table_sense` — classic + public pass/end reading (no cheating)
 * - `pimc` — search over void-respecting random deals (team-aware)
 */
export function chooseBotMove(
  state: GameSnapshot,
  seatIndex: number,
  brain: BotBrainId = "classic"
): BotDecision {
  if (brain === "pimc") {
    return choosePimcMove(state, seatIndex);
  }

  const moves = legalMovesForSeat(state, seatIndex);

  if (moves.length === 0) {
    return {
      type: "drawOrPass",
      reason: state.allowDraw
        ? state.boneyard.length > 0
          ? "No legal play — drawing from the boneyard"
          : "No legal play and empty boneyard — passing"
        : "No legal play — double-nine is block-only, passing",
    };
  }

  return pickBest(state, seatIndex, moves, brain);
}
