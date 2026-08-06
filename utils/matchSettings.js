export const gameModes2 = [{ label: "1 vs 1" }];
export const gameModes3 = [{ label: "Free For All" }, { label: "2 vs 1" }];
export const gameModes4 = [{ label: "Free For All" }, { label: "2 vs 2" }];

export const TEAM_KEYS = {
  1: "team1",
  2: "team2",
  3: "team3",
  4: "team4",
};

/**
 * Which teams keep their own column on the scorepad. Partners share a note,
 * so a 2 vs 2 match has two columns no matter how many people are playing.
 */
export function activeTeamNumbers(playersAmount, isFreeForAll) {
  if (playersAmount > 2 && isFreeForAll) {
    return playersAmount === 4 ? [1, 2, 3, 4] : [1, 2, 3];
  }
  return [1, 2];
}

/**
 * Winners are stored as "Team 2" and saved to the device, so the stored form
 * stays English regardless of the interface language. This reads the number
 * back out so the name can be re-rendered in whichever language is selected.
 */
export function teamNumberFrom(winner) {
  const match = /^Team ([1-4])$/.exec(winner ?? "");
  return match ? Number(match[1]) : null;
}

export const gameHands = (game, team) => game?.[`t${team}Datas`] ?? [];

/** Games won so far, so the match standing is visible without counting. */
export function tallyWins(completedGames, teamNumbers) {
  return teamNumbers.map((teamNumber) => ({
    teamNumber,
    wins: completedGames.filter((game) => game.winner === `Team ${teamNumber}`)
      .length,
  }));
}

/**
 * Pollos / zapatos each team dealt while winning (opponent had 0 / 1 hands).
 */
export function tallyPollosZapatos(completedGames, teamNumbers) {
  return teamNumbers.map((teamNumber) => {
    let pollosFor = 0;
    let zapatosFor = 0;

    for (const game of completedGames) {
      if (teamNumberFrom(game.winner) !== teamNumber) continue;
      for (const other of teamNumbers) {
        if (other === teamNumber) continue;
        const handCount = gameHands(game, other).length;
        if (handCount === 0) pollosFor += 1;
        else if (handCount === 1) zapatosFor += 1;
      }
    }

    return { teamNumber, pollosFor, zapatosFor };
  });
}
