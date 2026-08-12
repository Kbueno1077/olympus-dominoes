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
  CompletedPlayGame,
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

function uniqueSuits(suits: number[]): number[] {
  return Array.from(new Set(suits)).sort((a, b) => a - b);
}

function favoredForTeam(
  map: Record<number, number[]>,
  team: number
): number[] {
  return map[team] ?? [];
}

function withFavoredTeam(
  map: Record<number, number[]>,
  team: number,
  suits: number[]
): Record<number, number[]> {
  return { ...map, [team]: uniqueSuits(suits) };
}

/** Add suits to a team's “probably good” list. */
function addFavoredSuits(
  map: Record<number, number[]>,
  team: number,
  suits: number[]
): Record<number, number[]> {
  return withFavoredTeam(map, team, [...favoredForTeam(map, team), ...suits]);
}

/** Drop suits from a team's favored list. */
function removeFavoredSuits(
  map: Record<number, number[]>,
  team: number,
  suits: number[]
): Record<number, number[]> {
  const drop = new Set(suits);
  return withFavoredTeam(
    map,
    team,
    favoredForTeam(map, team).filter((s) => !drop.has(s))
  );
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

/** Highest double in a hand, if any; otherwise the heaviest tile.
 * Used to decide who/which team opens — not to force the lead tile.
 */
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

  // Opening lead: any tile from the hand (doubles are optional, not required).
  if (!ends) {
    const moves: LegalMove[] = [];
    for (const tile of seat.hand) {
      const placed = placementFor(tile, "right", null);
      if (!placed) continue;
      moves.push({
        tileId: tile.id,
        side: "right",
        left: placed.left,
        right: placed.right,
      });
    }
    return moves;
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

function openingScore(tile: Tile): number {
  return isDouble(tile) ? 1000 + tile.a : tilePips(tile);
}

/** First hand: seat with the highest double (else highest pips) opens. */
function pickStarter(hands: Tile[][]): number {
  let bestSeat = 0;
  let bestScore = -1;
  hands.forEach((hand, index) => {
    for (const tile of hand) {
      const score = openingScore(tile);
      if (score > bestScore) {
        bestScore = score;
        bestSeat = index;
      }
    }
  });
  return bestSeat;
}

/** Later hands: best opener among seats on the team that won the last hand. */
function pickStarterOnTeam(seats: Seat[], team: number): number {
  let bestSeat = seats.find((s) => s.team === team)?.index ?? 0;
  let bestScore = -1;
  seats.forEach((seat) => {
    if (seat.team !== team) return;
    for (const tile of seat.hand) {
      const score = openingScore(tile);
      if (score > bestScore) {
        bestScore = score;
        bestSeat = seat.index;
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
  seed?: number,
  /** Team that won the previous hand — they open this one. Omit on hand 1. */
  previousWinnerTeam?: number
): GameSnapshot {
  const set = setConfig(setId);
  const mode = modeConfig(modeId);
  const deck = shuffleTiles(buildSet(set.maxPip), seed);
  const names = seatNames(modeId);
  const canDraw = allowsDraw(setId);
  const humanTeam = teamFor(modeId, 0);

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

  // Hand 1: highest double/tile. Later hands: winners of the previous hand.
  const byHandWin =
    previousWinnerTeam != null &&
    seats.some((s) => s.team === previousWinnerTeam);
  const starter = byHandWin
    ? pickStarterOnTeam(seats, previousWinnerTeam!)
    : pickStarter(seats.map((s) => s.hand));
  const starterTile = bestOpeningTile(seats[starter].hand)!;
  const openingTeam = seats[starter].team;
  // Partners: when your team opens, human chooses You vs Partner.
  const awaitingOpenerChoice = modeId === "2v2" && openingTeam === humanTeam;

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
    suitVoids: seats.map(() => []),
    favoredSuitsByTeam: {},
    turn: starter,
    passesInRow: 0,
    result: null,
    logs: [],
    starter,
    awaitingOpenerChoice,
    handIndex,
  };

  state = appendLog(
    state,
    "info",
    `Hand ${handIndex} · ${mode.label} · ${setId.replace("_", " ")}`,
    `${mode.players} players, ${set.tilesPerHand} each` +
      (canDraw
        ? `, boneyard ${boneyard.length}`
        : `, ${remainder.length} sleeping (no draw)`) +
      ` · table memory reset`
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

  if (awaitingOpenerChoice) {
    state = appendLog(
      state,
      "info",
      "Your team opens",
      byHandWin
        ? "Won the last hand — choose who starts"
        : `Highest tile ${formatTile(starterTile)} decides the team — choose who starts`
    );
  } else {
    state = appendLog(
      state,
      "info",
      `${seats[starter].name} opens`,
      byHandWin
        ? "Won the last hand — lead any tile"
        : `Highest tile ${formatTile(starterTile)} · lead any tile`
    );
  }

  return state;
}

/**
 * 2v2: after the deal, human picks which partner seat opens the empty chain.
 * Chosen seat may lead with any tile from their hand.
 */
export function chooseHandOpener(
  state: GameSnapshot,
  seatIndex: number
): GameSnapshot {
  if (!state.awaitingOpenerChoice || state.phase !== "playing") return state;
  if (state.modeId !== "2v2" || state.chain.length > 0) return state;

  const seat = state.seats[seatIndex];
  const humanTeam = teamFor(state.modeId, 0);
  if (!seat || seat.team !== humanTeam) return state;

  let next: GameSnapshot = {
    ...state,
    awaitingOpenerChoice: false,
    turn: seatIndex,
    starter: seatIndex,
  };
  next = appendLog(next, "info", `${seat.name} opens`, "Lead any tile");
  return next;
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
    const starterSeat = state.seats[state.starter];
    const starterTeam = starterSeat?.team ?? 1;
    let usedStarterTiebreak = false;

    // Blocked: fewest pips is per seat (not partners summed). That seat's
    // team wins. If individuals from different teams tie for fewest, the
    // hand-opener's team takes it.
    const best = Math.min(...totals);
    const tiedSeats = totals
      .map((pips, index) => (pips === best ? index : -1))
      .filter((index) => index >= 0);
    const tiedTeams = Array.from(
      new Set(tiedSeats.map((index) => state.seats[index].team))
    );

    let winnerTeam: number;
    if (tiedTeams.length === 1) {
      winnerTeam = tiedTeams[0];
    } else {
      winnerTeam = starterTeam;
      usedStarterTiebreak = true;
    }

    const winners =
      tiedTeams.length === 1
        ? tiedSeats
        : state.seats
            .filter((seat) => seat.team === winnerTeam)
            .map((seat) => seat.index);

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
      `Pips [${totals.join(", ")}]` +
        (usedStarterTiebreak
          ? ` · individual tie → opener's team (seat ${state.starter}) wins`
          : ` · fewest pips seat ${tiedSeats.join("/")}`)
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
  if (
    state.awaitingOpenerChoice ||
    state.phase !== "playing" ||
    state.turn !== seatIndex
  ) {
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

  const wasOpening = state.chain.length === 0;

  let next: GameSnapshot = {
    ...state,
    seats,
    chain,
    openingTileId: state.openingTileId ?? placed.id,
    lastPasserIndex: null,
    passesInRow: 0,
    turn: nextTurn(state),
  };

  // Hand memory: opener seeds “good for us”; later plays revise it.
  let favored = { ...(state.favoredSuitsByTeam ?? {}) };
  if (wasOpening) {
    favored = addFavoredSuits(favored, seat.team, [tile.a, tile.b]);
  } else {
    const leaving = move.side === "right" ? move.right : move.left;
    // Reinforce the face we leave if we’re already treating it as ours,
    // or if it was one of the faces we just spent from our line.
    const prior = new Set(favoredForTeam(favored, seat.team));
    if (prior.has(leaving) || prior.has(tile.a) || prior.has(tile.b)) {
      favored = addFavoredSuits(favored, seat.team, [leaving]);
    }
  }
  next = { ...next, favoredSuitsByTeam: favored };

  next = appendLog(
    next,
    seat.kind === "bot" ? "bot" : "play",
    `${seat.name} plays ${formatTile(tile)} on ${move.side}`,
    reason ??
      `Ends → ${openEnds(chain)?.left} … ${openEnds(chain)?.right} · hand left ${seats[seatIndex].hand.length}` +
        (wasOpening
          ? ` · team ${seat.team} favors ${[tile.a, tile.b].join("/")}`
          : "")
  );

  return finishIfNeeded(next);
}

export function drawOrPass(state: GameSnapshot, seatIndex: number): GameSnapshot {
  if (
    state.awaitingOpenerChoice ||
    state.phase !== "playing" ||
    state.turn !== seatIndex
  ) {
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
    const priorVoids = state.suitVoids ?? state.seats.map(() => []);
    // Draw invalidates pass-voids for this seat — pickup is unknown to the table.
    const suitVoids = priorVoids.map((voids, i) =>
      i === seatIndex ? [] : [...voids]
    );
    let next: GameSnapshot = {
      ...state,
      seats,
      boneyard: rest,
      suitVoids,
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

  const ends = openEnds(state.chain);
  const priorVoids = state.suitVoids ?? state.seats.map(() => []);
  const suitVoids = priorVoids.map((voids, i) => {
    if (i !== seatIndex || !ends) return [...voids];
    const nextVoids = new Set(voids);
    nextVoids.add(ends.left);
    nextVoids.add(ends.right);
    return Array.from(nextVoids).sort((a, b) => a - b);
  });

  // Revise favored suits from the pass: passer’s team loses those suits;
  // every other team gains them (rivals can’t answer — good control for us).
  let favored = { ...(state.favoredSuitsByTeam ?? {}) };
  if (ends) {
    const passed = [ends.left, ends.right];
    favored = removeFavoredSuits(favored, seat.team, passed);
    const otherTeams = Array.from(
      new Set(state.seats.map((s) => s.team).filter((t) => t !== seat.team))
    );
    for (const team of otherTeams) {
      favored = addFavoredSuits(favored, team, passed);
    }
  }

  let next: GameSnapshot = {
    ...state,
    passesInRow: state.passesInRow + 1,
    lastPasserIndex: seatIndex,
    suitVoids,
    favoredSuitsByTeam: favored,
    turn: nextTurn(state),
  };
  next = appendLog(
    next,
    seat.kind === "bot" ? "bot" : "info",
    `${seat.name} passes`,
    ends
      ? `Void ${ends.left}${ends.left === ends.right ? "" : `/${ends.right}`} · passes in a row: ${next.passesInRow}`
      : `Passes in a row: ${next.passesInRow}`
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
  const gamesWon: Record<number, number> = {};
  Object.keys(labels).forEach((key) => {
    const team = Number(key);
    teamScores[team] = 0;
    gamesWon[team] = 0;
  });

  return {
    modeId,
    setId,
    maxPoints,
    gamesWon,
    completedGames: [],
    gameIndex: 1,
    teamScores,
    hands: [],
    current: createGame(modeId, setId, 1),
    gameOver: false,
    gameWinnerTeams: [],
  };
}

/** Credit a finished hand onto the current-game scorepad (idempotent). */
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

  if (reached.length === 0) {
    return {
      ...match,
      teamScores,
      hands,
      current: game,
      gameOver: false,
      gameWinnerTeams: [],
    };
  }

  // Tiebreak: team that opened this hand / game prefers if both hit target.
  const starterTeam =
    game.seats[game.starter]?.team ?? reached[0];
  const winnerTeam = reached.includes(starterTeam) ? starterTeam : reached[0];

  return {
    ...match,
    teamScores,
    hands,
    current: game,
    gameOver: true,
    gameWinnerTeams: [winnerTeam],
  };
}

/** Deal the next hand inside the current game (not after game over). */
export function dealNextHand(match: MatchSnapshot): MatchSnapshot {
  const accounted = accountFinishedHand(match);
  const game = accounted.current;
  if (!game || game.phase !== "finished") return accounted;
  if (accounted.gameOver) return accounted;

  return {
    ...accounted,
    current: createGame(
      accounted.modeId,
      accounted.setId,
      game.handIndex + 1,
      undefined,
      game.result?.winnerTeam
    ),
    gameOver: false,
    gameWinnerTeams: [],
  };
}

/** Archive the finished game and deal hand 1 of the next game. */
export function startNextGame(match: MatchSnapshot): MatchSnapshot {
  const accounted = accountFinishedHand(match);
  if (!accounted.gameOver || !accounted.current) return accounted;

  const winnerTeam = accounted.gameWinnerTeams[0];
  if (winnerTeam == null) return accounted;

  const completed: CompletedPlayGame = {
    gameIndex: accounted.gameIndex,
    winnerTeam,
    hands: accounted.hands,
    finalScores: { ...accounted.teamScores },
  };

  const labels = teamLabels(accounted.modeId);
  const teamScores: Record<number, number> = {};
  Object.keys(labels).forEach((key) => {
    teamScores[Number(key)] = 0;
  });

  const gamesWon = { ...accounted.gamesWon };
  gamesWon[winnerTeam] = (gamesWon[winnerTeam] ?? 0) + 1;

  return {
    ...accounted,
    gamesWon,
    completedGames: [...accounted.completedGames, completed],
    gameIndex: accounted.gameIndex + 1,
    teamScores,
    hands: [],
    current: createGame(
      accounted.modeId,
      accounted.setId,
      1,
      undefined,
      winnerTeam
    ),
    gameOver: false,
    gameWinnerTeams: [],
  };
}

/** @deprecated Prefer dealNextHand / startNextGame. */
export function recordFinishedHand(match: MatchSnapshot): MatchSnapshot {
  return dealNextHand(match);
}
