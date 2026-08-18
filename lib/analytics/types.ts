import type { DbMetaRow } from "./dbMeta";

export const EXPORT_TABLES = [
  "db_meta",
  "players",
  "app_settings",
  "matches",
  "match_players",
  "games",
  "game_players",
  "game_team_scores",
  "player_stats",
  "player_h2h",
] as const;

export type ExportTable = (typeof EXPORT_TABLES)[number];

export type { DbMetaOrigin, DbMetaRow } from "./dbMeta";

export type PlayerRow = {
  id: number;
  /** Stable 16-char alphanumeric identity across DBs / exports. Survives renames. */
  public_id: string;
  name: string;
  name_key: string;
  created_at?: string | null;
  is_myself?: number | null;
};

export type PlayerStatsRow = {
  player_id: number;
  mode_label: string;
  tile_set: "55" | "28";
  games_played: number;
  games_won: number;
  games_lost: number;
  points_for: number;
  points_against: number;
  hands_for: number;
  hands_against: number;
  /** Datas scored — same as hands_for. */
  hands_won: number;
  /** Datas conceded — same as hands_against. */
  hands_lost: number;
  /** All datas played: hands_won + hands_lost. */
  hands_played: number;
  pollos_for: number;
  pollos_against: number;
  zapatos_for: number;
  zapatos_against: number;
  joses_coefficient: number | null;
};

export type PlayerH2HRow = {
  player_id: number;
  opponent_id: number;
  mode_label: string;
  tile_set: "55" | "28";
  wins: number;
  losses: number;
};

export type OlympusExportData = {
  source: "csv";
  fileName: string;
  importedAt: string;
  /** Exactly one row describing this league / dataset file (schema v18). */
  db_meta?: DbMetaRow;
  players: PlayerRow[];
  player_stats: PlayerStatsRow[];
  player_h2h: PlayerH2HRow[];
  /** Raw match rows (include stable `public_id` when present). */
  matches: Record<string, unknown>[];
  /** Raw tables kept for future use; analytics primarily uses the three above. */
  tables: Partial<Record<ExportTable, Record<string, unknown>[]>>;
};

export type PlayerStatsView = {
  playerId: number;
  modeLabel: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  pointsFor: number;
  pointsAgainst: number;
  handsFor: number;
  handsAgainst: number;
  /** Datas scored — same as handsFor. */
  handsWon: number;
  /** Datas conceded — same as handsAgainst. */
  handsLost: number;
  /** All datas played: handsWon + handsLost. */
  handsPlayed: number;
  pollosFor: number;
  pollosAgainst: number;
  zapatosFor: number;
  zapatosAgainst: number;
  josesCoefficient: number | null;
};

export type LeaderboardRow = PlayerStatsView & {
  playerName: string;
  isMyself: boolean;
};

export type H2HView = {
  opponentId: number;
  opponentName: string;
  modeLabel: string;
  wins: number;
  losses: number;
  winPct: number | null;
};
