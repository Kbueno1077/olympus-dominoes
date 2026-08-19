import {
  activeTeamNumbers,
  gameHands,
  teamNumberFrom,
} from "@/utils/matchSettings";
import { normalizeNameKey, teamsFromRoster } from "@/utils/teams";

export type OpenTablePlayerLine = {
  name: string;
  nameKey: string;
  gamesWon: number;
  gamesLost: number;
  pollosFor: number;
  zapatosFor: number;
};

export type OpenTableGame = {
  winner: string;
  t1Datas?: number[];
  t2Datas?: number[];
  t3Datas?: number[];
  t4Datas?: number[];
};

function emptyLine(name: string): OpenTablePlayerLine {
  return {
    name: name.trim(),
    nameKey: normalizeNameKey(name),
    gamesWon: 0,
    gamesLost: 0,
    pollosFor: 0,
    zapatosFor: 0,
  };
}

function ensureLine(
  map: Map<string, OpenTablePlayerLine>,
  name: string
): OpenTablePlayerLine | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const key = normalizeNameKey(trimmed);
  const existing = map.get(key);
  if (existing) return existing;
  const created = emptyLine(trimmed);
  map.set(key, created);
  return created;
}

function padRoster(names: readonly string[]): string[] {
  return [names[0] ?? "", names[1] ?? "", names[2] ?? "", names[3] ?? ""];
}

/**
 * Per-person wins / losses / pollos / zapatos across an open table.
 * Sit-outs are omitted. Keep in sync with
 * olympus-dominoes-app/src/domain/openTableBoard.ts.
 */
export function tallyOpenTablePlayers(
  completedGames: readonly OpenTableGame[],
  gamePlayers: readonly (readonly string[])[],
  playersAmount: number,
  modeLabel: string,
  currentPlayers: readonly string[] = []
): OpenTablePlayerLine[] {
  const map = new Map<string, OpenTablePlayerLine>();
  const isFreeForAll = modeLabel === "Free For All";
  const teamNumbers = activeTeamNumbers(playersAmount, isFreeForAll);

  for (let index = 0; index < completedGames.length; index++) {
    const game = completedGames[index];
    const roster = padRoster(gamePlayers[index] ?? []);
    const teams = teamsFromRoster(playersAmount, modeLabel, roster);
    const winningTeam = teamNumberFrom(game.winner);

    for (const team of teams) {
      const won = winningTeam != null && team.number === winningTeam;
      let pollosFor = 0;
      let zapatosFor = 0;
      if (won) {
        for (const other of teamNumbers) {
          if (other === team.number) continue;
          const handCount = gameHands(game, other).length;
          if (handCount === 0) pollosFor += 1;
          else if (handCount === 1) zapatosFor += 1;
        }
      }

      for (const member of team.members) {
        const line = ensureLine(map, member.name);
        if (!line) continue;
        if (won) {
          line.gamesWon += 1;
          line.pollosFor += pollosFor;
          line.zapatosFor += zapatosFor;
        } else if (winningTeam != null) {
          line.gamesLost += 1;
        }
      }
    }
  }

  for (const name of currentPlayers.slice(0, playersAmount)) {
    ensureLine(map, name);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
    if (a.gamesLost !== b.gamesLost) return a.gamesLost - b.gamesLost;
    if (b.pollosFor !== a.pollosFor) return b.pollosFor - a.pollosFor;
    if (b.zapatosFor !== a.zapatosFor) return b.zapatosFor - a.zapatosFor;
    return a.name.localeCompare(b.name);
  });
}
