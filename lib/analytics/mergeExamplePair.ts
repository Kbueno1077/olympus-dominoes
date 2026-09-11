/**
 * Two tiny Thursday tables for trying merge conflicts.
 * Casa Vieja = Current. Malecón = Incoming (same people, another phone).
 *
 * Conflicts on purpose:
 * - Luis vs Luisito (same public_id, different name)
 * - two Marias (same name, different public_id)
 * - 14 May: same time + roster, different scores
 *
 * Also: 9 Apr is an identical night (auto-dedupe), plus one unique night each.
 */

import { seedDbMetaRow } from "./dbMeta";
import { serializeOlympusExport } from "./serializeExport";
import type { OlympusExportData, PlayerRow } from "./types";

export const MERGE_EXAMPLE_CASA_NAME = "Casa Vieja";
export const MERGE_EXAMPLE_MALECON_NAME = "Malecón";

const ANA = "AnaPublicId00001";
const PEDRO = "PedroPublicId001";
const LUIS = "LuisPublicId0001";
const TOMAS = "TomasPublicId001";
const MARIA_CASA = "MariaCasaId00001";
const MARIA_MALECON = "MariaMalecon0001";
const ROSA = "RosaPublicId0001";
const CESAR = "CesarPublicId001";

const NIGHT_DUP = "2026-04-09T23:40:00.000Z";
const NIGHT_CONFLICT = "2026-05-14T23:10:00.000Z";
const NIGHT_CASA = "2026-03-20T23:15:00.000Z";
const NIGHT_MALECON = "2026-06-11T23:20:00.000Z";

function player(
  id: number,
  name: string,
  publicId: string,
  createdAt: string
): PlayerRow {
  return {
    id,
    name,
    name_key: name.toLowerCase(),
    public_id: publicId,
    created_at: createdAt,
    is_myself: 0,
    is_hidden: 0,
  };
}

function closedNight(options: {
  matchId: number;
  publicId: string;
  endedAt: string;
  title: string;
  seats: { playerId: number; name: string }[];
  gameId: number;
  team1: number;
  team2: number;
  winnerTeam: "Team 1" | "Team 2";
}) {
  const match = {
    id: options.matchId,
    title: options.title,
    ended_at: options.endedAt,
    players_amount: 4,
    mode_label: "2 vs 2",
    tile_set: "55",
    max_points: 150,
    is_closed: 1,
    public_id: options.publicId,
  };
  const matchPlayers = options.seats.map((seat, index) => ({
    id: options.matchId * 10 + index + 1,
    match_id: options.matchId,
    seat: index + 1,
    display_name: seat.name,
    player_id: seat.playerId,
  }));
  const game = {
    id: options.gameId,
    match_id: options.matchId,
    game_index: 1,
    winner_team: options.winnerTeam,
  };
  const scores = [
    {
      id: options.gameId * 2 - 1,
      game_id: options.gameId,
      team_number: 1,
      total_points: options.team1,
      hands_json: `[${options.team1}]`,
      hands_taken_json: "[]",
      hand_count: 1,
    },
    {
      id: options.gameId * 2,
      game_id: options.gameId,
      team_number: 2,
      total_points: options.team2,
      hands_json: `[${options.team2}]`,
      hands_taken_json: "[]",
      hand_count: 1,
    },
  ];
  return { match, matchPlayers, game, scores };
}

function pack(
  fileName: string,
  label: string,
  dbIdentifier: string,
  createdAt: string,
  players: PlayerRow[],
  nights: ReturnType<typeof closedNight>[]
): OlympusExportData {
  return {
    source: "csv",
    fileName,
    importedAt: createdAt,
    db_meta: seedDbMetaRow({
      dbIdentifier,
      createdAt,
      updatedAt: createdAt,
      label,
      origin: "imported",
    }),
    players,
    player_stats: [],
    player_h2h: [],
    matches: nights.map((night) => night.match),
    tables: {
      matches: nights.map((night) => night.match),
      match_players: nights.flatMap((night) => night.matchPlayers),
      games: nights.map((night) => night.game),
      game_team_scores: nights.flatMap((night) => night.scores),
    },
  };
}

export function casaViejaData(): OlympusExportData {
  const createdAt = "2026-04-10T12:00:00.000Z";
  const ana = { playerId: 1, name: "Ana" };
  const pedro = { playerId: 2, name: "Pedro" };
  const luis = { playerId: 3, name: "Luis" };
  const tomas = { playerId: 4, name: "Tomas" };
  const rosa = { playerId: 5, name: "Rosa" };
  const maria = { playerId: 6, name: "Maria" };

  return pack(
    "casa-vieja.csv",
    MERGE_EXAMPLE_CASA_NAME,
    "CasaViejaDb00001",
    createdAt,
    [
      player(1, "Ana", ANA, createdAt),
      player(2, "Pedro", PEDRO, createdAt),
      player(3, "Luis", LUIS, createdAt),
      player(4, "Tomas", TOMAS, createdAt),
      player(5, "Rosa", ROSA, createdAt),
      player(6, "Maria", MARIA_CASA, createdAt),
    ],
    [
      closedNight({
        matchId: 1,
        publicId: "NightMar20Casa01",
        endedAt: NIGHT_CASA,
        title: "March Thursday",
        seats: [ana, pedro, rosa, maria],
        gameId: 10,
        team1: 150,
        team2: 70,
        winnerTeam: "Team 1",
      }),
      closedNight({
        matchId: 2,
        publicId: "NightApr09Shared1",
        endedAt: NIGHT_DUP,
        title: "April Thursday",
        seats: [ana, pedro, luis, tomas],
        gameId: 11,
        team1: 150,
        team2: 95,
        winnerTeam: "Team 1",
      }),
      closedNight({
        matchId: 3,
        publicId: "NightMay14Casa01",
        endedAt: NIGHT_CONFLICT,
        title: "May Thursday",
        seats: [ana, pedro, luis, tomas],
        gameId: 12,
        team1: 150,
        team2: 80,
        winnerTeam: "Team 1",
      }),
    ]
  );
}

export function maleconData(): OlympusExportData {
  const createdAt = "2026-06-12T12:00:00.000Z";
  const ana = { playerId: 1, name: "Ana" };
  const pedro = { playerId: 2, name: "Pedro" };
  const luis = { playerId: 3, name: "Luisito" };
  const tomas = { playerId: 4, name: "Tomas" };
  const cesar = { playerId: 5, name: "Cesar" };
  const maria = { playerId: 6, name: "Maria" };

  return pack(
    "malecon.csv",
    MERGE_EXAMPLE_MALECON_NAME,
    "MaleconTable0001",
    createdAt,
    [
      player(1, "Ana", ANA, createdAt),
      player(2, "Pedro", PEDRO, createdAt),
      player(3, "Luisito", LUIS, createdAt),
      player(4, "Tomas", TOMAS, createdAt),
      player(5, "Cesar", CESAR, createdAt),
      player(6, "Maria", MARIA_MALECON, createdAt),
    ],
    [
      closedNight({
        matchId: 1,
        publicId: "NightApr09Shared1",
        endedAt: NIGHT_DUP,
        title: "April Thursday",
        seats: [ana, pedro, luis, tomas],
        gameId: 10,
        team1: 150,
        team2: 95,
        winnerTeam: "Team 1",
      }),
      closedNight({
        matchId: 2,
        publicId: "NightMay14Male01",
        endedAt: NIGHT_CONFLICT,
        title: "May Thursday",
        seats: [ana, pedro, luis, tomas],
        gameId: 11,
        team1: 90,
        team2: 150,
        winnerTeam: "Team 2",
      }),
      closedNight({
        matchId: 3,
        publicId: "NightJun11Male01",
        endedAt: NIGHT_MALECON,
        title: "June Thursday",
        seats: [ana, pedro, cesar, maria],
        gameId: 12,
        team1: 150,
        team2: 110,
        winnerTeam: "Team 1",
      }),
    ]
  );
}

export function casaViejaCsv(): string {
  return serializeOlympusExport(casaViejaData(), {
    label: MERGE_EXAMPLE_CASA_NAME,
  });
}

export function maleconCsv(): string {
  return serializeOlympusExport(maleconData(), {
    label: MERGE_EXAMPLE_MALECON_NAME,
  });
}
