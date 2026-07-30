"use client";

import ConfirmDeleteMatch from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteMatch";
import {
  completedGamesRecoil,
  currentGameRecoil,
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
import MatchSettings from "@/sections/MatchSettings/MatchSettings";
import NoteMaker from "@/sections/NoteMaker/NoteMaker";
import NotesDone from "@/sections/NotesDone/NotesDone";
import TableDraw from "@/sections/TableDraw/TableDraw";
import { useTranslation } from "@/i18n/useTranslation";
import {
  activeTeamNumbers,
  gameModes4,
  TEAM_KEYS,
  teamNumberFrom,
} from "@/utils/matchSettings";
import { ArrowBack, ArrowForward, PlayArrow } from "@mui/icons-material";
import { Box, Button, Card, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useRecoilState } from "recoil";
import useToast from "@/hooks/useToast";

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

/** Games won so far, so the match standing is visible without counting cards. */
function tallyWins(completedGames, teamNumbers) {
  return teamNumbers.map((teamNumber) => ({
    teamNumber,
    wins: completedGames.filter(
      (game) => game.winner === `Team ${teamNumber}`
    ).length,
  }));
}

function MatchStanding({ standings }) {
  const { t, teamName } = useTranslation();
  const leaderWins = Math.max(...standings.map((s) => s.wins));

  return (
    <Card sx={{ p: 2 }}>
      <Typography
        variant="overline"
        component="p"
        sx={{ color: "text.secondary", mb: 1.25 }}
      >
        {t("matchStanding")}
      </Typography>
      <Stack direction="row" spacing={1}>
        {standings.map(({ teamNumber, wins }) => {
          const isLeading = wins > 0 && wins === leaderWins;

          return (
            <Box
              key={teamNumber}
              sx={{
                flex: 1,
                minWidth: 0,
                textAlign: "center",
                py: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: (t) =>
                  isLeading
                    ? alpha(t.palette[TEAM_KEYS[teamNumber]].main, 0.45)
                    : "divider",
                backgroundColor: (t) =>
                  isLeading
                    ? alpha(t.palette[TEAM_KEYS[teamNumber]].main, 0.08)
                    : "transparent",
              }}
            >
              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  fontVariantNumeric: "tabular-nums",
                  color: (t) => t.palette[TEAM_KEYS[teamNumber]].dark,
                }}
              >
                {wins}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {teamName(teamNumber)}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}

export default function NewMatch({ onBackToDashboard }) {
  const displayToast = useToast();
  const { t, teamName } = useTranslation();

  const [playersAmount, setPlayersAmount] = useRecoilState(playersAmountRecoil);
  const [, setRenderGamesModes] = useRecoilState(renderGameModesRecoil);
  const [gameMode, setGameMode] = useRecoilState(gameModeRecoil);
  const [maxPoints, setMaxPoints] = useRecoilState(maxPointsRecoil);

  const [player1, setPlayer1] = useRecoilState(player1Recoil);
  const [player2, setPlayer2] = useRecoilState(player2Recoil);
  const [player3, setPlayer3] = useRecoilState(player3Recoil);
  const [player4, setPlayer4] = useRecoilState(player4Recoil);

  const [isGameStarted, setStartGame] = useRecoilState(isGameStartedRecoil);
  const [whoWon, setWhoWon] = useRecoilState(whoWonRecoil);
  const [completedGames, setCompletedGame] =
    useRecoilState(completedGamesRecoil);
  const [currentGame, setCurrentGame] = useRecoilState(currentGameRecoil);
  const [, setMatchDescription] = useRecoilState(matchDescriptionRecoil);

  const handleWhoWon = (winner) => {
    setWhoWon(winner);
  };

  const handleCancelGame = () => {
    setPlayersAmount(4);
    setRenderGamesModes(gameModes4);
    setGameMode({ label: "2 vs 2" });
    setMaxPoints(150);

    setPlayer1("");
    setPlayer2("");
    setPlayer3("");
    setPlayer4("");

    setStartGame(false);
    setWhoWon("");
    setCompletedGame([]);
    setCurrentGame(emptyGame);
    setMatchDescription("");
  };

  const handleStartGame = () => {
    const layout = [player1, player2, player3, player4].filter((item) => item);

    if (layout.length < playersAmount) {
      displayToast(
        t("toastMissingPlayers", {
          expected: playersAmount,
          present: layout.length,
        }),
        "error"
      );
      return;
    }

    setStartGame(true);
  };

  const handleNextGame = () => {
    const tempCurrentGame = { ...currentGame };

    if (whoWon === "") {
      displayToast(t("toastNeedWinner"), "error");
      return;
    }

    const arrayOfPoints = [
      tempCurrentGame.t1TotalPoints,
      tempCurrentGame.t2TotalPoints,
      tempCurrentGame.t3TotalPoints,
      tempCurrentGame.t4TotalPoints,
    ];

    if (arrayOfPoints.filter((item) => item >= maxPoints).length > 1) {
      displayToast(t("toastTooManyOverTarget"), "error");
      return;
    }

    const t1Datas = [...currentGame.t1Datas];
    const t2Datas = [...currentGame.t2Datas];
    const t3Datas = [...currentGame.t3Datas];
    const t4Datas = [...currentGame.t4Datas];

    const newCompletedGames = [...completedGames];

    tempCurrentGame.winner = whoWon;
    if (whoWon === "Team 1") {
      t1Datas.push(maxPoints - tempCurrentGame.t1TotalPoints);
    }
    if (whoWon === "Team 2") {
      t2Datas.push(maxPoints - tempCurrentGame.t2TotalPoints);
    }
    if (whoWon === "Team 3") {
      t3Datas.push(maxPoints - tempCurrentGame.t3TotalPoints);
    }
    if (whoWon === "Team 4") {
      t4Datas.push(maxPoints - tempCurrentGame.t4TotalPoints);
    }

    const convertedGame = {
      ...tempCurrentGame,
      t1Datas,
      t2Datas,
      t3Datas,
      t4Datas,
    };

    newCompletedGames.push(convertedGame);
    setCompletedGame(newCompletedGames);
    setCurrentGame(emptyGame);
    setWhoWon("");
  };

  const handleUpateScores = (scoreText, teamNumber) => {
    const score = Number(scoreText);
    const teamNumberTotalPoints = `t${teamNumber}TotalPoints`;
    const teamNumberHands = `t${teamNumber}Datas`;

    if (currentGame[teamNumberTotalPoints] + score >= maxPoints) {
      handleWhoWon(`Team ${teamNumber}`);
    }

    setCurrentGame((prev) => ({
      ...prev,
      [teamNumberHands]: [...prev[teamNumberHands], score],
      [teamNumberTotalPoints]: prev[teamNumberTotalPoints] + score,
    }));
  };

  const isFreeForAll = gameMode?.label === "Free For All";
  const teamNumbers = activeTeamNumbers(playersAmount, isFreeForAll);
  const standings = tallyWins(completedGames, teamNumbers);
  const winningTeam = teamNumberFrom(whoWon);

  return (
    <Box sx={{ maxWidth: 1120, mx: "auto", width: "100%" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={onBackToDashboard}
          color="inherit"
          sx={{ color: "text.secondary" }}
        >
          {t("dashboard")}
        </Button>

        {isGameStarted && <ConfirmDeleteMatch onCofirm={handleCancelGame} />}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          alignItems: "start",
          gridTemplateColumns: {
            xs: "1fr",
            lg: isGameStarted ? "repeat(2, minmax(0, 1fr))" : "1fr",
          },
          maxWidth: isGameStarted ? "none" : 540,
          mx: isGameStarted ? 0 : "auto",
        }}
      >
        {/* SCOREPAD */}
        {isGameStarted && (
          <Stack spacing={2}>
            {completedGames.length > 0 && (
              <MatchStanding standings={standings} />
            )}

            <NoteMaker
              isGameStarted={isGameStarted}
              gameMode={gameMode}
              playersAmount={playersAmount}
              completedGames={completedGames}
              whoWon={whoWon}
              maxPoints={maxPoints}
              handleUpateScores={handleUpateScores}
            />

            <Card sx={{ p: 2 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
              >
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {winningTeam
                    ? t("teamReached", {
                        team: teamName(winningTeam),
                        points: maxPoints,
                      })
                    : t("waitingForTarget", { points: maxPoints })}
                </Typography>

                <Button
                  onClick={handleNextGame}
                  variant="contained"
                  endIcon={<ArrowForward />}
                  sx={{ flexShrink: 0 }}
                >
                  {t("nextGame")}
                </Button>
              </Stack>
            </Card>

            <NotesDone />
          </Stack>
        )}

        {/* SETUP */}
        <Stack spacing={2}>
          <MatchSettings />

          {!isGameStarted && (
            <Button
              onClick={handleStartGame}
              variant="contained"
              size="large"
              fullWidth
              startIcon={<PlayArrow />}
            >
              {t("startPlaying")}
            </Button>
          )}

          <TableDraw />
        </Stack>
      </Box>
    </Box>
  );
}
