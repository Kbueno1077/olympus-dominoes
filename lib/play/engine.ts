import {
  buildSet,
  formatTile,
  handPips,
  isDouble,
  modeConfig,
  setConfig,
  shuffleTiles,
  tilePips,
} from "./tiles";
import type {
  ChainSide,
  DominoSetId,
  GameLogEntry,
  GameResult,
  GameSnapshot,
  HandRecord,
  LegalMove,
  LogLevel,
  MatchSnapshot,
  PlacedTile,
  PlayModeId,
  Seat,
  Tile,
} from "./types";

let logSeq = 0;

function makeLog(
  level: LogLevel,
  message: string,
  detail?: string
): GameLogEntry {
  logSeq += 1;
  return {
    id: `log-${logSeq}`,
    at: Date.now(),
    level,
    message,
    detail,
  };
}

function appendLog(
  state: GameSnapshot,
  level: LogLevel,
  message: string,
  detail?: string
): GameSnapshot {
  return {
    ...state,
    logs: [...state.logs, makeLog(level, message, detail)].slice(-200),
  };
}

export function openEnds(chain: PlacedTile[]): { left: number; right: number } | null {
  if (chain.length === 0) return null;
  return { left: chain[0].left, right: chain[chain.length - 1].right };
}

function placementFor(
  tile: Tile,
  side: ChainSide,
  ends: { left: number; right: number } | null
): { left: number; right: number } | null {
  if (!ends) {
    if (isDouble(tile)) return { left: tile.a, right: tile.b };
    return { left: tile.a, right: tile.b };
  }

  if (side === "right") {
    const need = ends.right;
    if (tile.a === need) return { left: tile.a, right: tile.b };
    if (tile.b === need) return { left: tile.b, right: tile.a };
    return null;
  }

  const need = ends.left;
  if (tile.a === need) return { left: tile.b, right: tile.a };
  if (tile.b === need) return { left: tile.a, right: tile.b };
  return null;
}

/** Highest double in a hand, if any; otherwise the heaviest tile. */
export function bestOpeningTile(hand: Tile[]): Tile | null {
  let bestDouble: Tile | null = null;
  for (const tile of hand) {
    if (!isDouble(tile)) continue;
    if (!bestDouble || tile.a > bestDouble.a) bestDouble = tile;
  }
  if (bestDouble) return bestDouble;

  let best: Tile | null = null;
  for (const tile of hand) {
    if (!best || tilePips(tile) > tilePips(best)) best = tile;
  }
  return best;
}

export function legalMovesForSeat(state: GameSnapshot, seatIndex: number): LegalMove[] {
  const seat = state.seats[seatIndex];
  if (!seat) return [];
  const ends = openEnds(state.chain);

  if (!ends) {
    const opener = bestOpeningTile(seat.hand);
    if (!opener) return [];
    const placed = placementFor(opener, "right", null);
    if (!placed) return [];
    return [
      {
        tileId: opener.id,
        side: "right",
        left: placed.left,
        right: placed.right,
      },
    ];
  }

  const moves: LegalMove[] = [];
  for (const tile of seat.hand) {
    for (const side of ["left", "right"] as ChainSide[]) {
      const placed = placementFor(tile, side, ends);
      if (placed) {
        moves.push({
          tileId: tile.id,
          side,
          left: placed.left,
          right: placed.right,
        });
      }
    }
  }
  return moves;
}

function seatNames(modeId: PlayModeId): string[] {
  switch (modeId) {
    case "1v1":
      return ["playSeatYou", "playSeatBot"];
    case "2v2":
      return ["playSeatYou", "playSeatRivalA", "playSeatPartner", "playSeatRivalB"];
    case "ffa4":
      return ["playSeatYou", "playSeatBot1", "playSeatBot2", "playSeatBot3"];
    default: {
      const _exhaustive: never = modeId;
      return _exhaustive;
    }
  }
}

function teamFor(modeId: PlayModeId, index: number): number {
  const cfg = modeConfig(modeId);
  if (!cfg.teams) return index + 1;
  return index % 2 === 0 ? 1 : 2;
}

/**
 * Seat positions around a square table (human always at bottom).
 * Partners face each other: bottom↔top, left↔right.
 * 1v1 uses bottom + top only.
 */
export function seatPositions(
  modeId: PlayModeId
): Array<"bottom" | "top" | "left" | "right"> {
  switch (modeId) {
    case "1v1":
      return ["bottom", "top"];
    case "2v2":
    case "ffa4":
      // indices 0 You, 1 Rival A (right), 2 Partner/Bot2 (top), 3 Rival B (left)
      return ["bottom", "right", "top", "left"];
    default: {
      const _exhaustive: never = modeId;
      return _exhaustive;
    }
  }
}

function pickStarter(hands: Tile[][]): number {
  let bestSeat = 0;
  let bestScore = -1;
  hands.forEach((hand, index) => {
    for (const tile of hand) {
      const score = isDouble(tile) ? 1000 + tile.a : tilePips(tile);
      if (score > bestScore) {
        bestScore = score;
        bestSeat = index;
      }
    }
  });
  return bestSeat;
}

/** Double-nine is block-only: leftover tiles sleep, nobody draws. */
export function allowsDraw(setId: DominoSetId): boolean {
  return setId === "double_six";
}

export function createGame(
  modeId: PlayModeId,
  setId: DominoSetId = "double_six",
  handIndex = 1,
  seed?: number
): GameSnapshot {
  const set = setConfig(setId);
  const mode = modeConfig(modeId);
  const deck = shuffleTiles(buildSet(set.maxPip), seed);
  const names = seatNames(modeId);
  const canDraw = allowsDraw(setId);

  const seats: Seat[] = [];
  let cursor = 0;
  for (let i = 0; i < mode.players; i += 1) {
    const hand = deck.slice(cursor, cursor + set.tilesPerHand);
    cursor += set.tilesPerHand;
    seats.push({
      index: i,
      name: names[i],
      kind: i === 0 ? "human" : "bot",
      team: teamFor(modeId, i),
      hand,
    });
  }

  // Sleeping tiles: on double-nine never enter the boneyard for draws.
  const remainder = deck.slice(cursor);
  const boneyard = canDraw ? remainder : [];

  const starter = pickStarter(seats.map((s) => s.hand));
  const starterTile = bestOpeningTile(seats[starter].hand)!;

  let state: GameSnapshot = {
    phase: "playing",
    setId,
    modeId,
    maxPip: set.maxPip,
    allowDraw: canDraw,
    seats,
    boneyard,
    chain: [],
    openingTileId: null,
    lastPasserIndex: null,
    turn: starter,
    passesInRow: 0,
    result: null,
    logs: [],
    starter,
    handIndex,
  };

  state = appendLog(
    state,
    "info",
    `Hand ${handIndex} · ${mode.label} · ${setId.replace("_", " ")}`,
    `${mode.players} players, ${set.tilesPerHand} each` +
      (canDraw
        ? `, boneyard ${boneyard.length}`
        : `, ${remainder.length} sleeping (no draw)`)
  );

  seats.forEach((seat) => {
    state = appendLog(
      state,
      "info",
      `${seat.name} (${seat.kind}) team ${seat.team}`,
      seat.kind === "human"
        ? `Hand: ${seat.hand.map(formatTile).join(" ")}`
        : `${seat.hand.length} tiles hidden`
    );
  });

  state = appendLog(
    state,
    "info",
    `${seats[starter].name} opens`,
    `Must lead ${formatTile(starterTile)}`
  );

  return state;
}

function removeFromHand(hand: Tile[], tileId: string): Tile[] {
  return hand.filter((t) => t.id !== tileId);
}

function findTile(hand: Tile[], tileId: string): Tile | undefined {
  return hand.find((t) => t.id === tileId);
}

function nextTurn(state: GameSnapshot): number {
  return (state.turn + 1) % state.seats.length;
}

/** Points the winning team scores from remaining pips on losing seats. */
function pointsForWinners(
  state: GameSnapshot,
  winnerTeam: number,
  pipTotals: number[]
): number {
  return state.seats.reduce((sum, seat) => {
    if (seat.team === winnerTeam) return sum;
    return sum + pipTotals[seat.index];
  }, 0);
}

function finishIfNeeded(state: GameSnapshot): GameSnapshot {
  const empty = state.seats.find((s) => s.hand.length === 0);
  if (empty) {
    const winners = state.seats
      .filter((s) => s.team === empty.team)
      .map((s) => s.index);
    const pipTotals = state.seats.map((s) => handPips(s.hand));
    const pointsAwarded = pointsForWinners(state, empty.team, pipTotals);
    const result: GameResult = {
      reason: "emptied",
      winners,
      winnerTeam: empty.team,
      pointsAwarded,
      pipTotals,
    };
    let next: GameSnapshot = { ...state, phase: "finished", result };
    next = appendLog(
      next,
      "win",
      `${empty.name} went out · +${pointsAwarded} for team ${empty.team}`,
      `Pips left [${pipTotals.join(", ")}]`
    );
    return next;
  }

  if (state.passesInRow >= state.seats.length && state.chain.length > 0) {
    const totals = state.seats.map((s) => handPips(s.hand));
    const cfg = modeConfig(state.modeId);
    let winners: number[] = [];
    let winnerTeam = 1;

    if (cfg.teams) {
      const teamPips = new Map<number, number>();
      state.seats.forEach((seat) => {
        teamPips.set(
          seat.team,
          (teamPips.get(seat.team) ?? 0) + totals[seat.index]
        );
      });
      let best = Infinity;
      teamPips.forEach((pips) => {
        if (pips < best) best = pips;
      });
      const winningTeams: number[] = [];
      teamPips.forEach((pips, team) => {
        if (pips === best) winningTeams.push(team);
      });
      winnerTeam = winningTeams[0];
      winners = state.seats
        .filter((s) => winningTeams.includes(s.team))
        .map((s) => s.index);
    } else {
      const best = Math.min(...totals);
      winners = totals
        .map((p, i) => (p === best ? i : -1))
        .filter((i) => i >= 0);
      winnerTeam = state.seats[winners[0]].team;
    }

    const pointsAwarded = pointsForWinners(state, winnerTeam, totals);
    const result: GameResult = {
      reason: "blocked",
      winners,
      winnerTeam,
      pointsAwarded,
      pipTotals: totals,
    };
    let next: GameSnapshot = { ...state, phase: "finished", result };
    next = appendLog(
      next,
      "win",
      `Blocked · team ${winnerTeam} +${pointsAwarded}`,
      `Pips [${totals.join(", ")}]`
    );
    return next;
  }

  return state;
}

export function playMove(
  state: GameSnapshot,
  seatIndex: number,
  move: LegalMove,
  reason?: string
): GameSnapshot {
  if (state.phase !== "playing" || state.turn !== seatIndex) {
    return appendLog(state, "warn", "Illegal play rejected", `seat ${seatIndex} turn ${state.turn}`);
  }

  const seat = state.seats[seatIndex];
  const tile = findTile(seat.hand, move.tileId);
  if (!tile) {
    return appendLog(state, "warn", "Tile not in hand", move.tileId);
  }

  const legal = legalMovesForSeat(state, seatIndex).some(
    (m) =>
      m.tileId === move.tileId &&
      m.side === move.side &&
      m.left === move.left &&
      m.right === move.right
  );
  if (!legal) {
    return appendLog(state, "warn", "Move not legal", `${formatTile(tile)} on ${move.side}`);
  }

  const placed: PlacedTile = {
    id: tile.id,
    a: tile.a,
    b: tile.b,
    left: move.left,
    right: move.right,
    playedBy: seatIndex,
  };

  const chain =
    state.chain.length === 0
      ? [placed]
      : move.side === "left"
        ? [placed, ...state.chain]
        : [...state.chain, placed];

  const seats = state.seats.map((s) =>
    s.index === seatIndex ? { ...s, hand: removeFromHand(s.hand, tile.id) } : s
  );

  let next: GameSnapshot = {
    ...state,
    seats,
    chain,
    openingTileId: state.openingTileId ?? placed.id,
    lastPasserIndex: null,
    passesInRow: 0,
    turn: nextTurn(state),
  };

  next = appendLog(
    next,
    seat.kind === "bot" ? "bot" : "play",
    `${seat.name} plays ${formatTile(tile)} on ${move.side}`,
    reason ??
      `Ends → ${openEnds(chain)?.left} … ${openEnds(chain)?.right} · hand left ${seats[seatIndex].hand.length}`
  );

  return finishIfNeeded(next);
}

export function drawOrPass(state: GameSnapshot, seatIndex: number): GameSnapshot {
  if (state.phase !== "playing" || state.turn !== seatIndex) {
    return appendLog(state, "warn", "Draw/pass out of turn", `seat ${seatIndex}`);
  }

  const seat = state.seats[seatIndex];
  const moves = legalMovesForSeat(state, seatIndex);
  if (moves.length > 0) {
    return appendLog(state, "warn", "Cannot pass — legal moves exist", String(moves.length));
  }

  if (state.allowDraw && state.boneyard.length > 0) {
    const [drawn, ...rest] = state.boneyard;
    const seats = state.seats.map((s) =>
      s.index === seatIndex ? { ...s, hand: [...s.hand, drawn] } : s
    );
    let next: GameSnapshot = {
      ...state,
      seats,
      boneyard: rest,
      passesInRow: 0,
    };
    next = appendLog(
      next,
      seat.kind === "bot" ? "bot" : "info",
      `${seat.name} draws from boneyard`,
      seat.kind === "human"
        ? `Drew ${formatTile(drawn)} · boneyard ${rest.length}`
        : `Boneyard ${rest.length} left`
    );

    const afterDrawMoves = legalMovesForSeat(next, seatIndex);
    if (afterDrawMoves.length > 0) {
      next = appendLog(
        next,
        "info",
        `${seat.name} can play after draw`,
        `${afterDrawMoves.length} legal move(s)`
      );
      return next;
    }

    if (rest.length > 0) {
      return drawOrPass(next, seatIndex);
    }
  } else if (!state.allowDraw) {
    state = appendLog(
      state,
      "info",
      `${seat.name} cannot draw (double-nine is block-only)`,
      "Passing instead"
    );
  }

  let next: GameSnapshot = {
    ...state,
    passesInRow: state.passesInRow + 1,
    lastPasserIndex: seatIndex,
    turn: nextTurn(state),
  };
  next = appendLog(
    next,
    seat.kind === "bot" ? "bot" : "info",
    `${seat.name} passes`,
    `Passes in a row: ${next.passesInRow}`
  );
  return finishIfNeeded(next);
}

export function addBotLog(
  state: GameSnapshot,
  message: string,
  detail?: string
): GameSnapshot {
  return appendLog(state, "bot", message, detail);
}

export function teamLabels(modeId: PlayModeId): Record<number, string> {
  const cfg = modeConfig(modeId);
  if (cfg.teams) {
    return { 1: "playTeamYou", 2: "playTeamOthers" };
  }
  if (modeId === "1v1") {
    return { 1: "playTeamYou", 2: "playTeamBot" };
  }
  return {
    1: "playTeamYou",
    2: "playTeamBot1",
    3: "playTeamBot2",
    4: "playTeamBot3",
  };
}

export function createMatch(
  modeId: PlayModeId,
  setId: DominoSetId,
  maxPoints: number
): MatchSnapshot {
  const labels = teamLabels(modeId);
  const teamScores: Record<number, number> = {};
  Object.keys(labels).forEach((key) => {
    teamScores[Number(key)] = 0;
  });

  return {
    modeId,
    setId,
    maxPoints,
    teamScores,
    hands: [],
    current: createGame(modeId, setId, 1),
    matchOver: false,
    matchWinnerTeams: [],
  };
}

/** Credit a finished hand onto the scorepad immediately (idempotent). */
export function accountFinishedHand(match: MatchSnapshot): MatchSnapshot {
  const game = match.current;
  if (!game || game.phase !== "finished" || !game.result) return match;
  if (match.hands.some((hand) => hand.handIndex === game.handIndex)) {
    return match;
  }

  const { result } = game;
  const teamScores = { ...match.teamScores };
  teamScores[result.winnerTeam] =
    (teamScores[result.winnerTeam] ?? 0) + result.pointsAwarded;

  const record: HandRecord = {
    handIndex: game.handIndex,
    reason: result.reason,
    winnerTeam: result.winnerTeam,
    winners: result.winners,
    pointsAwarded: result.pointsAwarded,
    pipTotals: result.pipTotals,
    teamTotals: { ...teamScores },
  };

  const hands = [...match.hands, record];
  const reached = Object.entries(teamScores)
    .filter(([, pts]) => pts >= match.maxPoints)
    .map(([team]) => Number(team));

  return {
    ...match,
    teamScores,
    hands,
    current: game,
    matchOver: reached.length > 0,
    matchWinnerTeams: reached,
  };
}

/** Deal the next hand after scores are already on the pad. */
export function dealNextHand(match: MatchSnapshot): MatchSnapshot {
  const accounted = accountFinishedHand(match);
  const game = accounted.current;
  if (!game || game.phase !== "finished") return accounted;
  if (accounted.matchOver) return accounted;

  return {
    ...accounted,
    current: createGame(accounted.modeId, accounted.setId, game.handIndex + 1),
    matchOver: false,
    matchWinnerTeams: [],
  };
}

/** Apply finished-hand scores and deal the next hand if the match continues. */
export function recordFinishedHand(match: MatchSnapshot): MatchSnapshot {
  return dealNextHand(match);
}
