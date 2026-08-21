/**
 * N-way dataset merge (prototype): union players by public_id, dedupe matches by
 * ended_at + roster + content fingerprint, surface conflicts for review, then
 * materialize a new export.
 */

import { normalizeNameKey } from "@/utils/teams";
import { seedDbMetaRow } from "./dbMeta";
import { withEnsuredDbMeta, withTouchedDbMeta } from "./dbMetaState";
import { withEnsuredMatchPublicIds } from "./matchIdentity";
import {
  generateMatchPublicId,
  isValidMatchPublicId,
} from "./matchPublicId";
import { withEnsuredPlayerPublicIds } from "./playerIdentity";
import { isValidPlayerPublicId } from "./playerPublicId";
import { recomputeAggregatesFromMatches } from "./recomputeFromMatches";
import type { OlympusExportData, PlayerRow } from "./types";

export type MergeSource = {
  datasetId: string;
  displayName: string;
  data: OlympusExportData;
};

export type PlayerOccurrence = {
  datasetId: string;
  datasetName: string;
  playerId: number;
  publicId: string;
  name: string;
  nameKey: string;
  isMyself: boolean;
  isHidden: boolean;
  createdAt: string | null;
};

export type PlayerNameConflict = {
  id: string;
  kind: "name_mismatch";
  publicId: string;
  occurrences: PlayerOccurrence[];
};

export type PlayerIdentityConflict = {
  id: string;
  kind: "same_name_different_id";
  nameKey: string;
  displayName: string;
  occurrences: PlayerOccurrence[];
};

export type MatchCandidate = {
  key: string;
  datasetId: string;
  datasetName: string;
  matchId: number;
  /** Stable cross-DB match identity when present / backfilled. */
  publicId: string;
  fingerprint: string;
  softKey: string;
  endedAt: string;
  title: string;
  modeLabel: string;
  playersAmount: number;
  maxPoints: number;
  playerNames: string[];
  seatPublicIds: string[];
};

export type MatchDuplicateGroup = {
  fingerprint: string;
  keep: MatchCandidate;
  skipped: MatchCandidate[];
};

export type MatchContentConflict = {
  id: string;
  /** Same ended_at + roster, divergent game content. */
  kind: "same_soft_key";
  softKey: string;
  endedAt: string;
  playerNames: string[];
  candidates: MatchCandidate[];
};

/** Same match public_id across sources but different date/roster — kept separate. */
export type MatchIdCollisionGroup = {
  publicId: string;
  candidates: MatchCandidate[];
};

export type MergePlan = {
  sources: {
    datasetId: string;
    displayName: string;
    playerCount: number;
    matchCount: number;
  }[];
  playersAdded: PlayerOccurrence[];
  playersUnchanged: {
    publicId: string;
    name: string;
    sourceNames: string[];
  }[];
  playerNameConflicts: PlayerNameConflict[];
  playerIdentityConflicts: PlayerIdentityConflict[];
  matchesAdded: MatchCandidate[];
  matchesSkippedDuplicates: MatchDuplicateGroup[];
  matchContentConflicts: MatchContentConflict[];
  /** public_id collisions ignored because date/roster differ. */
  matchIdCollisionsIgnored: MatchIdCollisionGroup[];
  totals: {
    sourcePlayers: number;
    sourceMatches: number;
    autoMergedPlayers: number;
    autoUniqueMatches: number;
    unresolvedConflicts: number;
  };
};

export type PlayerNameResolution = {
  conflictId: string;
  /** Dataset whose name wins for this public_id. */
  pickDatasetId: string;
};

export type PlayerIdentityResolution = {
  conflictId: string;
  action: "link" | "keep_separate";
  /** When linking, which public_id survives. */
  keepPublicId?: string;
  /** When linking, which occurrence supplies the display name. */
  nameFromDatasetId?: string;
};

export type MatchContentResolution = {
  conflictId: string;
  action: "pick" | "keep_both";
  /** Candidate.key when action is pick. */
  pickKey?: string;
};

export type MergeResolutions = {
  playerNames: Record<string, PlayerNameResolution>;
  playerIdentities: Record<string, PlayerIdentityResolution>;
  matchContents: Record<string, MatchContentResolution>;
};

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function asString(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = asNumber(value, Number.NaN);
  return Number.isFinite(n) ? n : null;
}

function conflictId(prefix: string, ...parts: string[]): string {
  return `${prefix}:${parts.join("|")}`;
}

function playerIdByNumeric(
  data: OlympusExportData
): Map<number, PlayerRow> {
  return new Map(data.players.map((p) => [p.id, p]));
}

function gameContentDigest(
  data: OlympusExportData,
  matchId: number
): string {
  const gameRows = (data.tables.games ?? [])
    .filter((row) => asNumber(row.match_id) === matchId)
    .slice()
    .sort((a, b) => asNumber(a.game_index) - asNumber(b.game_index));

  const scores = data.tables.game_team_scores ?? [];
  const scoresByGame = new Map<number, string[]>();
  for (const row of scores) {
    const gameId = asNumber(row.game_id);
    const list = scoresByGame.get(gameId) ?? [];
    list.push(
      [
        asNumber(row.team_number),
        asNumber(row.total_points),
        asString(row.hands_json, "[]"),
        asString(row.hands_taken_json, "[]"),
      ].join(":")
    );
    scoresByGame.set(gameId, list);
  }

  return gameRows
    .map((row) => {
      const id = asNumber(row.id);
      const teamBits = (scoresByGame.get(id) ?? []).slice().sort().join(",");
      return `${asNumber(row.game_index)}|${asString(row.winner_team)}|${teamBits}`;
    })
    .join(";");
}

function buildMatchCandidate(
  source: MergeSource,
  matchRow: Record<string, unknown>
): MatchCandidate | null {
  const matchId = asNumber(matchRow.id);
  if (!matchId) return null;

  const byId = playerIdByNumeric(source.data);
  const seats = (source.data.tables.match_players ?? [])
    .filter((row) => asNumber(row.match_id) === matchId)
    .slice()
    .sort((a, b) => asNumber(a.seat) - asNumber(b.seat));

  const playersAmount = asNumber(matchRow.players_amount);
  let activeSeats = seats.filter(
    (row) => asNumber(row.seat) >= 1 && asNumber(row.seat) <= playersAmount
  );

  if (activeSeats.length === 0) {
    const gameIds = new Set(
      (source.data.tables.games ?? [])
        .filter((row) => asNumber(row.match_id) === matchId)
        .map((row) => asNumber(row.id))
    );
    const seen = new Set<string>();
    const openSeats: Record<string, unknown>[] = [];
    for (const row of source.data.tables.game_players ?? []) {
      if (!gameIds.has(asNumber(row.game_id))) continue;
      const key = asString(row.display_name).trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      openSeats.push(row);
    }
    activeSeats = openSeats;
  }

  const seatPublicIds = activeSeats.map((row) => {
    const pid = asNullableNumber(row.player_id);
    if (pid == null) return `name:${asString(row.display_name).trim().toLowerCase()}`;
    const player = byId.get(pid);
    if (player && isValidPlayerPublicId(player.public_id)) {
      return player.public_id;
    }
    return `local:${source.datasetId}:${pid}`;
  });

  const sortedRoster = seatPublicIds.slice().sort().join(",");
  const endedAt = asString(matchRow.ended_at);
  const modeLabel = asString(matchRow.mode_label);
  const maxPoints = asNumber(matchRow.max_points);
  const digest = gameContentDigest(source.data, matchId);

  const fingerprint = [
    endedAt,
    modeLabel,
    String(playersAmount),
    String(maxPoints),
    sortedRoster,
    digest,
  ].join("|");

  const softKey = [endedAt, sortedRoster].join("|");
  const publicIdRaw = matchRow.public_id;
  const publicId =
    typeof publicIdRaw === "string" && isValidMatchPublicId(publicIdRaw)
      ? publicIdRaw
      : `legacy:${source.datasetId}:${matchId}`;

  return {
    key: `${source.datasetId}:${matchId}`,
    datasetId: source.datasetId,
    datasetName: source.displayName,
    matchId,
    publicId,
    fingerprint,
    softKey,
    endedAt,
    title: asString(matchRow.title),
    modeLabel,
    playersAmount,
    maxPoints,
    playerNames: activeSeats.map((row) => asString(row.display_name)),
    seatPublicIds,
  };
}

function collectOccurrences(sources: MergeSource[]): PlayerOccurrence[] {
  const out: PlayerOccurrence[] = [];
  for (const source of sources) {
    const data = withEnsuredPlayerPublicIds(source.data);
    for (const player of data.players) {
      out.push({
        datasetId: source.datasetId,
        datasetName: source.displayName,
        playerId: player.id,
        publicId: player.public_id,
        name: player.name,
        nameKey: player.name_key || normalizeNameKey(player.name),
        isMyself: (player.is_myself ?? 0) === 1,
        isHidden: (player.is_hidden ?? 0) === 1,
        createdAt: player.created_at ?? null,
      });
    }
  }
  return out;
}

/** Build a reviewable merge plan (no mutations). */
export function analyzeMerge(sources: MergeSource[]): MergePlan {
  if (sources.length < 2) {
    throw new Error("merge_need_two");
  }

  const occurrences = collectOccurrences(sources);

  const byPublicId = new Map<string, PlayerOccurrence[]>();
  for (const occ of occurrences) {
    const list = byPublicId.get(occ.publicId) ?? [];
    list.push(occ);
    byPublicId.set(occ.publicId, list);
  }

  const playersUnchanged: MergePlan["playersUnchanged"] = [];
  const playersAdded: PlayerOccurrence[] = [];
  const playerNameConflicts: PlayerNameConflict[] = [];

  for (const [publicId, list] of Array.from(byPublicId.entries())) {
    const names = new Set(list.map((o: PlayerOccurrence) => o.name.trim()));
    const sourceNames = Array.from(
      new Set(list.map((o: PlayerOccurrence) => o.datasetName))
    );
    if (list.length === 1) {
      playersAdded.push(list[0]);
      continue;
    }
    if (names.size <= 1) {
      playersUnchanged.push({
        publicId,
        name: list[0].name,
        sourceNames,
      });
      continue;
    }
    playerNameConflicts.push({
      id: conflictId("pname", publicId),
      kind: "name_mismatch",
      publicId,
      occurrences: list,
    });
  }

  // Same name_key, different public_id — only among players not already name-conflicted.
  const nameConflictPublicIds = new Set(
    playerNameConflicts.map((c) => c.publicId)
  );
  const byNameKey = new Map<string, PlayerOccurrence[]>();
  for (const occ of occurrences) {
    if (nameConflictPublicIds.has(occ.publicId)) continue;
    const key = occ.nameKey || normalizeNameKey(occ.name);
    if (!key) continue;
    const list = byNameKey.get(key) ?? [];
    list.push(occ);
    byNameKey.set(key, list);
  }

  const playerIdentityConflicts: PlayerIdentityConflict[] = [];
  const identityPublicIds = new Set<string>();
  for (const [nameKey, list] of Array.from(byNameKey.entries())) {
    const publicIds = new Set(list.map((o: PlayerOccurrence) => o.publicId));
    if (publicIds.size <= 1) continue;
    // Deduplicate occurrences by public_id (one representative per id).
    const unique: PlayerOccurrence[] = [];
    const seen = new Set<string>();
    for (const occ of list) {
      if (seen.has(occ.publicId)) continue;
      seen.add(occ.publicId);
      unique.push(occ);
    }
    if (unique.length < 2) continue;
    for (const occ of unique) identityPublicIds.add(occ.publicId);
    playerIdentityConflicts.push({
      id: conflictId("pident", nameKey),
      kind: "same_name_different_id",
      nameKey,
      displayName: unique[0].name,
      occurrences: unique,
    });
  }

  const playersAddedFiltered = playersAdded.filter(
    (p) => !identityPublicIds.has(p.publicId)
  );

  // Matches — primary key is ended_at + roster (softKey); content decides dedupe vs conflict.
  const candidates: MatchCandidate[] = [];
  for (const source of sources) {
    const ensured = withEnsuredMatchPublicIds(source.data);
    const sourceWithIds: MergeSource = { ...source, data: ensured };
    for (const row of ensured.tables.matches ?? ensured.matches ?? []) {
      const candidate = buildMatchCandidate(sourceWithIds, row);
      if (candidate) candidates.push(candidate);
    }
  }

  const orderCandidate = (a: MatchCandidate, b: MatchCandidate) => {
    const ai = sources.findIndex((s) => s.datasetId === a.datasetId);
    const bi = sources.findIndex((s) => s.datasetId === b.datasetId);
    return ai - bi || a.matchId - b.matchId;
  };

  const bySoftKey = new Map<string, MatchCandidate[]>();
  for (const c of candidates) {
    const list = bySoftKey.get(c.softKey) ?? [];
    list.push(c);
    bySoftKey.set(c.softKey, list);
  }

  const matchesSkippedDuplicates: MatchDuplicateGroup[] = [];
  const matchContentConflicts: MatchContentConflict[] = [];
  const matchesAdded: MatchCandidate[] = [];

  for (const [softKey, list] of Array.from(bySoftKey.entries())) {
    const ordered = list.slice().sort(orderCandidate);
    if (ordered.length === 1) {
      matchesAdded.push(ordered[0]);
      continue;
    }

    const byFingerprint = new Map<string, MatchCandidate[]>();
    for (const c of ordered) {
      const group = byFingerprint.get(c.fingerprint) ?? [];
      group.push(c);
      byFingerprint.set(c.fingerprint, group);
    }

    if (byFingerprint.size === 1) {
      const group = Array.from(byFingerprint.values())[0];
      matchesAdded.push(group[0]);
      if (group.length > 1) {
        matchesSkippedDuplicates.push({
          fingerprint: group[0].fingerprint,
          keep: group[0],
          skipped: group.slice(1),
        });
      }
      continue;
    }

    // Same date+roster, divergent content → conflict (one rep per fingerprint).
    const conflictCandidates: MatchCandidate[] = [];
    for (const group of Array.from(byFingerprint.values())) {
      const orderedGroup = group.slice().sort(orderCandidate);
      conflictCandidates.push(orderedGroup[0]);
      if (orderedGroup.length > 1) {
        matchesSkippedDuplicates.push({
          fingerprint: orderedGroup[0].fingerprint,
          keep: orderedGroup[0],
          skipped: orderedGroup.slice(1),
        });
      }
    }

    matchContentConflicts.push({
      id: conflictId("msoft", softKey),
      kind: "same_soft_key",
      softKey,
      endedAt: ordered[0].endedAt,
      playerNames: ordered[0].playerNames,
      candidates: conflictCandidates.slice().sort(orderCandidate),
    });
  }

  // Same public_id, different softKey → keep both; surface for review only.
  const byMatchPublicId = new Map<string, MatchCandidate[]>();
  for (const c of candidates) {
    if (!isValidMatchPublicId(c.publicId) || c.publicId.startsWith("legacy:")) {
      continue;
    }
    const list = byMatchPublicId.get(c.publicId) ?? [];
    list.push(c);
    byMatchPublicId.set(c.publicId, list);
  }

  const matchIdCollisionsIgnored: MatchIdCollisionGroup[] = [];
  for (const [publicId, list] of Array.from(byMatchPublicId.entries())) {
    if (list.length < 2) continue;
    const softKeys = new Set(list.map((c) => c.softKey));
    if (softKeys.size < 2) continue;
    matchIdCollisionsIgnored.push({
      publicId,
      candidates: list.slice().sort(orderCandidate),
    });
  }

  const unresolvedConflicts =
    playerNameConflicts.length +
    playerIdentityConflicts.length +
    matchContentConflicts.length;

  return {
    sources: sources.map((s) => ({
      datasetId: s.datasetId,
      displayName: s.displayName,
      playerCount: s.data.players.length,
      matchCount: (s.data.tables.matches ?? s.data.matches ?? []).length,
    })),
    playersAdded: playersAddedFiltered,
    playersUnchanged,
    playerNameConflicts,
    playerIdentityConflicts,
    matchesAdded,
    matchesSkippedDuplicates,
    matchContentConflicts,
    matchIdCollisionsIgnored,
    totals: {
      sourcePlayers: occurrences.length,
      sourceMatches: candidates.length,
      // One row per public_id before identity link/separate resolutions.
      autoMergedPlayers: byPublicId.size,
      autoUniqueMatches: matchesAdded.length + matchContentConflicts.length,
      unresolvedConflicts,
    },
  };
}

export function emptyResolutions(): MergeResolutions {
  return { playerNames: {}, playerIdentities: {}, matchContents: {} };
}

export function areAllConflictsResolved(
  plan: MergePlan,
  resolutions: MergeResolutions
): boolean {
  for (const c of plan.playerNameConflicts) {
    const r = resolutions.playerNames[c.id];
    if (!r?.pickDatasetId) return false;
    if (!c.occurrences.some((o) => o.datasetId === r.pickDatasetId)) {
      return false;
    }
  }
  for (const c of plan.playerIdentityConflicts) {
    const r = resolutions.playerIdentities[c.id];
    if (!r) return false;
    if (r.action === "keep_separate") continue;
    if (r.action !== "link" || !r.keepPublicId) return false;
    if (!c.occurrences.some((o) => o.publicId === r.keepPublicId)) return false;
  }
  for (const c of plan.matchContentConflicts) {
    const r = resolutions.matchContents[c.id];
    if (!r) return false;
    if (r.action === "keep_both") continue;
    if (r.action !== "pick" || !r.pickKey) return false;
    if (!c.candidates.some((cand) => cand.key === r.pickKey)) return false;
  }
  return true;
}

type CanonicalPlayer = {
  publicId: string;
  name: string;
  nameKey: string;
  isMyself: boolean;
  isHidden: boolean;
  createdAt: string | null;
  /** Source keys that map into this player. */
  aliases: { datasetId: string; playerId: number; publicId: string }[];
};

function resolveCanonicalPlayers(
  sources: MergeSource[],
  plan: MergePlan,
  resolutions: MergeResolutions
): CanonicalPlayer[] {
  const occurrences = collectOccurrences(sources);
  const byPublicId = new Map<string, PlayerOccurrence[]>();
  for (const occ of occurrences) {
    const list = byPublicId.get(occ.publicId) ?? [];
    list.push(occ);
    byPublicId.set(occ.publicId, list);
  }

  // public_id → surviving public_id (after link resolutions)
  const publicIdRedirect = new Map<string, string>();
  for (const c of plan.playerIdentityConflicts) {
    const r = resolutions.playerIdentities[c.id];
    if (!r || r.action !== "link" || !r.keepPublicId) continue;
    for (const occ of c.occurrences) {
      publicIdRedirect.set(occ.publicId, r.keepPublicId);
    }
  }

  const resolvePublicId = (id: string): string =>
    publicIdRedirect.get(id) ?? id;

  const groups = new Map<string, PlayerOccurrence[]>();
  for (const occ of occurrences) {
    const canon = resolvePublicId(occ.publicId);
    const list = groups.get(canon) ?? [];
    list.push(occ);
    groups.set(canon, list);
  }

  const namePick = new Map<string, string>();
  for (const c of plan.playerNameConflicts) {
    const r = resolutions.playerNames[c.id];
    if (r?.pickDatasetId) namePick.set(c.publicId, r.pickDatasetId);
  }

  // Identity link: optional name from dataset
  for (const c of plan.playerIdentityConflicts) {
    const r = resolutions.playerIdentities[c.id];
    if (r?.action === "link" && r.keepPublicId && r.nameFromDatasetId) {
      namePick.set(r.keepPublicId, r.nameFromDatasetId);
    }
  }

  const canonical: CanonicalPlayer[] = [];
  for (const [publicId, list] of Array.from(groups.entries())) {
    const pickDataset = namePick.get(publicId);
    const named =
      (pickDataset
        ? list.find((o: PlayerOccurrence) => o.datasetId === pickDataset)
        : undefined) ?? list[0];

    let isMyself = false;
    let isHidden = true;
    for (const occ of list) {
      if (occ.isMyself) {
        isMyself = true;
      }
      if (!occ.isHidden) {
        isHidden = false;
      }
    }

    let createdAt: string | null = null;
    for (const occ of list) {
      if (occ.createdAt) {
        if (!createdAt || occ.createdAt < createdAt) createdAt = occ.createdAt;
      }
    }

    const aliases: CanonicalPlayer["aliases"] = [];
    const seenAlias = new Set<string>();
    for (const occ of list) {
      const key = `${occ.datasetId}:${occ.playerId}`;
      if (seenAlias.has(key)) continue;
      seenAlias.add(key);
      aliases.push({
        datasetId: occ.datasetId,
        playerId: occ.playerId,
        publicId: occ.publicId,
      });
    }

    canonical.push({
      publicId,
      name: named.name,
      nameKey: named.nameKey || normalizeNameKey(named.name),
      isMyself,
      isHidden,
      createdAt,
      aliases,
    });
  }

  // At most one myself
  let myselfSeen = false;
  for (const player of canonical) {
    if (!player.isMyself) continue;
    if (myselfSeen) player.isMyself = false;
    else myselfSeen = true;
  }

  return canonical.sort((a, b) => a.name.localeCompare(b.name));
}

/** Matches that will land in the merged export after resolutions (before exclusions). */
export function selectMatchCandidates(
  sources: MergeSource[],
  plan: MergePlan,
  resolutions: MergeResolutions,
  excludeMatchKeys: Iterable<string> = []
): MatchCandidate[] {
  const excluded = new Set(excludeMatchKeys);
  const selected: MatchCandidate[] = [...plan.matchesAdded];

  for (const group of plan.matchesSkippedDuplicates) {
    // Already represented by keep in matchesAdded if unique; duplicates are only in skipped.
    // keep may also be in matchesAdded — ensure once.
    if (!selected.some((c) => c.key === group.keep.key)) {
      selected.push(group.keep);
    }
  }

  for (const conflict of plan.matchContentConflicts) {
    const r = resolutions.matchContents[conflict.id];
    if (!r) continue;
    if (r.action === "keep_both") {
      for (const cand of conflict.candidates) {
        if (!selected.some((c) => c.key === cand.key)) selected.push(cand);
      }
      continue;
    }
    const pick = conflict.candidates.find((c) => c.key === r.pickKey);
    if (pick && !selected.some((c) => c.key === pick.key)) {
      selected.push(pick);
    }
  }

  const filtered = selected.filter((c) => !excluded.has(c.key));

  // Sort stable by ended_at then source order
  return filtered.slice().sort((a, b) => {
    const at = new Date(a.endedAt).getTime();
    const bt = new Date(b.endedAt).getTime();
    if (Number.isFinite(bt) && Number.isFinite(at) && bt !== at) return at - bt;
    const ai = sources.findIndex((s) => s.datasetId === a.datasetId);
    const bi = sources.findIndex((s) => s.datasetId === b.datasetId);
    return ai - bi || a.matchId - b.matchId;
  });
}

/**
 * When Accept Both keeps multiple rows that shared one public_id, Current
 * (first by source order) keeps it; later copies get a fresh id.
 */
function assignUniqueMatchPublicIds(
  candidates: MatchCandidate[]
): Map<string, string> {
  const keyToPublicId = new Map<string, string>();
  const used = new Set<string>();

  for (const cand of candidates) {
    const preferred =
      isValidMatchPublicId(cand.publicId) && !cand.publicId.startsWith("legacy:")
        ? cand.publicId
        : null;
    if (preferred && !used.has(preferred)) {
      used.add(preferred);
      keyToPublicId.set(cand.key, preferred);
      continue;
    }
    let next = generateMatchPublicId();
    while (used.has(next)) next = generateMatchPublicId();
    used.add(next);
    keyToPublicId.set(cand.key, next);
  }

  return keyToPublicId;
}

function copyMatchSubtree(
  source: OlympusExportData,
  oldMatchId: number,
  newMatchId: number,
  nextGameId: { value: number },
  remapPlayerId: (oldId: number | null) => number | null,
  publicId: string
): {
  match: Record<string, unknown>;
  matchPlayers: Record<string, unknown>[];
  games: Record<string, unknown>[];
  gamePlayers: Record<string, unknown>[];
  scores: Record<string, unknown>[];
} {
  const matchRow = (source.tables.matches ?? source.matches ?? []).find(
    (row) => asNumber(row.id) === oldMatchId
  );
  if (!matchRow) {
    throw new Error(`missing_match:${oldMatchId}`);
  }

  const match = {
    ...matchRow,
    id: newMatchId,
    public_id: publicId,
  };

  const matchPlayers = (source.tables.match_players ?? [])
    .filter((row) => asNumber(row.match_id) === oldMatchId)
    .map((row) => ({
      ...row,
      match_id: newMatchId,
      player_id: remapPlayerId(asNullableNumber(row.player_id)),
    }));

  const gameRows = (source.tables.games ?? [])
    .filter((row) => asNumber(row.match_id) === oldMatchId)
    .slice()
    .sort((a, b) => asNumber(a.game_index) - asNumber(b.game_index));

  const games: Record<string, unknown>[] = [];
  const gamePlayers: Record<string, unknown>[] = [];
  const scores: Record<string, unknown>[] = [];
  const oldToNewGame = new Map<number, number>();

  for (const row of gameRows) {
    const oldGameId = asNumber(row.id);
    const newGameId = nextGameId.value++;
    oldToNewGame.set(oldGameId, newGameId);
    games.push({
      ...row,
      id: newGameId,
      match_id: newMatchId,
    });
  }

  for (const row of source.tables.game_players ?? []) {
    const oldGameId = asNumber(row.game_id);
    const newGameId = oldToNewGame.get(oldGameId);
    if (newGameId == null) continue;
    gamePlayers.push({
      ...row,
      game_id: newGameId,
      player_id: remapPlayerId(asNullableNumber(row.player_id)),
    });
  }

  for (const row of source.tables.game_team_scores ?? []) {
    const oldGameId = asNumber(row.game_id);
    const newGameId = oldToNewGame.get(oldGameId);
    if (newGameId == null) continue;
    scores.push({
      ...row,
      game_id: newGameId,
    });
  }

  return { match, matchPlayers, games, gamePlayers, scores };
}

/**
 * Materialize a new OlympusExportData from sources + resolved conflicts.
 * Call only when `areAllConflictsResolved` is true.
 */
export function materializeMergedExport(
  sources: MergeSource[],
  plan: MergePlan,
  resolutions: MergeResolutions,
  options: {
    displayName: string;
    fileName?: string;
    excludeMatchKeys?: Iterable<string>;
  }
): OlympusExportData {
  if (!areAllConflictsResolved(plan, resolutions)) {
    throw new Error("merge_unresolved");
  }

  const canonical = resolveCanonicalPlayers(sources, plan, resolutions);
  const players: PlayerRow[] = canonical.map((player, index) => ({
    id: index + 1,
    public_id: player.publicId,
    name: player.name,
    name_key: player.nameKey,
    created_at: player.createdAt,
    is_myself: player.isMyself && !player.isHidden ? 1 : 0,
    is_hidden: player.isHidden ? 1 : 0,
  }));

  const remap = new Map<string, number>();
  canonical.forEach((player, index) => {
    const newId = index + 1;
    for (const alias of player.aliases) {
      remap.set(`${alias.datasetId}:${alias.playerId}`, newId);
    }
  });

  const remapPlayerId = (
    datasetId: string,
    oldId: number | null
  ): number | null => {
    if (oldId == null) return null;
    return remap.get(`${datasetId}:${oldId}`) ?? null;
  };

  const selectedMatches = selectMatchCandidates(
    sources,
    plan,
    resolutions,
    options.excludeMatchKeys
  );
  const publicIdByKey = assignUniqueMatchPublicIds(selectedMatches);
  const sourceById = new Map(sources.map((s) => [s.datasetId, s]));

  const matches: Record<string, unknown>[] = [];
  const matchPlayers: Record<string, unknown>[] = [];
  const games: Record<string, unknown>[] = [];
  const gamePlayers: Record<string, unknown>[] = [];
  const scores: Record<string, unknown>[] = [];
  const nextGameId = { value: 1 };
  let nextMatchId = 1;

  for (const candidate of selectedMatches) {
    const source = sourceById.get(candidate.datasetId);
    if (!source) continue;
    const publicId =
      publicIdByKey.get(candidate.key) ?? generateMatchPublicId();
    const subtree = copyMatchSubtree(
      source.data,
      candidate.matchId,
      nextMatchId++,
      nextGameId,
      (oldId) => remapPlayerId(candidate.datasetId, oldId),
      publicId
    );
    matches.push(subtree.match);
    matchPlayers.push(...subtree.matchPlayers);
    games.push(...subtree.games);
    gamePlayers.push(...subtree.gamePlayers);
    scores.push(...subtree.scores);
  }

  const rawPlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    name_key: player.name_key,
    public_id: player.public_id,
    created_at: player.created_at ?? null,
    is_myself: player.is_myself ?? 0,
    is_hidden: player.is_hidden ?? 0,
  }));

  let data: OlympusExportData = {
    source: "csv",
    fileName: options.fileName ?? `merged-${options.displayName}.csv`,
    importedAt: new Date().toISOString(),
    players,
    player_stats: [],
    player_h2h: [],
    matches,
    tables: {
      players: rawPlayers,
      matches,
      match_players: matchPlayers,
      games,
      game_players: gamePlayers,
      game_team_scores: scores,
      player_stats: [],
      player_h2h: [],
      app_settings: [],
    },
  };

  data = recomputeAggregatesFromMatches(data);

  data = withEnsuredDbMeta(
    {
      ...data,
      db_meta: seedDbMetaRow({
        origin: "web",
        label: options.displayName,
      }),
    },
    { origin: "web", label: options.displayName }
  );

  return withTouchedDbMeta(data, { label: options.displayName });
}

/** Preview counts after resolutions (for UI totals strip). */
export function previewMergeCounts(
  sources: MergeSource[],
  plan: MergePlan,
  resolutions: MergeResolutions,
  excludeMatchKeys: Iterable<string> = []
): { players: number; matches: number } {
  if (!areAllConflictsResolved(plan, resolutions)) {
    return {
      players: plan.totals.autoMergedPlayers,
      matches: plan.totals.autoUniqueMatches,
    };
  }
  const players = resolveCanonicalPlayers(sources, plan, resolutions).length;
  const matches = selectMatchCandidates(
    sources,
    plan,
    resolutions,
    excludeMatchKeys
  ).length;
  return { players, matches };
}
