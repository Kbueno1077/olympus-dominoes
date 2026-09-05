import type { OlympusExportData, PlayerRow } from "./types";

export function isPlayerHidden(
  player: { is_hidden?: number | null } | null | undefined
): boolean {
  return (player?.is_hidden ?? 0) === 1;
}

export function listVisiblePlayers(
  players: readonly PlayerRow[]
): PlayerRow[] {
  return players.filter((player) => !isPlayerHidden(player));
}

export function listHiddenPlayers(players: readonly PlayerRow[]): PlayerRow[] {
  return players.filter((player) => isPlayerHidden(player));
}

export function hiddenPlayerIds(data: OlympusExportData): Set<number> {
  return new Set(
    data.players.filter((player) => isPlayerHidden(player)).map((p) => p.id)
  );
}

/** Sum of `games_played` across modes/tile sets for one roster id. */
export function gamesPlayedForPlayer(
  data: OlympusExportData,
  playerId: number
): number {
  let total = 0;
  for (const row of data.player_stats) {
    if (row.player_id === playerId) total += row.games_played;
  }
  return total;
}

function setHiddenFlag(
  data: OlympusExportData,
  playerIds: ReadonlySet<number>,
  hidden: boolean
): OlympusExportData {
  const flag = hidden ? 1 : 0;
  const players = data.players.map((player) =>
    playerIds.has(player.id) ? { ...player, is_hidden: flag } : player
  );
  const rawPlayers = (data.tables.players ?? []).map((row) => {
    const id = typeof row.id === "number" ? row.id : Number(row.id);
    if (!playerIds.has(id)) return row;
    return { ...row, is_hidden: flag };
  });
  return {
    ...data,
    players,
    tables: {
      ...data.tables,
      players: rawPlayers.length > 0 ? rawPlayers : data.tables.players,
    },
  };
}

/** Hide or restore roster rows. Leaves stats, H2H, and seats as they are. */
export function setPlayersHidden(
  data: OlympusExportData,
  playerIds: readonly number[],
  hidden: boolean
): OlympusExportData {
  const ids = new Set(playerIds.filter((id) => id > 0));
  if (ids.size === 0) return data;
  return setHiddenFlag(data, ids, hidden);
}

export function hidePlayer(
  data: OlympusExportData,
  playerId: number
): OlympusExportData {
  return setPlayersHidden(data, [playerId], true);
}

/**
 * Un-hide a roster row. Leaves `public_id`, stats, H2H, and seats as they are.
 */
export function restoreHiddenPlayer(
  data: OlympusExportData,
  playerId: number
): OlympusExportData {
  return setPlayersHidden(data, [playerId], false);
}
