import { stripTrailingPadHands } from "@/lib/analytics/hands";
import type { MatchDetail, HistoryGame, HistorySeat } from "@/lib/analytics/history";
import type {
  LiveWatchGame,
  LiveWatchSeat,
  LiveWatchSnapshot,
} from "@/lib/liveWatch/types";

function toHistorySeat(seat: LiveWatchSeat): HistorySeat {
  return {
    seat: seat.seat,
    displayName: seat.displayName,
    playerId: seat.playerId,
  };
}

function toHistoryGame(
  game: LiveWatchGame,
  fallbackSeats: HistorySeat[]
): HistoryGame {
  const seats =
    game.seats?.length > 0
      ? game.seats.map(toHistorySeat)
      : fallbackSeats;
  return {
    t1Datas: game.t1Datas ?? [],
    t1TotalPoints: game.t1TotalPoints ?? 0,
    t1Taken: game.t1Taken ?? [],
    t2Datas: game.t2Datas ?? [],
    t2TotalPoints: game.t2TotalPoints ?? 0,
    t2Taken: game.t2Taken ?? [],
    t3Datas: game.t3Datas ?? [],
    t3TotalPoints: game.t3TotalPoints ?? 0,
    t3Taken: game.t3Taken ?? [],
    t4Datas: game.t4Datas ?? [],
    t4TotalPoints: game.t4TotalPoints ?? 0,
    t4Taken: game.t4Taken ?? [],
    winner: game.winner && game.winner !== "none" ? game.winner : "",
    seats,
  };
}

function liveGameHasPlay(game: LiveWatchGame): boolean {
  if (
    stripTrailingPadHands(game.t1Datas ?? []).length > 0 ||
    stripTrailingPadHands(game.t2Datas ?? []).length > 0 ||
    stripTrailingPadHands(game.t3Datas ?? []).length > 0 ||
    stripTrailingPadHands(game.t4Datas ?? []).length > 0
  ) {
    return true;
  }
  return (
    (game.t1TotalPoints ?? 0) > 0 ||
    (game.t2TotalPoints ?? 0) > 0 ||
    (game.t3TotalPoints ?? 0) > 0 ||
    (game.t4TotalPoints ?? 0) > 0
  );
}

function historyPadKey(game: HistoryGame): string {
  return JSON.stringify([
    stripTrailingPadHands(game.t1Datas),
    stripTrailingPadHands(game.t2Datas),
    stripTrailingPadHands(game.t3Datas),
    stripTrailingPadHands(game.t4Datas),
    game.t1TotalPoints,
    game.t2TotalPoints,
    game.t3TotalPoints,
    game.t4TotalPoints,
    game.winner,
  ]);
}

function seatsFromSnapshot(snapshot: LiveWatchSnapshot): HistorySeat[] {
  const fromMatch = (snapshot.seats ?? []).map(toHistorySeat);
  if (fromMatch.some((seat) => seat.seat >= 1)) return fromMatch;

  const fromCurrent = (snapshot.currentGame?.seats ?? []).map(toHistorySeat);
  if (fromCurrent.length > 0) return fromCurrent;

  const finished = snapshot.games ?? [];
  const fromLast = finished[finished.length - 1]?.seats ?? [];
  if (fromLast.length > 0) return fromLast.map(toHistorySeat);

  return (snapshot.currentSeats ?? []).map((name, i) => ({
    seat: i + 1,
    displayName: name,
    playerId: null,
  }));
}

/**
 * Finished games plus the in-progress pad once a hand (or points) exists.
 * Skip a blank current game and skip it when it is already the last finished.
 */
export function gamesFromLiveSnapshot(
  snapshot: LiveWatchSnapshot
): HistoryGame[] {
  const seats = seatsFromSnapshot(snapshot);
  const finished = (snapshot.games ?? []).map((game) =>
    toHistoryGame(game, seats)
  );
  const current = snapshot.currentGame;
  if (!current || !liveGameHasPlay(current)) return finished;

  const live = toHistoryGame(current, seats);
  const last = finished[finished.length - 1];
  if (last && historyPadKey(last) === historyPadKey(live)) return finished;
  return [...finished, live];
}

/** Stable numeric id for MatchDetail from the string match id. */
function detailIdFromMatchId(matchId: string): number {
  let h = 0;
  for (let i = 0; i < matchId.length; i++) {
    h = (h * 31 + matchId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

/**
 * Build a history-shaped detail from a live snapshot so session stats and
 * style points can recompute in the browser on every poll — including the
 * current game as hands are entered, not only after it ends.
 */
export function matchDetailFromLiveSnapshot(
  snapshot: LiveWatchSnapshot
): MatchDetail | null {
  if (!snapshot.games && !snapshot.currentGame) return null;

  const seats = seatsFromSnapshot(snapshot);
  const games = gamesFromLiveSnapshot(snapshot);

  return {
    id: detailIdFromMatchId(snapshot.matchId),
    title: snapshot.title ?? snapshot.overallLine ?? "Live match",
    endedAt: new Date(snapshot.updatedAt).toISOString(),
    playersAmount: snapshot.playersAmount,
    modeLabel: snapshot.modeLabel,
    tileSet: snapshot.tileSet === "28" ? "28" : "55",
    maxPoints: snapshot.maxPoints,
    isClosed: snapshot.isClosed,
    seats,
    games,
  };
}

export function hasFullPadPayload(snapshot: LiveWatchSnapshot): boolean {
  return Array.isArray(snapshot.games) && snapshot.currentGame != null;
}
