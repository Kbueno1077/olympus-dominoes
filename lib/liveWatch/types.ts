/** Live match watch sessions — ephemeral, phone-published, browser-viewed. */

export const LIVE_WATCH_MAX_SHARES = 50;
export const LIVE_WATCH_VIEWER_WARN = 10;
export const LIVE_WATCH_VIEWER_MAX = 20;
export const LIVE_WATCH_TTL_MS = 10 * 60 * 60 * 1000; // 10 hours
/** Drop a viewer after this with no sync. Must stay above the 3 min poll. */
export const LIVE_WATCH_VIEWER_STALE_MS = 8 * 60 * 1000;
/** Public /watch — one POST for score + presence, only while the tab is visible. */
export const LIVE_WATCH_POLL_MS = 3 * 60 * 1000;
/** Pause between automatic retries of a failed sync. */
export const LIVE_WATCH_RETRY_MS = 1500;
/** Stop Redis traffic after this many failed syncs in a row. */
export const LIVE_WATCH_FAIL_LIMIT = 3;
/** Tools monitor list — Redis reads. Manual Refresh still fetches immediately. */
export const LIVE_WATCH_ADMIN_POLL_MS = 5 * 60 * 1000;

export type LiveWatchTeam = {
  teamNumber: number;
  label: string;
  names: string[];
  wins: number;
  points: number;
};

/** Seat for stats / style points (playerId may be roster or synthetic). */
export type LiveWatchSeat = {
  seat: number;
  displayName: string;
  playerId: number | null;
};

/** Full scorepad game — same shape as phone `Game` + optional per-game seats. */
export type LiveWatchGame = {
  t1Datas: number[];
  t1TotalPoints: number;
  t1Taken: number[];
  t2Datas: number[];
  t2TotalPoints: number;
  t2Taken: number[];
  t3Datas: number[];
  t3TotalPoints: number;
  t3Taken: number[];
  t4Datas: number[];
  t4TotalPoints: number;
  t4Taken: number[];
  winner: string;
  seats: LiveWatchSeat[];
};

export type LiveWatchSnapshot = {
  matchId: string;
  title?: string;
  modeLabel: string;
  tileSet: string;
  maxPoints: number;
  playersAmount: number;
  isClosed: boolean;
  gameIndex: number; // 1-based display
  /** Count of finished games (kept for compact admin lines). */
  completedGames: number;
  teams: LiveWatchTeam[];
  currentSeats: string[];
  overallLine: string;
  currentLine: string;
  updatedAt: number;
  /** Match-level seats (closed table) or latest roster. */
  seats: LiveWatchSeat[];
  /** Finished games with full hand arrays. */
  games: LiveWatchGame[];
  /** In-progress game (may have empty / "none" winner). */
  currentGame: LiveWatchGame;
};

export type LiveWatchViewer = {
  id: string;
  displayName: string;
  /** 1-based order this person first entered the share. Never reused. */
  joinOrder: number;
  joinedAt: number;
  lastSeenAt: number;
};

/** Public rail — no last-seen timestamps. */
export type LiveWatchPublicViewer = {
  id: string;
  displayName: string;
  joinOrder: number;
};

export type LiveWatchSession = {
  id: string;
  secret: string;
  matchId: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  /** Last joinOrder handed out (0 before anyone joins). */
  joinSeq: number;
  snapshot: LiveWatchSnapshot;
  viewers: LiveWatchViewer[];
};

export type LiveWatchPublicStatus =
  | "live"
  | "ended"
  | "full"
  | "not_found"
  | "expired";
