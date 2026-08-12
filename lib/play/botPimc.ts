import { drawOrPass, legalMovesForSeat, playMove } from "./engine";
import { formatTile, isDouble, tilePips } from "./tiles";
import type { GameSnapshot, LegalMove, Tile } from "./types";

export type PimcDecision =
  | { type: "play"; move: LegalMove; reason: string }
  | { type: "drawOrPass"; reason: string };

/** Keep web turns responsive; raise later if you want stronger search. */
export const PIMC_DETERMINIZATIONS = 14;
const PIMC_MAX_PLIES = 280;

function cloneState(state: GameSnapshot): GameSnapshot {
  return {
    ...state,
    seats: state.seats.map((seat) => ({
      ...seat,
      hand: seat.hand.map((tile) => ({ ...tile })),
    })),
    boneyard: state.boneyard.map((tile) => ({ ...tile })),
    chain: state.chain.map((tile) => ({ ...tile })),
    suitVoids: (state.suitVoids ?? state.seats.map(() => [])).map((v) => [
      ...v,
    ]),
    favoredSuitsByTeam: Object.fromEntries(
      Object.entries(state.favoredSuitsByTeam ?? {}).map(([team, suits]) => [
        team,
        [...suits],
      ])
    ),
    logs: [],
    result: state.result
      ? {
          ...state.result,
          winners: [...state.result.winners],
          pipTotals: [...state.result.pipTotals],
        }
      : null,
  };
}

function moveKey(move: LegalMove): string {
  return `${move.tileId}:${move.side}`;
}

function voidsFor(state: GameSnapshot, seatIndex: number): Set<number> {
  return new Set(state.suitVoids?.[seatIndex] ?? []);
}

function tileHitsVoid(tile: Tile, voids: Set<number>): boolean {
  return voids.has(tile.a) || voids.has(tile.b);
}

/**
 * Fast rollout policy (same spirit as the Python HeuristicBot):
 * dump pips, unload doubles — not Table sense (kept for the live option).
 */
function pickRolloutMove(
  state: GameSnapshot,
  seatIndex: number
): LegalMove | null {
  const moves = legalMovesForSeat(state, seatIndex);
  if (moves.length === 0) return null;
  const seat = state.seats[seatIndex];
  let best = moves[0];
  let bestScore = -Infinity;
  for (const move of moves) {
    const tile = seat.hand.find((t) => t.id === move.tileId);
    if (!tile) continue;
    let score = tilePips(tile);
    if (isDouble(tile)) score += 3;
    if (seat.hand.length - 1 === 0) score += 10_000;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

function randomConstrainedDeal(
  pool: Tile[],
  handSizes: { seat: number; size: number }[],
  boneyardSize: number,
  knownVoid: Map<number, Set<number>>,
  rng: () => number
): { hands: Map<number, Tile[]>; boneyard: Tile[] } | null {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const assignment = new Map<number, Tile[]>();
    let remaining = shuffled;
    let ok = true;
    for (const { seat, size } of handSizes) {
      const voids = knownVoid.get(seat) ?? new Set();
      const chosen: Tile[] = [];
      const rest: Tile[] = [];
      for (const tile of remaining) {
        if (chosen.length < size && !tileHitsVoid(tile, voids)) {
          chosen.push(tile);
        } else {
          rest.push(tile);
        }
      }
      if (chosen.length < size) {
        ok = false;
        break;
      }
      assignment.set(seat, chosen);
      remaining = rest;
    }
    if (!ok || remaining.length !== boneyardSize) continue;
    return { hands: assignment, boneyard: remaining };
  }
  return null;
}

function determinize(
  state: GameSnapshot,
  observerSeat: number,
  rng: () => number
): GameSnapshot {
  const det = cloneState(state);
  const unseen: Tile[] = [];
  const handSizes: { seat: number; size: number }[] = [];
  const knownVoid = new Map<number, Set<number>>();

  for (const seat of det.seats) {
    if (seat.index === observerSeat) continue;
    unseen.push(...seat.hand);
    handSizes.push({ seat: seat.index, size: seat.hand.length });
    knownVoid.set(seat.index, voidsFor(det, seat.index));
  }
  unseen.push(...det.boneyard);
  const boneyardSize = det.boneyard.length;

  let deal = randomConstrainedDeal(
    unseen,
    handSizes,
    boneyardSize,
    knownVoid,
    rng
  );
  if (!deal) {
    // Unconstrained fallback (should be rare).
    const pool = [...unseen];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const hands = new Map<number, Tile[]>();
    let i = 0;
    for (const { seat, size } of handSizes) {
      hands.set(seat, pool.slice(i, i + size));
      i += size;
    }
    deal = { hands, boneyard: pool.slice(i) };
  }

  det.seats = det.seats.map((seat) => {
    if (seat.index === observerSeat) return seat;
    return { ...seat, hand: deal!.hands.get(seat.index) ?? [] };
  });
  det.boneyard = deal.boneyard;
  return det;
}

function rolloutToEnd(state: GameSnapshot): GameSnapshot {
  let sim = state;
  let guard = 0;
  while (sim.phase === "playing" && !sim.awaitingOpenerChoice && guard < PIMC_MAX_PLIES) {
    guard += 1;
    const seat = sim.turn;
    const moves = legalMovesForSeat(sim, seat);
    if (moves.length === 0) {
      sim = drawOrPass(sim, seat);
      continue;
    }
    const move = pickRolloutMove(sim, seat);
    if (!move) {
      sim = drawOrPass(sim, seat);
      continue;
    }
    sim = playMove(sim, seat, move);
  }
  return sim;
}

function teamUtility(state: GameSnapshot, myTeam: number): number {
  const result = state.result;
  if (!result) return 0;
  if (result.winnerTeam === myTeam) return result.pointsAwarded;
  return -result.pointsAwarded;
}

/**
 * Perfect-Information Monte Carlo for Olympus Play:
 * sample hidden deals that respect public pass-voids, roll out with a fast
 * heuristic, average **team** outcome (works for 1v1 / 2v2 / FFA).
 * Does not peek at true hidden hands — only reseeds unknowns.
 */
export function choosePimcMove(
  state: GameSnapshot,
  seatIndex: number,
  determinizations: number = PIMC_DETERMINIZATIONS
): PimcDecision {
  const seat = state.seats[seatIndex];
  const moves = legalMovesForSeat(state, seatIndex);

  if (moves.length === 0) {
    return {
      type: "drawOrPass",
      reason: state.allowDraw
        ? state.boneyard.length > 0
          ? "PIMC · no legal play — draw/pass"
          : "PIMC · no legal play — pass"
        : "PIMC · no legal play — pass (block set)",
    };
  }

  if (moves.length === 1) {
    const tile = seat.hand.find((t) => t.id === moves[0].tileId);
    return {
      type: "play",
      move: moves[0],
      reason: `PIMC · only move ${tile ? formatTile(tile) : moves[0].tileId}`,
    };
  }

  // Seeded RNG from public state so the same position is stable-ish in UI.
  let seed =
    (state.handIndex * 7919 +
      state.chain.length * 104729 +
      seatIndex * 13 +
      state.passesInRow * 97) >>>
    0;
  const rng = () => {
    seed = (Math.imul(seed, 48271) + 11) >>> 0;
    return (seed & 0xfffffff) / 0xfffffff;
  };

  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const move of moves) {
    totals.set(moveKey(move), 0);
    counts.set(moveKey(move), 0);
  }

  const myTeam = seat.team;
  const n = Math.max(4, determinizations);

  for (let d = 0; d < n; d += 1) {
    const det = determinize(state, seatIndex, rng);
    for (const move of moves) {
      let sim = cloneState(det);
      // Ensure the candidate tile is still in our hand after determinize
      // (our hand is never reshuffled).
      if (!sim.seats[seatIndex].hand.some((t) => t.id === move.tileId)) {
        continue;
      }
      sim = playMove(sim, seatIndex, move);
      sim = rolloutToEnd(sim);
      const key = moveKey(move);
      totals.set(key, (totals.get(key) ?? 0) + teamUtility(sim, myTeam));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  let best = moves[0];
  let bestAvg = -Infinity;
  for (const move of moves) {
    const key = moveKey(move);
    const c = counts.get(key) ?? 0;
    const avg = c > 0 ? (totals.get(key) ?? 0) / c : -Infinity;
    if (avg > bestAvg) {
      bestAvg = avg;
      best = move;
    }
  }

  const tile = seat.hand.find((t) => t.id === best.tileId);
  return {
    type: "play",
    move: best,
    reason: `PIMC · ${tile ? formatTile(tile) : best.tileId} on ${best.side} · EV ${bestAvg.toFixed(1)} over ${n} deals`,
  };
}
