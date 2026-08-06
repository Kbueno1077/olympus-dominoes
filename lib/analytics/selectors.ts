import { computeJosesCoefficient } from "./joseCoefficient";
import type {
  H2HView,
  LeaderboardRow,
  OlympusExportData,
  PlayerStatsView,
} from "./types";

function toStatsView(
  row: OlympusExportData["player_stats"][number]
): PlayerStatsView {
  const handsFor = row.hands_for;
  const handsAgainst = row.hands_against;
  // Prefer scored/conceded identity; fall back to stored won/lost if needed.
  const handsWon = handsFor;
  const handsLost = handsAgainst;
  const handsPlayed =
    row.hands_played > 0 ? row.hands_played : handsWon + handsLost;

  return {
    playerId: row.player_id,
    modeLabel: row.mode_label,
    gamesPlayed: row.games_played,
    gamesWon: row.games_won,
    gamesLost: row.games_lost,
    pointsFor: row.points_for,
    pointsAgainst: row.points_against,
    handsFor,
    handsAgainst,
    handsWon,
    handsLost,
    handsPlayed,
    pollosFor: row.pollos_for,
    pollosAgainst: row.pollos_against,
    zapatosFor: row.zapatos_for,
    zapatosAgainst: row.zapatos_against,
    // Always recompute so UI matches the current formula (ignore stale CSV values).
    josesCoefficient: computeJosesCoefficient({
      gamesPlayed: row.games_played,
      gamesWon: row.games_won,
      gamesLost: row.games_lost,
      handsFor,
      handsAgainst,
      pointsFor: row.points_for,
      pointsAgainst: row.points_against,
      pollosFor: row.pollos_for,
      pollosAgainst: row.pollos_against,
      zapatosFor: row.zapatos_for,
      zapatosAgainst: row.zapatos_against,
    }),
  };
}

export function listStatModes(data: OlympusExportData): string[] {
  const modes = new Set<string>();
  for (const row of data.player_stats) {
    if (row.mode_label) modes.add(row.mode_label);
  }
  return Array.from(modes).sort((a, b) => a.localeCompare(b));
}

export function listLeaderboard(
  data: OlympusExportData,
  modeLabel: string
): LeaderboardRow[] {
  const playersById = new Map(data.players.map((p) => [p.id, p]));

  return data.player_stats
    .filter((row) => row.mode_label === modeLabel && row.games_played > 0)
    .map((row) => {
      const stats = toStatsView(row);
      const player = playersById.get(row.player_id);
      return {
        ...stats,
        playerName: player?.name ?? `#${row.player_id}`,
        isMyself: Boolean(player?.is_myself),
      };
    })
    .sort((a, b) => {
      const ac = a.josesCoefficient ?? Number.NEGATIVE_INFINITY;
      const bc = b.josesCoefficient ?? Number.NEGATIVE_INFINITY;
      if (bc !== ac) return bc - ac;
      return a.playerName.localeCompare(b.playerName);
    });
}

export function getPlayerStats(
  data: OlympusExportData,
  playerId: number
): PlayerStatsView[] {
  return data.player_stats
    .filter((row) => row.player_id === playerId)
    .map(toStatsView);
}

export function getPlayerH2H(
  data: OlympusExportData,
  playerId: number,
  modeLabel: string
): H2HView[] {
  const playersById = new Map(data.players.map((p) => [p.id, p]));

  return data.player_h2h
    .filter(
      (row) => row.player_id === playerId && row.mode_label === modeLabel
    )
    .map((row) => {
      const total = row.wins + row.losses;
      return {
        opponentId: row.opponent_id,
        opponentName:
          playersById.get(row.opponent_id)?.name ?? `#${row.opponent_id}`,
        modeLabel: row.mode_label,
        wins: row.wins,
        losses: row.losses,
        winPct: total > 0 ? row.wins / total : null,
      };
    })
    .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));
}
