import { dropMatchesById } from "./dropMatches";
import { listNightMatches, type NightMatch } from "./matchNightKey";
import { recomputeAggregatesFromMatches } from "./recomputeFromMatches";
import type { OlympusExportData } from "./types";

export type NightDuplicateGroup = {
  fingerprint: string;
  day: string;
  playerNames: string[];
  keepMatchId: number;
  dropMatchIds: number[];
  matches: NightMatch[];
};

export type DedupeNightsResult = {
  data: OlympusExportData;
  groups: NightDuplicateGroup[];
  droppedCount: number;
};

function pickKeep(matches: NightMatch[]): NightMatch {
  return matches.slice().sort((a, b) => a.matchId - b.matchId)[0];
}

export function findDuplicateNightGroups(
  data: OlympusExportData
): NightDuplicateGroup[] {
  const byKey = new Map<string, NightMatch[]>();
  for (const match of listNightMatches(data)) {
    const list = byKey.get(match.fingerprint) ?? [];
    list.push(match);
    byKey.set(match.fingerprint, list);
  }

  const groups: NightDuplicateGroup[] = [];
  byKey.forEach((matches, fingerprint) => {
    if (matches.length < 2) return;
    const keep = pickKeep(matches);
    groups.push({
      fingerprint,
      day: keep.day,
      playerNames: keep.playerNames,
      keepMatchId: keep.matchId,
      dropMatchIds: matches
        .filter((match) => match.matchId !== keep.matchId)
        .map((match) => match.matchId),
      matches: matches.slice().sort((a, b) => a.matchId - b.matchId),
    });
  });
  groups.sort((a, b) => a.day.localeCompare(b.day) || a.keepMatchId - b.keepMatchId);
  return groups;
}

export function dedupeNights(data: OlympusExportData): DedupeNightsResult {
  const groups = findDuplicateNightGroups(data);
  const dropIds = groups.flatMap((group) => group.dropMatchIds);
  if (dropIds.length === 0) {
    return { data, groups, droppedCount: 0 };
  }
  return {
    data: recomputeAggregatesFromMatches(dropMatchesById(data, dropIds)),
    groups,
    droppedCount: dropIds.length,
  };
}
