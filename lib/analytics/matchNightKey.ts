import { endedAtToLocalYmd } from "./dateRangeFilter";
import { isValidPlayerPublicId } from "./playerPublicId";
import type { OlympusExportData, PlayerRow } from "./types";

export type NightMatch = {
  matchId: number;
  endedAt: string;
  day: string;
  title: string;
  fingerprint: string;
  playerNames: string[];
  playerIds: number[];
};

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = asNumber(value, Number.NaN);
  return Number.isFinite(n) ? n : null;
}

function playersById(data: OlympusExportData): Map<number, PlayerRow> {
  return new Map(data.players.map((player) => [player.id, player]));
}

function gameContentDigest(data: OlympusExportData, matchId: number): string {
  const gameRows = (data.tables.games ?? [])
    .filter((row) => asNumber(row.match_id) === matchId)
    .slice()
    .sort((a, b) => asNumber(a.game_index) - asNumber(b.game_index));

  const scores = data.tables.game_team_scores ?? [];
  const scoresByGame = new Map<number, string[]>();
  for (const row of scores) {
    const gameId = asNumber(row.game_id);
    const list = scoresByGame.get(gameId) ?? [];
    list.push(
      [
        asNumber(row.team_number),
        asNumber(row.total_points),
        asString(row.hands_json, "[]"),
        asString(row.hands_taken_json, "[]"),
      ].join(":")
    );
    scoresByGame.set(gameId, list);
  }

  return gameRows
    .map((row) => {
      const id = asNumber(row.id);
      const teamBits = (scoresByGame.get(id) ?? []).slice().sort().join(",");
      return `${asNumber(row.game_index)}|${asString(row.winner_team)}|${teamBits}`;
    })
    .join(";");
}

function seatRows(
  data: OlympusExportData,
  matchId: number,
  playersAmount: number
): Record<string, unknown>[] {
  const seats = (data.tables.match_players ?? [])
    .filter((row) => asNumber(row.match_id) === matchId)
    .slice()
    .sort((a, b) => asNumber(a.seat) - asNumber(b.seat));

  let active = seats.filter(
    (row) => asNumber(row.seat) >= 1 && asNumber(row.seat) <= playersAmount
  );

  if (active.length > 0) return active;

  const gameIds = new Set(
    (data.tables.games ?? [])
      .filter((row) => asNumber(row.match_id) === matchId)
      .map((row) => asNumber(row.id))
  );
  const seen = new Set<string>();
  const openSeats: Record<string, unknown>[] = [];
  for (const row of data.tables.game_players ?? []) {
    if (!gameIds.has(asNumber(row.game_id))) continue;
    const key = asString(row.display_name).trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    openSeats.push(row);
  }
  return openSeats;
}

function seatKey(
  row: Record<string, unknown>,
  byId: Map<number, PlayerRow>
): string {
  const pid = asNullableNumber(row.player_id);
  if (pid != null) {
    const player = byId.get(pid);
    if (player && isValidPlayerPublicId(player.public_id)) {
      return player.public_id;
    }
    if (player) return `name:${player.name_key || player.name.toLowerCase()}`;
    return `local:${pid}`;
  }
  const name = asString(row.display_name).trim().toLowerCase();
  return name ? `name:${name}` : "unknown";
}

/** Same local day + same seats + same score digest. */
export function describeNightMatch(
  data: OlympusExportData,
  matchRow: Record<string, unknown>
): NightMatch | null {
  const matchId = asNumber(matchRow.id);
  if (!matchId) return null;

  const playersAmount = asNumber(matchRow.players_amount);
  const endedAt = asString(matchRow.ended_at);
  const day = endedAtToLocalYmd(endedAt) ?? "unknown-date";
  const byId = playersById(data);
  const seats = seatRows(data, matchId, playersAmount);
  const playerIds: number[] = [];
  const playerNames: string[] = [];
  const keys: string[] = [];

  for (const row of seats) {
    keys.push(seatKey(row, byId));
    const pid = asNullableNumber(row.player_id);
    if (pid != null) playerIds.push(pid);
    const name =
      asString(row.display_name).trim() ||
      (pid != null ? byId.get(pid)?.name : "") ||
      "";
    if (name) playerNames.push(name);
  }

  const fingerprint = [
    day,
    keys.slice().sort().join(","),
    gameContentDigest(data, matchId),
  ].join("|");

  return {
    matchId,
    endedAt,
    day,
    title: asString(matchRow.title),
    fingerprint,
    playerNames,
    playerIds,
  };
}

export function listNightMatches(data: OlympusExportData): NightMatch[] {
  const rows = data.tables.matches ?? data.matches ?? [];
  const out: NightMatch[] = [];
  for (const row of rows) {
    const described = describeNightMatch(data, row);
    if (described) out.push(described);
  }
  return out;
}

export function asMatchId(value: unknown): number {
  return asNumber(value);
}
