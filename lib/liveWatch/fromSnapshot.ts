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

function toHistoryGame(game: LiveWatchGame, fallbackSeats: HistorySeat[]): HistoryGame {
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
 * style points can recompute in the browser on every poll.
 */
export function matchDetailFromLiveSnapshot(
  snapshot: LiveWatchSnapshot
): MatchDetail | null {
  if (!snapshot.games && !snapshot.currentGame) return null;

  const seats = (snapshot.seats ?? []).map(toHistorySeat);
  const games = (snapshot.games ?? []).map((g) => toHistoryGame(g, seats));

  return {
    id: detailIdFromMatchId(snapshot.matchId),
    title: snapshot.title ?? snapshot.overallLine ?? "Live match",
    endedAt: new Date(snapshot.updatedAt).toISOString(),
    playersAmount: snapshot.playersAmount,
    modeLabel: snapshot.modeLabel,
    tileSet: snapshot.tileSet === "28" ? "28" : "55",
    maxPoints: snapshot.maxPoints,
    isClosed: snapshot.isClosed,
    seats:
      seats.length > 0
        ? seats
        : (snapshot.currentSeats ?? []).map((name, i) => ({
            seat: i + 1,
            displayName: name,
            playerId: null,
          })),
    games,
  };
}

export function hasFullPadPayload(snapshot: LiveWatchSnapshot): boolean {
  return Array.isArray(snapshot.games) && snapshot.currentGame != null;
}
