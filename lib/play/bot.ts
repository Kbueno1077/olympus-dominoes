import { legalMovesForSeat, openEnds } from "./engine";
import { formatTile, isDouble, tilePips } from "./tiles";
import type { GameSnapshot, LegalMove, Tile } from "./types";

export type BotDecision =
  | { type: "play"; move: LegalMove; reason: string }
  | { type: "drawOrPass"; reason: string };

function countSuitInHand(hand: Tile[], suit: number): number {
  return hand.filter((t) => t.a === suit || t.b === suit).length;
}

/**
 * Heuristic bot:
 * - Prefer going out
 * - Prefer doubles (control the spinner / board shape)
 * - Prefer depleting suits you hold many of
 * - Prefer high pips early, low pips when opponents are short
 * - In 2v2, lightly favor ends that your partner might still hold
 * - Avoid leaving a single awkward end when possible
 */
export function chooseBotMove(state: GameSnapshot, seatIndex: number): BotDecision {
  const seat = state.seats[seatIndex];
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

  const partner = state.seats.find(
    (s) => s.team === seat.team && s.index !== seat.index
  );
  const opponents = state.seats.filter((s) => s.team !== seat.team);
  const oppMinHand = Math.min(...opponents.map((s) => s.hand.length));
  const ends = openEnds(state.chain);

  let best = moves[0];
  let bestScore = -Infinity;
  let bestReason = "fallback";

  for (const move of moves) {
    const tile = seat.hand.find((t) => t.id === move.tileId);
    if (!tile) continue;

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

    // Dump pips while opponents still have many tiles; conserve when racing.
    const pip = tilePips(tile);
    if (oppMinHand <= 2) {
      score -= pip * 2;
      notes.push("keep low vs short rival");
    } else {
      score += pip;
      notes.push(`dump ${pip} pips`);
    }

    // Prefer playing a suit you hold heavily (flexibility).
    const suitPlayed =
      move.side === "right"
        ? ends
          ? ends.right
          : tile.a
        : ends
          ? ends.left
          : tile.b;
    const suitCount = countSuitInHand(seat.hand, suitPlayed);
    score += suitCount * 8;
    if (suitCount >= 3) notes.push(`thick in ${suitPlayed}s`);

    // After the move, new exposed end on that side.
    const newEnd = move.side === "right" ? move.right : move.left;
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

    // Partner awareness (hidden info: we only know counts, not tiles —
    // use team seat hand length as a weak prior; prefer not to starve partner).
    if (partner && partner.hand.length <= 3) {
      score += 5;
      notes.push("partner is short — pressure");
    }

    // Slight preference for the longer side of a balanced board (variety).
    if (state.chain.length > 4 && move.side === "left") {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      best = move;
      bestReason = `${formatTile(tile)} on ${move.side} · score ${score.toFixed(0)} · ${notes.join(", ")}`;
    }
  }

  return { type: "play", move: best, reason: bestReason };
}
