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
