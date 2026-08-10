"use client";

import ConfirmDeleteMatch from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteMatch";
import {
  completedGamesRecoil,
  currentGameRecoil,
  dominoSetRecoil,
  gameModeRecoil,
  isGameStartedRecoil,
  matchDescriptionRecoil,
  maxPointsRecoil,
  player1Recoil,
  player2Recoil,
  player3Recoil,
  player4Recoil,
  playersAmountRecoil,
  renderGameModesRecoil,
  whoWonRecoil,
} from "@/recoil/recoilState";
import {
  DEFAULT_DOMINO_SET_ID,
  getDominoSet,
} from "@/utils/dominoSets";
import { gameModes4 } from "@/utils/matchSettings";
import { useRouter } from "next/navigation";
import { useSetRecoilState } from "recoil";

const emptyGame = {
  t1Datas: [],
  t1TotalPoints: 0,
  t2Datas: [],
  t2TotalPoints: 0,
  t3Datas: [],
  t3TotalPoints: 0,
  t4Datas: [],
  t4TotalPoints: 0,
  winner: "none",
};

/** Clears the in-progress match and returns the form to its defaults. */
export default function EndMatchControl({ fullWidth = false }) {
  const router = useRouter();
  const setPlayersAmount = useSetRecoilState(playersAmountRecoil);
  const setRenderGamesModes = useSetRecoilState(renderGameModesRecoil);
  const setGameMode = useSetRecoilState(gameModeRecoil);
  const setDominoSet = useSetRecoilState(dominoSetRecoil);
  const setMaxPoints = useSetRecoilState(maxPointsRecoil);
  const setPlayer1 = useSetRecoilState(player1Recoil);
  const setPlayer2 = useSetRecoilState(player2Recoil);
  const setPlayer3 = useSetRecoilState(player3Recoil);
  const setPlayer4 = useSetRecoilState(player4Recoil);
  const setStartGame = useSetRecoilState(isGameStartedRecoil);
  const setWhoWon = useSetRecoilState(whoWonRecoil);
  const setCompletedGame = useSetRecoilState(completedGamesRecoil);
  const setCurrentGame = useSetRecoilState(currentGameRecoil);
  const setMatchDescription = useSetRecoilState(matchDescriptionRecoil);

  const handleCancelGame = () => {
    const defaultSet = getDominoSet(DEFAULT_DOMINO_SET_ID);

    setPlayersAmount(4);
    setRenderGamesModes(gameModes4);
    setGameMode({ label: "2 vs 2" });
    setDominoSet(defaultSet.id);
    setMaxPoints(defaultSet.defaultMaxPoints);

    setPlayer1("");
    setPlayer2("");
    setPlayer3("");
    setPlayer4("");

    setStartGame(false);
    setWhoWon("");
    setCompletedGame([]);
    setCurrentGame(emptyGame);
    setMatchDescription("");
    router.push("/");
  };

  return (
    <ConfirmDeleteMatch
      onCofirm={handleCancelGame}
      fullWidth={fullWidth}
      variant={fullWidth ? "outlined" : "text"}
    />
  );
}
