import { describe, expect, it } from "vitest";
import {
  getPlayerH2H,
  listLeaderboard,
  listStatModes,
} from "./selectors";
import type { OlympusExportData, PlayerRow, PlayerStatsRow } from "./types";
import {
  gamesPlayedForPlayer,
  hidePlayer,
  listHiddenPlayers,
  listVisiblePlayers,
  restoreHiddenPlayer,
  setPlayersHidden,
} from "./playerVisibility";

function player(
  id: number,
  name: string,
  extra?: Partial<PlayerRow>
): PlayerRow {
  return {
    id,
    name,
    name_key: name.toLowerCase(),
    public_id: `${name}PublicId0001`.slice(0, 16),
    created_at: null,
    is_myself: 0,
    is_hidden: 0,
    ...extra,
  };
}

function stats(
  playerId: number,
  extra?: Partial<PlayerStatsRow>
): PlayerStatsRow {
  return {
    player_id: playerId,
    mode_label: "2 vs 2",
    tile_set: "55",
    games_played: 10,
    games_won: 6,
    games_lost: 4,
    points_for: 0,
    points_against: 0,
    hands_for: 0,
    hands_against: 0,
    hands_won: 0,
    hands_lost: 0,
    hands_played: 0,
    pollos_for: 0,
    pollos_against: 0,
    zapatos_for: 0,
    zapatos_against: 0,
    joses_coefficient: null,
    ...extra,
  };
}

function data(partial?: Partial<OlympusExportData>): OlympusExportData {
  return {
    source: "csv",
    fileName: "test.csv",
    importedAt: "2026-08-21T00:00:00.000Z",
    players: [player(1, "Kevin"), player(2, "Guillermo", { is_hidden: 1 })],
    player_stats: [stats(1), stats(2, { games_played: 8, games_won: 3 })],
    player_h2h: [
      {
        player_id: 1,
        opponent_id: 2,
        mode_label: "2 vs 2",
        tile_set: "55",
        wins: 4,
        losses: 2,
      },
    ],
    matches: [],
    tables: { players: [], matches: [] },
    ...partial,
  };
}

describe("player visibility", () => {
  it("splits visible and hidden roster rows", () => {
    const rows = data().players;
    expect(listVisiblePlayers(rows).map((p) => p.name)).toEqual(["Kevin"]);
    expect(listHiddenPlayers(rows).map((p) => p.name)).toEqual(["Guillermo"]);
  });

  it("treats missing is_hidden as visible", () => {
    expect(listVisiblePlayers([player(1, "Ana")])).toHaveLength(1);
  });

  it("hides a visible player without changing public_id or stats", () => {
    const before = data();
    const publicId = before.players[0]?.public_id;
    const after = hidePlayer(before, 1);
    expect(after.players[0]?.is_hidden).toBe(1);
    expect(after.players[0]?.public_id).toBe(publicId);
    expect(after.player_stats).toEqual(before.player_stats);
  });

  it("hides and shows several players at once", () => {
    const hidden = setPlayersHidden(data(), [1, 2], true);
    expect(listVisiblePlayers(hidden.players)).toEqual([]);
    const shown = setPlayersHidden(hidden, [1, 2], false);
    expect(listHiddenPlayers(shown.players)).toEqual([]);
  });

  it("restores a hidden player without changing public_id or stats", () => {
    const before = data();
    const publicId = before.players[1]?.public_id;
    const after = restoreHiddenPlayer(before, 2);
    expect(after.players[1]?.is_hidden).toBe(0);
    expect(after.players[1]?.public_id).toBe(publicId);
    expect(after.player_stats).toEqual(before.player_stats);
    expect(after.player_h2h).toEqual(before.player_h2h);
    expect(gamesPlayedForPlayer(after, 2)).toBe(8);
  });
});

describe("hidden players stay off leaderboard and H2H", () => {
  it("omits hidden players from the leaderboard", () => {
    const names = listLeaderboard(data(), "2 vs 2").map((row) => row.playerName);
    expect(names).toEqual(["Kevin"]);
  });

  it("omits hidden opponents from H2H", () => {
    expect(getPlayerH2H(data(), 1, "2 vs 2")).toEqual([]);
  });

  it("does not list a mode that only hidden players have stats for", () => {
    const onlyHidden = data({
      player_stats: [stats(2, { mode_label: "1 vs 1" })],
    });
    expect(listStatModes(onlyHidden)).toEqual([]);
  });

  it("puts a restored player back on the leaderboard", () => {
    const restored = restoreHiddenPlayer(data(), 2);
    const names = listLeaderboard(restored, "2 vs 2").map(
      (row) => row.playerName
    );
    expect(names).toEqual(["Kevin", "Guillermo"]);
  });
});
