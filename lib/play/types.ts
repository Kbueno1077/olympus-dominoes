/** Playable table-dominoes types (block / draw rules). */

export type DominoSetId = "double_six" | "double_nine";

export type PlayModeId = "1v1" | "2v2" | "ffa4";

/**
 * How to resolve a blocked hand when seats from different teams tie for
 * fewest remaining pips.
 */
export type DrawRuleId = "classic" | "wash" | "gambler" | "reversed";

export type Tile = {
  id: string;
  /** Lower face (canonical). */
  a: number;
  /** Higher face (canonical). */
  b: number;
  /**
   * Rack display only: when true, show `b` on top and `a` on bottom (180°).
   * Does not affect rules — a/b stay canonical.
   */
  rackFlip?: boolean;
};

/** One tile as it sits on the chain, left→right. */
export type PlacedTile = {
  id: string;
  a: number;
  b: number;
  left: number;
  right: number;
  /** Seat index that played this tile. */
  playedBy: number;
};

export type ChainSide = "left" | "right";

export type SeatKind = "human" | "bot";

export type Seat = {
  index: number;
  name: string;
  kind: SeatKind;
  /** Partner team (1 or 2). In FFA each seat is its own team. */
  team: number;
  hand: Tile[];
};

export type LegalMove = {
  tileId: string;
  side: ChainSide;
  /** Resulting left/right faces after placement. */
  left: number;
  right: number;
};

export type GamePhase = "setup" | "playing" | "finished";

export type FinishReason = "emptied" | "blocked";

export type GameResult = {
  reason: FinishReason;
  /** Winning seat indices (partners share a win in 2v2). */
  winners: number[];
  /** Winning team number. */
  winnerTeam: number;
  /** Points awarded to the winning team this hand. */
  pointsAwarded: number;
  /** Pip totals remaining per seat. */
  pipTotals: number[];
  /**
   * When set, the next hand is opened by this team instead of winnerTeam
   * (wash / gambler flip the lead after a tied block).
   */
  nextOpenerTeam?: number;
};

export type LogLevel = "info" | "play" | "bot" | "warn" | "win";

export type GameLogEntry = {
  id: string;
  at: number;
  level: LogLevel;
  message: string;
  detail?: string;
};

export type GameSnapshot = {
  phase: GamePhase;
  setId: DominoSetId;
  modeId: PlayModeId;
  /** Blocked-hand pip-tie rule for this match. */
  drawRule: DrawRuleId;
  maxPip: number;
  /** When false (double-nine), stuck players pass — no boneyard draws. */
  allowDraw: boolean;
  seats: Seat[];
  boneyard: Tile[];
  chain: PlacedTile[];
  /** First tile played this hand — stays centered on the table. */
  openingTileId: string | null;
  /** Seat that last passed; cleared on the next play or pass. */
  lastPasserIndex: number | null;
  /**
   * Public table memory: suits each seat has shown they cannot play
   * (open ends when they passed). Fair for everyone — not hidden-hand peeking.
   * Cleared for a seat when they draw (pickup is unknown).
   * Reset every hand.
   */
  suitVoids: number[][];
  /**
   * Suits each team currently treats as “probably good for us” (open-end control).
   * Seeded from the opening tile’s faces; updated as passes/plays revise the picture.
   * Reset every hand — no carry across hands.
   */
  favoredSuitsByTeam: Record<number, number[]>;
  turn: number;
  passesInRow: number;
  result: GameResult | null;
  logs: GameLogEntry[];
  /** Seat that opens (had highest double / tile on hand 1, or prior winners). */
  starter: number;
  /**
   * 2v2: your team won the open — human picks You vs Partner before play.
   * Cleared by `chooseHandOpener`.
   */
  awaitingOpenerChoice: boolean;
  /** Hand number within the current game (1-based). */
  handIndex: number;
};

/** One finished hand in the current (or archived) game scorepad. */
export type HandRecord = {
  handIndex: number;
  reason: FinishReason;
  winnerTeam: number;
  winners: number[];
  pointsAwarded: number;
  pipTotals: number[];
  /** Running team totals within this game after this hand. */
  teamTotals: Record<number, number>;
};

/** One finished game (race to maxPoints), like annotator completedGames. */
export type CompletedPlayGame = {
  gameIndex: number;
  winnerTeam: number;
  hands: HandRecord[];
  finalScores: Record<number, number>;
};

/**
 * Match = many games. Each game races to maxPoints; standing is games won.
 * Same shape as the live annotator (standing + current pad + past games).
 */
export type MatchSnapshot = {
  modeId: PlayModeId;
  setId: DominoSetId;
  maxPoints: number;
  /** Blocked-hand pip-tie rule for the whole match. */
  drawRule: DrawRuleId;
  /** Games won by team (match standing). */
  gamesWon: Record<number, number>;
  /** Finished games, oldest → newest. */
  completedGames: CompletedPlayGame[];
  /** Current game number (1-based). */
  gameIndex: number;
  /** Points in the current game by team. */
  teamScores: Record<number, number>;
  /** Hands in the current game. */
  hands: HandRecord[];
  current: GameSnapshot | null;
  /** Current game finished (someone reached maxPoints). */
  gameOver: boolean;
  /** Winning team(s) of the current finished game. */
  gameWinnerTeams: number[];
};
