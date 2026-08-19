import { FREE_FOR_ALL, normalizeNameKey, teamsFromRoster } from "@/utils/teams";
import type { CompareLaunch } from "./datasets";
import { findMatchingPlayer } from "./playerIdentity";
import type { OlympusExportData } from "./types";

const MAX_COMPARE = 10;

/** Survives React Strict Mode remounts until Compare is dismissed. */
let stickyCompareLaunch: CompareLaunch | null = null;

export function stashCompareLaunch(launch: CompareLaunch | null) {
  stickyCompareLaunch = launch;
}

export function peekCompareLaunch(): CompareLaunch | null {
  return stickyCompareLaunch;
}

export function clearCompareLaunch() {
  stickyCompareLaunch = null;
}

/**
 * Prefill Compare from the live match roster against players in the active save.
 * Partner modes get Team A/B from scorepad sides; FFA only selects players.
 * Optional seat public_ids prefer public_id match over name (cross-DB identity).
 */
export function buildLiveMatchCompareLaunch(input: {
  data: OlympusExportData;
  playersAmount: number;
  modeLabel: string;
  players: readonly string[];
  /** Parallel to `players` when known — prefers public_id over name. */
  playerPublicIds?: readonly (string | null | undefined)[];
}): CompareLaunch | null {
  const scored = teamsFromRoster(
    input.playersAmount,
    input.modeLabel,
    input.players
  );

  const playerIds: number[] = [];
  const teams: Record<number, 1 | 2 | null> = {};
  const isFfa = input.modeLabel === FREE_FOR_ALL;

  for (const team of scored) {
    const side: 1 | 2 = team.number === 1 ? 1 : 2;
    for (const member of team.members) {
      const seatIndex = member.number - 1;
      const publicId = input.playerPublicIds?.[seatIndex] ?? null;
      const player = findMatchingPlayer(input.data.players, {
        publicId,
        name: member.name,
        nameKey: normalizeNameKey(member.name),
      });
      if (!player) continue;
      if (playerIds.includes(player.id)) continue;
      if (playerIds.length >= MAX_COMPARE) break;
      playerIds.push(player.id);
      if (!isFfa) {
        teams[player.id] = side;
      }
    }
  }

  if (playerIds.length === 0) return null;

  const matchupMode =
    !isFfa &&
    playerIds.length >= 2 &&
    playerIds.some((id) => teams[id] === 1) &&
    playerIds.some((id) => teams[id] === 2);

  return {
    modeLabel: input.modeLabel,
    playerIds,
    teams: matchupMode ? teams : {},
    matchupMode,
  };
}

/** Prefill Compare with two players (e.g. from H2H). */
export function buildH2HCompareLaunch(input: {
  modeLabel: string;
  playerId: number;
  opponentId: number;
}): CompareLaunch {
  return {
    modeLabel: input.modeLabel,
    playerIds: [input.playerId, input.opponentId],
    teams: {},
    matchupMode: false,
  };
}

/**
 * Prefill Compare from an imported history match seating.
 * Partner modes get Team A/B from scorepad sides when both sides are linked.
 */
export function buildHistoryMatchCompareLaunch(input: {
  modeLabel: string;
  tileSet?: "55" | "28";
  playersAmount: number;
  seats: readonly {
    seat: number;
    displayName: string;
    playerId: number | null;
  }[];
}): CompareLaunch | null {
  const rosterNames = ["", "", "", ""];
  for (const seat of input.seats) {
    if (seat.seat >= 1 && seat.seat <= 4) {
      rosterNames[seat.seat - 1] = seat.displayName;
    }
  }

  const bySeatId = new Map(
    input.seats
      .filter((s) => s.playerId != null)
      .map((s) => [s.seat, s.playerId as number])
  );

  const scored = teamsFromRoster(
    input.playersAmount,
    input.modeLabel,
    rosterNames
  );

  const playerIds: number[] = [];
  const teams: Record<number, 1 | 2 | null> = {};
  const isFfa = input.modeLabel === FREE_FOR_ALL;

  for (const team of scored) {
    const side: 1 | 2 = team.number === 1 ? 1 : 2;
    for (const member of team.members) {
      const playerId = bySeatId.get(member.number);
      if (playerId == null) continue;
      if (playerIds.includes(playerId)) continue;
      if (playerIds.length >= MAX_COMPARE) break;
      playerIds.push(playerId);
      if (!isFfa) {
        teams[playerId] = side;
      }
    }
  }

  if (playerIds.length === 0) return null;

  const matchupMode =
    !isFfa &&
    playerIds.length >= 2 &&
    playerIds.some((id) => teams[id] === 1) &&
    playerIds.some((id) => teams[id] === 2);

  return {
    modeLabel: input.modeLabel,
    tileSet: input.tileSet,
    playerIds,
    teams: matchupMode ? teams : {},
    matchupMode,
  };
}
