"use client";

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "@/i18n/useTranslation";
import { useMatchStore } from "@/lib/matchStore";
import {
  FREE_FOR_ALL,
  teamFullLabelsByNumber,
  teamInitialLabelsByNumber,
} from "@/utils/teams";

function useMatchRoster() {
  const { playersAmount, gameMode, player1, player2, player3, player4 } =
    useMatchStore(
      useShallow((s) => ({
        playersAmount: s.playersAmount,
        gameMode: s.gameMode,
        player1: s.player1,
        player2: s.player2,
        player3: s.player3,
        player4: s.player4,
      }))
    );

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
