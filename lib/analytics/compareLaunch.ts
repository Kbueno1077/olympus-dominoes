import { FREE_FOR_ALL, normalizeNameKey, teamsFromRoster } from "@/utils/teams";
import type { CompareLaunch } from "./datasets";
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
 */
export function buildLiveMatchCompareLaunch(input: {
  data: OlympusExportData;
  playersAmount: number;
  modeLabel: string;
  players: readonly string[];
}): CompareLaunch | null {
  const byKey = new Map(
    input.data.players.map((p) => [p.name_key || normalizeNameKey(p.name), p])
  );
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
      const key = normalizeNameKey(member.name);
      if (!key) continue;
      const player = byKey.get(key);
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
