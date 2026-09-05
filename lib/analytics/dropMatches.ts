import { asMatchId } from "./matchNightKey";
import type { OlympusExportData } from "./types";

function keepMatch(row: Record<string, unknown>, keep: Set<number>): boolean {
  return keep.has(asMatchId(row.id));
}

function keepByMatchId(
  row: Record<string, unknown>,
  keep: Set<number>
): boolean {
  return keep.has(asMatchId(row.match_id));
}

/** Drop matches and every child row keyed by match_id / game_id. */
export function dropMatchesById(
  data: OlympusExportData,
  dropIds: readonly number[]
): OlympusExportData {
  const drop = new Set(dropIds.filter((id) => id > 0));
  if (drop.size === 0) return data;

  const keep = new Set<number>();
  for (const row of data.tables.matches ?? data.matches ?? []) {
    const id = asMatchId(row.id);
    if (id && !drop.has(id)) keep.add(id);
  }

  const games = (data.tables.games ?? []).filter((row) =>
    keepByMatchId(row, keep)
  );
  const keepGameIds = new Set(games.map((row) => asMatchId(row.id)));

  return {
    ...data,
    matches: (data.matches ?? []).filter((row) => keepMatch(row, keep)),
    tables: {
      ...data.tables,
      matches: (data.tables.matches ?? []).filter((row) =>
        keepMatch(row, keep)
      ),
      match_players: (data.tables.match_players ?? []).filter((row) =>
        keepByMatchId(row, keep)
      ),
      games,
      game_players: (data.tables.game_players ?? []).filter((row) =>
        keepGameIds.has(asMatchId(row.game_id))
      ),
      game_team_scores: (data.tables.game_team_scores ?? []).filter((row) =>
        keepGameIds.has(asMatchId(row.game_id))
      ),
    },
  };
}
