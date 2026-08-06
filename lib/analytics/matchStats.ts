import {
  activeTeamNumbers,
  teamNumberFrom,
} from "@/utils/matchSettings";
import {
  FREE_FOR_ALL,
  teamsFromRoster,
  teamScoresFromGame,
} from "@/utils/teams";

export type NamedSeat = {
  seat: number;
  displayName: string;
  playerId: number | null;
};

export type MatchGame = {
  t1Datas: number[];
  t1TotalPoints: number;
  t2Datas: number[];
  t2TotalPoints: number;
  t3Datas: number[];
  t3TotalPoints: number;
  t4Datas: number[];
  t4TotalPoints: number;
  winner: string;
};

export type MatchSnapshotInput = {
  modeLabel: string;
  playersAmount: number;
  seats: NamedSeat[];
  games: MatchGame[];
};

export type PlayerStatDelta = {
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
  handsPlayed: number;
  pollosFor: number;
  pollosAgainst: number;
  zapatosFor: number;
  zapatosAgainst: number;
};

export type H2HDelta = {
  playerId: number;
  opponentId: number;
  modeLabel: string;
  wins: number;
  losses: number;
};

export type StatsDelta = {
  playerStats: PlayerStatDelta[];
  h2h: H2HDelta[];
};

function emptyPlayerDelta(
  playerId: number,
  modeLabel: string
): PlayerStatDelta {
  return {
    playerId,
    modeLabel,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    handsFor: 0,
    handsAgainst: 0,
    handsWon: 0,
    handsLost: 0,
    handsPlayed: 0,
    pollosFor: 0,
    pollosAgainst: 0,
    zapatosFor: 0,
    zapatosAgainst: 0,
  };
}

function h2hKey(playerId: number, opponentId: number, modeLabel: string) {
  return `${playerId}|${opponentId}|${modeLabel}`;
}

/**
 * Pure stats for one finished match. Only seats with `playerId` receive bumps.
 */
export function computeMatchStatsDelta(input: MatchSnapshotInput): StatsDelta {
  const { modeLabel, playersAmount, seats, games } = input;
  const isFreeForAll = modeLabel === FREE_FOR_ALL;
  const teamNumbers = activeTeamNumbers(playersAmount, isFreeForAll);

  const rosterNames = ["", "", "", ""] as [string, string, string, string];
  for (const seat of seats) {
    if (seat.seat >= 1 && seat.seat <= 4) {
      rosterNames[seat.seat - 1] = seat.displayName;
    }
  }
  const teams = teamsFromRoster(playersAmount, modeLabel, rosterNames);

  const teamToPlayerIds = new Map<number, number[]>();
  for (const team of teams) {
    const ids: number[] = [];
    for (const member of team.members) {
      const seat = seats.find((s) => s.seat === member.number);
      if (seat?.playerId != null) ids.push(seat.playerId);
    }
    teamToPlayerIds.set(team.number, ids);
  }

  const playerMap = new Map<number, PlayerStatDelta>();
  const h2hMap = new Map<string, H2HDelta>();

  const bumpPlayer = (playerId: number) => {
    let row = playerMap.get(playerId);
    if (!row) {
      row = emptyPlayerDelta(playerId, modeLabel);
      playerMap.set(playerId, row);
    }
    return row;
  };

  const bumpH2H = (playerId: number, opponentId: number, win: boolean) => {
    if (playerId === opponentId) return;
    const key = h2hKey(playerId, opponentId, modeLabel);
    let row = h2hMap.get(key);
    if (!row) {
      row = {
        playerId,
        opponentId,
        modeLabel,
        wins: 0,
        losses: 0,
      };
      h2hMap.set(key, row);
    }
    if (win) row.wins += 1;
    else row.losses += 1;
  };

  for (const game of games) {
    const scores = teamScoresFromGame(game, teamNumbers);
    const scoreByTeam = new Map(
      scores.map((s: { teamNumber: number }) => [s.teamNumber, s])
    );
    const winningTeam = teamNumberFrom(game.winner);

    const totalAll = scores.reduce(
      (sum: number, s: { totalPoints: number }) => sum + s.totalPoints,
      0
    );

    for (const team of teams) {
      const score = scoreByTeam.get(team.number) as
        | {
            teamNumber: number;
            totalPoints: number;
            handCount: number;
          }
        | undefined;
      if (!score) continue;
      const playerIds = teamToPlayerIds.get(team.number) ?? [];
      if (playerIds.length === 0) continue;

      const won = winningTeam === team.number;
      const lost = winningTeam != null && !won;
      const pointsAgainst = totalAll - score.totalPoints;
      let handsAgainst = 0;
      for (const other of scores) {
        if (other.teamNumber === team.number) continue;
        handsAgainst += other.handCount;
      }

      let pollosAgainst = 0;
      let zapatosAgainst = 0;
      if (lost) {
        if (score.handCount === 0) pollosAgainst = 1;
        else if (score.handCount === 1) zapatosAgainst = 1;
      }

      let pollosFor = 0;
      let zapatosFor = 0;
      if (won) {
        for (const other of scores) {
          if (other.teamNumber === team.number) continue;
          if (other.handCount === 0) pollosFor += 1;
          else if (other.handCount === 1) zapatosFor += 1;
        }
      }

      for (const playerId of playerIds) {
        const row = bumpPlayer(playerId);
        row.gamesPlayed += 1;
        if (won) row.gamesWon += 1;
        if (lost) row.gamesLost += 1;
        row.pointsFor += score.totalPoints;
        row.pointsAgainst += pointsAgainst;
        // Manos: scored (won) + conceded (lost) = all datas played this game.
        row.handsFor += score.handCount;
        row.handsAgainst += handsAgainst;
        row.handsWon += score.handCount;
        row.handsLost += handsAgainst;
        row.handsPlayed += score.handCount + handsAgainst;
        row.pollosFor += pollosFor;
        row.pollosAgainst += pollosAgainst;
        row.zapatosFor += zapatosFor;
        row.zapatosAgainst += zapatosAgainst;
      }
    }

    if (winningTeam != null) {
      const winners = teamToPlayerIds.get(winningTeam) ?? [];
      for (const team of teams) {
        if (team.number === winningTeam) continue;
        const losers = teamToPlayerIds.get(team.number) ?? [];
        for (const winnerId of winners) {
          for (const loserId of losers) {
            bumpH2H(winnerId, loserId, true);
            bumpH2H(loserId, winnerId, false);
          }
        }
      }
    }
  }

  return {
    playerStats: Array.from(playerMap.values()),
    h2h: Array.from(h2hMap.values()),
  };
}

export function mergeStatsDeltas(deltas: StatsDelta[]): StatsDelta {
  const playerMap = new Map<string, PlayerStatDelta>();
  const h2hMap = new Map<string, H2HDelta>();

  for (const delta of deltas) {
    for (const row of delta.playerStats) {
      const key = `${row.playerId}|${row.modeLabel}`;
      const existing = playerMap.get(key);
      if (!existing) {
        playerMap.set(key, { ...row });
        continue;
      }
      existing.gamesPlayed += row.gamesPlayed;
      existing.gamesWon += row.gamesWon;
      existing.gamesLost += row.gamesLost;
      existing.pointsFor += row.pointsFor;
      existing.pointsAgainst += row.pointsAgainst;
      existing.handsFor += row.handsFor;
      existing.handsAgainst += row.handsAgainst;
      existing.handsWon += row.handsWon;
      existing.handsLost += row.handsLost;
      existing.handsPlayed += row.handsPlayed;
      existing.pollosFor += row.pollosFor;
      existing.pollosAgainst += row.pollosAgainst;
      existing.zapatosFor += row.zapatosFor;
      existing.zapatosAgainst += row.zapatosAgainst;
    }
    for (const row of delta.h2h) {
      const key = h2hKey(row.playerId, row.opponentId, row.modeLabel);
      const existing = h2hMap.get(key);
      if (!existing) {
        h2hMap.set(key, { ...row });
        continue;
      }
      existing.wins += row.wins;
      existing.losses += row.losses;
    }
  }

  return {
    playerStats: Array.from(playerMap.values()),
    h2h: Array.from(h2hMap.values()),
  };
}
