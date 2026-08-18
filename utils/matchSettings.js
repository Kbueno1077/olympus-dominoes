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
export const gameTaken = (game, team) => game?.[`t${team}Taken`] ?? [];

export const emptyGame = {
  t1Datas: [],
  t1TotalPoints: 0,
  t1Taken: [],
  t2Datas: [],
  t2TotalPoints: 0,
  t2Taken: [],
  t3Datas: [],
  t3TotalPoints: 0,
  t3Taken: [],
  t4Datas: [],
  t4TotalPoints: 0,
  t4Taken: [],
  winner: "none",
};

/** Next 1-based take order in this game (resets every game). */
export function nextTakenOrder(game) {
  let maxTaken = 0;
  let totalHands = 0;
  let anyTaken = false;
  for (const team of [1, 2, 3, 4]) {
    totalHands += gameHands(game, team).length;
    for (const order of gameTaken(game, team)) {
      if (order > 0) {
        anyTaken = true;
        if (order > maxTaken) maxTaken = order;
      }
    }
  }
  if (!anyTaken) return totalHands + 1;
  return maxTaken + 1;
}

export function addHandToGame(game, team, points) {
  return {
    ...game,
    [`t${team}Datas`]: [...gameHands(game, team), points],
    [`t${team}TotalPoints`]: (game?.[`t${team}TotalPoints`] ?? 0) + points,
    [`t${team}Taken`]: [...gameTaken(game, team), nextTakenOrder(game)],
  };
}

export function removeHandFromGame(game, team, index) {
  const hands = gameHands(game, team);
  const taken = gameTaken(game, team);
  const points = hands[index] ?? 0;
  const nextHands = [...hands.slice(0, index), ...hands.slice(index + 1)];

  if (taken.length !== hands.length) {
    return {
      ...game,
      [`t${team}Datas`]: nextHands,
      [`t${team}TotalPoints`]: (game?.[`t${team}TotalPoints`] ?? 0) - points,
      t1Taken: [],
      t2Taken: [],
      t3Taken: [],
      t4Taken: [],
    };
  }

  const removed = taken[index] ?? 0;
  const decrement = (orders) =>
    orders.map((order) =>
      removed > 0 && order > removed ? order - 1 : order
    );
  const sliced = [...taken.slice(0, index), ...taken.slice(index + 1)];

  return {
    ...game,
    [`t${team}Datas`]: nextHands,
    [`t${team}TotalPoints`]: (game?.[`t${team}TotalPoints`] ?? 0) - points,
    t1Taken: decrement(team === 1 ? sliced : gameTaken(game, 1)),
    t2Taken: decrement(team === 2 ? sliced : gameTaken(game, 2)),
    t3Taken: decrement(team === 3 ? sliced : gameTaken(game, 3)),
    t4Taken: decrement(team === 4 ? sliced : gameTaken(game, 4)),
  };
}

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
