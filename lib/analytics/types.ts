export const EXPORT_TABLES = [
  "players",
  "app_settings",
  "matches",
  "match_players",
  "games",
  "game_team_scores",
  "player_stats",
  "player_h2h",
] as const;

export type ExportTable = (typeof EXPORT_TABLES)[number];

export type PlayerRow = {
  id: number;
  name: string;
  name_key: string;
  created_at?: string | null;
  is_myself?: number | null;
};

export type PlayerStatsRow = {
  player_id: number;
  mode_label: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  points_for: number;
  points_against: number;
  hands_for: number;
  hands_against: number;
  hands_won: number;
  hands_lost: number;
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
  wins: number;
  losses: number;
};

export type OlympusExportData = {
  source: "csv" | "sql";
  fileName: string;
  importedAt: string;
  players: PlayerRow[];
  player_stats: PlayerStatsRow[];
  player_h2h: PlayerH2HRow[];
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
  handsWon: number;
  handsLost: number;
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
