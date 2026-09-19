import type { LeaderboardRow } from "@/lib/analytics/types";
import { DEFAULT_CSV_PINS, type LabPlayer } from "@/lib/joseLab/data";

export const LIVE_PLAYER_ID_PREFIX = "db-";

const PREFERRED_PIN_NAMES = new Set(
  DEFAULT_CSV_PINS.map((id) => id.toLowerCase())
);

export function labPlayerIdFromStats(playerId: number): string {
  return `${LIVE_PLAYER_ID_PREFIX}${playerId}`;
}

export function labPlayersFromLeaderboard(rows: LeaderboardRow[]): LabPlayer[] {
  return rows.map((row) => ({
    id: labPlayerIdFromStats(row.playerId),
    name: row.playerName,
    W: row.gamesWon,
    L: row.gamesLost,
    G: row.gamesPlayed,
    dDW: row.handsWon - row.handsLost,
    dPF: row.pointsFor - row.pointsAgainst,
    dPo: row.pollosFor - row.pollosAgainst,
    dZap: row.zapatosFor - row.zapatosAgainst,
    pin: false,
    dataset: "live",
    kind: "csv",
    HF: row.handsWon,
    HA: row.handsLost,
    PF: row.pointsFor,
    PA: row.pointsAgainst,
    PoF: row.pollosFor,
    PoA: row.pollosAgainst,
    ZapF: row.zapatosFor,
    ZapA: row.zapatosAgainst,
  }));
}

/** Prefer the static Panteon pin names when they exist; otherwise the six busiest seasons. */
export function defaultLivePins(players: LabPlayer[]): string[] {
  const preferred = players.filter((player) =>
    PREFERRED_PIN_NAMES.has(player.name.trim().toLowerCase())
  );
  if (preferred.length > 0) {
    return preferred.map((player) => player.id);
  }
  return [...players]
    .sort((a, b) => b.G - a.G || a.name.localeCompare(b.name))
    .slice(0, DEFAULT_CSV_PINS.length)
    .map((player) => player.id);
}
