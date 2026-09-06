/** One-shot handoff from Leaderboard (or elsewhere) into Stats. */

export type StatsLaunch = {
  modeLabel: string;
  playerId: number;
  tileSet?: "55" | "28";
};

/** Survives React Strict Mode remounts until Stats consumes it. */
let stickyStatsLaunch: StatsLaunch | null = null;

export function stashStatsLaunch(launch: StatsLaunch | null) {
  stickyStatsLaunch = launch;
}

export function peekStatsLaunch(): StatsLaunch | null {
  return stickyStatsLaunch;
}

export function clearStatsLaunch() {
  stickyStatsLaunch = null;
}
