import { stripTrailingPadHands } from "@/lib/analytics/hands";
import { activeTeamNumbers } from "./matchSettings";

const FREE_FOR_ALL = "Free For All";

/**
 * Group seats into scored teams. Partners share a note, so the roster
 * mirrors the scorepad (same layout as MatchSettings).
 */
export function buildTeams(playersAmount, isFreeForAll, seats) {
  const [p1, p2, p3, p4] = seats;

  if (isFreeForAll) {
    return seats.slice(0, playersAmount).map((slot, index) => ({
      key: `team${index + 1}`,
      number: index + 1,
      members: [slot],
    }));
  }

  return [
    {
      key: "team1",
      number: 1,
      members: playersAmount > 2 ? [p1, p3].filter(Boolean) : [p1],
    },
    {
      key: "team2",
      number: 2,
      members: playersAmount > 3 ? [p2, p4].filter(Boolean) : [p2],
    },
  ];
}

export function teamsFromRoster(playersAmount, modeLabel, players) {
  const seats = players.map((name, index) => ({
    number: index + 1,
    name,
  }));
  return buildTeams(playersAmount, modeLabel === FREE_FOR_ALL, seats);
}

/**
 * Build a team label from member names.
 * - 1 letter/player: "Kevin Jose" → "KJ"
 * - 2 letters/player: first upper, second lower — "Raul Rudelys" → "RaRu"
 */
export function formatTeamInitials(memberNames, lettersPerPlayer) {
  return memberNames
    .map((raw) => {
      const name = String(raw ?? "").trim();
      if (!name) return "";
      if (lettersPerPlayer === 1) {
        return name.charAt(0).toUpperCase();
      }
      const first = name.charAt(0).toUpperCase();
      const second = name.length > 1 ? name.charAt(1).toLowerCase() : "";
      return `${first}${second}`;
    })
    .join("");
}

/**
 * Prefer one initial per player; if any two teams collide, use two letters each.
 * Example: Raul+Rudelys vs Roman+Rother → both "RR" → "RaRu" vs "RoRo".
 */
export function resolveTeamInitialLabels(teamsMemberNames) {
  const cleaned = teamsMemberNames.map((members) =>
    members.map((n) => String(n ?? "").trim()).filter((n) => n.length > 0)
  );

  const short = cleaned.map((members) => formatTeamInitials(members, 1));
  const nonEmpty = short.filter((label) => label.length > 0);
  const collision = new Set(nonEmpty).size < nonEmpty.length;

  if (collision) {
    return cleaned.map((members) => formatTeamInitials(members, 2));
  }
  return short;
}

/** teamNumber → initials label for the current roster seating. */
export function teamInitialLabelsByNumber(playersAmount, modeLabel, players) {
  const teams = teamsFromRoster(playersAmount, modeLabel, players);
  const labels = resolveTeamInitialLabels(
    teams.map((team) => team.members.map((m) => m.name))
  );
  const out = {};
  teams.forEach((team, index) => {
    out[team.number] = labels[index] ?? "";
  });
  return out;
}

export function teamScoresFromGame(game, teamNumbers) {
  return teamNumbers.map((teamNumber) => {
    const hands = stripTrailingPadHands(game[`t${teamNumber}Datas`] ?? []);
    return {
      teamNumber,
      totalPoints: game[`t${teamNumber}TotalPoints`] ?? 0,
      hands,
      handCount: hands.length,
    };
  });
}

export function normalizeNameKey(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase();
}

export { activeTeamNumbers, FREE_FOR_ALL };
