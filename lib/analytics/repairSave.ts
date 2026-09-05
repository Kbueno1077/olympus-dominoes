import {
  backfillSeatPlayerIds,
  withEnsuredPlayerPublicIds,
} from "./playerIdentity";
import { SCHEMA_VERSION } from "./dbMeta";
import { withEnsuredDbMeta } from "./dbMetaState";
import { withEnsuredMatchPublicIds } from "./matchIdentity";
import { isValidMatchPublicId } from "./matchPublicId";
import { isValidPlayerPublicId } from "./playerPublicId";
import { recomputeAggregatesFromMatches } from "./recomputeFromMatches";
import type { OlympusExportData } from "./types";

export type RepairSaveReport = {
  schemaVersionBefore: number | null;
  schemaVersionAfter: number;
  playerPublicIdsFilled: number;
  matchPublicIdsFilled: number;
  seatsBackfilled: number;
  aggregatesRecomputed: boolean;
};

function countMissingPlayerPublicIds(data: OlympusExportData): number {
  return data.players.filter((player) => !isValidPlayerPublicId(player.public_id))
    .length;
}

function countMissingMatchPublicIds(data: OlympusExportData): number {
  return (data.tables.matches ?? data.matches ?? []).filter(
    (row) => !isValidMatchPublicId(row.public_id)
  ).length;
}

function countSeatsNeedingPlayerId(data: OlympusExportData): number {
  return (data.tables.match_players ?? []).filter((row) => {
    const pid = row.player_id;
    return pid == null || pid === "" || Number(pid) === 0;
  }).length;
}

export function repairSave(data: OlympusExportData): {
  data: OlympusExportData;
  report: RepairSaveReport;
} {
  const schemaVersionBefore = data.db_meta?.schema_version ?? null;
  const playerPublicIdsFilled = countMissingPlayerPublicIds(data);
  const matchPublicIdsFilled = countMissingMatchPublicIds(data);
  const seatsNeedingId = countSeatsNeedingPlayerId(data);

  let next = withEnsuredPlayerPublicIds(data);
  next = withEnsuredMatchPublicIds(next);
  next = backfillSeatPlayerIds(next);
  next = recomputeAggregatesFromMatches(next);
  next = withEnsuredDbMeta(next, {
    origin: data.db_meta?.origin ?? "web",
    label: data.db_meta?.label,
  });

  const seatsAfter = countSeatsNeedingPlayerId(next);

  return {
    data: next,
    report: {
      schemaVersionBefore,
      schemaVersionAfter: next.db_meta?.schema_version ?? SCHEMA_VERSION,
      playerPublicIdsFilled,
      matchPublicIdsFilled,
      seatsBackfilled: Math.max(0, seatsNeedingId - seatsAfter),
      aggregatesRecomputed: true,
    },
  };
}
