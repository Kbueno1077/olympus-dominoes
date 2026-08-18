import { normalizeNameKey } from "@/utils/teams";
import {
  isValidPlayerPublicId,
  resolveImportedPublicId,
} from "./playerPublicId";
import type { OlympusExportData, PlayerRow } from "./types";

/**
 * Assign / normalize public_id on every player in an import or stored blob.
 * First duplicate in a batch keeps the id; later rows get new ones.
 */
export function ensurePlayersHavePublicIds(
  players: readonly PlayerRow[]
): PlayerRow[] {
  const used = new Set<string>();
  return players.map((player) => ({
    ...player,
    public_id: resolveImportedPublicId(player.public_id, used),
  }));
}

/**
 * Backfill public_id on normalized players and mirror onto raw `tables.players`.
 * Returns the same reference when nothing changed.
 */
export function withEnsuredPlayerPublicIds(
  data: OlympusExportData
): OlympusExportData {
  const players = ensurePlayersHavePublicIds(data.players);
  const unchanged =
    players.length === data.players.length &&
    players.every((player, index) => {
      const prev = data.players[index];
      return (
        prev != null &&
        prev.id === player.id &&
        prev.public_id === player.public_id
      );
    });

  if (unchanged) {
    const raw = data.tables.players ?? [];
    const rawMissing = raw.some(
      (row) => !isValidPlayerPublicId(row.public_id)
    );
    if (!rawMissing && raw.length > 0) return data;
  }

  const byNumericId = new Map(players.map((player) => [player.id, player]));
  const rawPlayers = (data.tables.players ?? []).map((row) => {
    const id =
      typeof row.id === "number"
        ? row.id
        : Number(row.id);
    const matched = Number.isFinite(id) ? byNumericId.get(id) : undefined;
    if (!matched) return row;
    return { ...row, public_id: matched.public_id };
  });

  return {
    ...data,
    players,
    tables: {
      ...data.tables,
      players:
        rawPlayers.length > 0
          ? rawPlayers
          : players.map((player) => ({
              id: player.id,
              name: player.name,
              name_key: player.name_key,
              public_id: player.public_id,
              created_at: player.created_at ?? null,
              is_myself: player.is_myself ?? 0,
            })),
    },
  };
}

/**
 * Prefer a valid public_id when present; otherwise fall back to name_key / name.
 * public_id never changes on rename — only name / name_key do.
 */
export function findMatchingPlayer(
  players: readonly PlayerRow[],
  opts: {
    publicId?: string | null;
    name?: string | null;
    nameKey?: string | null;
  }
): PlayerRow | null {
  if (isValidPlayerPublicId(opts.publicId)) {
    const byPublic = players.find((player) => player.public_id === opts.publicId);
    if (byPublic) return byPublic;
  }

  const key =
    (opts.nameKey && opts.nameKey.trim()) ||
    (opts.name != null ? normalizeNameKey(opts.name) : "");
  if (!key) return null;

  return (
    players.find(
      (player) => (player.name_key || normalizeNameKey(player.name)) === key
    ) ?? null
  );
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function linkSeatRow(
  row: Record<string, unknown>,
  byNameKey: Map<string, number>
): Record<string, unknown> {
  if (asNullableNumber(row.player_id) != null) return row;
  const key = normalizeNameKey(String(row.display_name ?? ""));
  if (!key) return row;
  const playerId = byNameKey.get(key);
  if (playerId == null) return row;
  return { ...row, player_id: playerId };
}

/**
 * Fill null `player_id` on match_players and game_players from roster name_key.
 */
export function backfillSeatPlayerIds(
  data: OlympusExportData
): OlympusExportData {
  const byNameKey = new Map<string, number>();
  for (const player of data.players) {
    const key = player.name_key || normalizeNameKey(player.name);
    if (key) byNameKey.set(key, player.id);
  }

  const matchPlayers = (data.tables.match_players ?? []).map((row) =>
    linkSeatRow(row, byNameKey)
  );
  const gamePlayers = (data.tables.game_players ?? []).map((row) =>
    linkSeatRow(row, byNameKey)
  );

  return {
    ...data,
    tables: {
      ...data.tables,
      match_players: matchPlayers,
      game_players: gamePlayers,
    },
  };
}
