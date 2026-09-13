"use client";

import { useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import { useTranslation } from "@/i18n/useTranslation";
import {
  gameModeRecoil,
  player1Recoil,
  player2Recoil,
  player3Recoil,
  player4Recoil,
  playersAmountRecoil,
} from "@/recoil/recoilState";
import {
  FREE_FOR_ALL,
  teamFullLabelsByNumber,
  teamInitialLabelsByNumber,
} from "@/utils/teams";

function useMatchRoster() {
  const playersAmount = useRecoilValue(playersAmountRecoil);
  const gameMode = useRecoilValue(gameModeRecoil);
  const player1 = useRecoilValue(player1Recoil);
  const player2 = useRecoilValue(player2Recoil);
  const player3 = useRecoilValue(player3Recoil);
  const player4 = useRecoilValue(player4Recoil);

  const players = useMemo(
    () => [player1, player2, player3, player4],
    [player1, player2, player3, player4]
  );

  return {
    playersAmount,
    modeLabel: gameMode?.label ?? FREE_FOR_ALL,
    players,
  };
}

/**
 * Live-match team label: player initials (KJ / RaRu), falling back to
 * "Team N" when a side has no names yet.
 */
export function useMatchTeamLabel() {
  const { teamName } = useTranslation();
  const { playersAmount, modeLabel, players } = useMatchRoster();

  const byNumber = useMemo(
    () => teamInitialLabelsByNumber(playersAmount, modeLabel, players),
    [players, playersAmount, modeLabel]
  );

  return useCallback(
    (teamNumber) => byNumber[teamNumber] || teamName(teamNumber),
    [byNumber, teamName]
  );
}

/** Live-match team label: "Carlos & Hector", falling back to "Team N". */
export function useMatchTeamFullLabel() {
  const { teamName } = useTranslation();
  const { playersAmount, modeLabel, players } = useMatchRoster();

  const byNumber = useMemo(
    () => teamFullLabelsByNumber(playersAmount, modeLabel, players),
    [players, playersAmount, modeLabel]
  );

  return useCallback(
    (teamNumber) => byNumber[teamNumber] || teamName(teamNumber),
    [byNumber, teamName]
  );
}
