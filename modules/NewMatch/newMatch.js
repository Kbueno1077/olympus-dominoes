"use client";

import EndMatchControl from "@/components/Header/EndMatchControl";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { buildLiveMatchCompareLaunch } from "@/lib/analytics/compareLaunch";
import {
  completedGamesRecoil,
  currentGameRecoil,
  gameModeRecoil,
  isGameStartedRecoil,
  maxPointsRecoil,
  player1Recoil,
  player2Recoil,
  player3Recoil,
  player4Recoil,
  playersAmountRecoil,
  whoWonRecoil,
} from "@/recoil/recoilState";
import MatchSettings, {
  MatchSummary,
} from "@/sections/MatchSettings/MatchSettings";
import NoteMaker from "@/sections/NoteMaker/NoteMaker";
import NotesDone from "@/sections/NotesDone/NotesDone";
import TableDraw from "@/sections/TableDraw/TableDraw";
import { useTranslation } from "@/i18n/useTranslation";
import { useMatchTeamLabel } from "@/hooks/useMatchTeamLabel";
import {
  activeTeamNumbers,
  tallyPollosZapatos,
  tallyWins,
  TEAM_KEYS,
} from "@/utils/matchSettings";
import { PlayArrow } from "@mui/icons-material";
import { Box, Button, Card, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo } from "react";
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

function MatchStanding({ standings, shutouts, onOpenAnalytics }) {
  const { t } = useTranslation();
  const teamLabel = useMatchTeamLabel();
  const leaderWins = Math.max(0, ...standings.map((s) => s.wins));
  const shutoutByTeam = useMemo(
    () => new Map(shutouts.map((row) => [row.teamNumber, row])),
    [shutouts]
  );

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
          const marks = shutoutByTeam.get(teamNumber);

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
                borderColor: (theme) =>
                  isLeading
                    ? alpha(theme.palette[TEAM_KEYS[teamNumber]].main, 0.45)
                    : "divider",
                backgroundColor: (theme) =>
                  isLeading
                    ? alpha(theme.palette[TEAM_KEYS[teamNumber]].main, 0.08)
                    : "transparent",
              }}
            >
              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  fontVariantNumeric: "tabular-nums",
                  color: (theme) => theme.palette[TEAM_KEYS[teamNumber]].dark,
                }}
              >
                {wins}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {teamLabel(teamNumber)}
              </Typography>
              {marks ? (
                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 10,
                    lineHeight: 1.3,
                    color: "text.disabled",
                  }}
                >
                  {marks.pollosFor}
                  {t("pollo").charAt(0)} · {marks.zapatosFor}
                  {t("zapato").charAt(0)}
                </Typography>
              ) : null}
            </Box>
          );
        })}
      </Stack>

      <Box
        sx={{
          my: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      />
      <MatchSummary />

      <Stack spacing={1} sx={{ mt: 1.5 }}>
        {onOpenAnalytics ? (
          <Button
            variant="outlined"
            fullWidth
            onClick={onOpenAnalytics}
          >
            {t("matchAnalytics")}
          </Button>
        ) : null}
        <EndMatchControl fullWidth />
      </Stack>
    </Card>
  );
}

export default function NewMatch({ onOpenAnalytics }) {
  const displayToast = useToast();
  const { t } = useTranslation();
  const { data, setPendingCompare } = useAnalytics();

  const [playersAmount] = useRecoilState(playersAmountRecoil);
  const [gameMode] = useRecoilState(gameModeRecoil);
  const [maxPoints] = useRecoilState(maxPointsRecoil);

  const [player1] = useRecoilState(player1Recoil);
  const [player2] = useRecoilState(player2Recoil);
  const [player3] = useRecoilState(player3Recoil);
  const [player4] = useRecoilState(player4Recoil);

  const [isGameStarted, setStartGame] = useRecoilState(isGameStartedRecoil);
  const [whoWon, setWhoWon] = useRecoilState(whoWonRecoil);
  const [completedGames, setCompletedGame] =
    useRecoilState(completedGamesRecoil);
  const [currentGame, setCurrentGame] = useRecoilState(currentGameRecoil);

  const handleWhoWon = (winner) => {
    setWhoWon(winner);
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

  const handleOpenAnalytics = () => {
    if (!data) {
      displayToast(t("toastMatchAnalyticsNeedImport"), "error");
      onOpenAnalytics?.();
      return;
    }
    const players = [player1, player2, player3, player4];
    const launch = buildLiveMatchCompareLaunch({
      data,
      playersAmount,
      modeLabel: gameMode?.label ?? "",
      players,
    });
    if (!launch) {
      displayToast(t("toastMatchAnalyticsNeedRoster"), "error");
      return;
    }
    setPendingCompare(launch);
    onOpenAnalytics?.();
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
  const shutouts = tallyPollosZapatos(completedGames, teamNumbers);

  return (
    <Box
      sx={{
        maxWidth: isGameStarted ? 920 : 1280,
        mx: "auto",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: { xs: 1.75, md: 2 },
          alignItems: "start",
          gridTemplateColumns: {
            xs: "1fr",
            md: isGameStarted
              ? "minmax(0, 1fr) minmax(260px, 320px)"
              : "minmax(0, 1.15fr) minmax(300px, 0.85fr)",
          },
        }}
      >
        {/* Primary column: scorepad in play, setup form before kickoff */}
        {isGameStarted ? (
          <Stack spacing={1.75}>
            <MatchStanding
              standings={standings}
              shutouts={shutouts}
              onOpenAnalytics={handleOpenAnalytics}
            />

            <NoteMaker
              isGameStarted={isGameStarted}
              gameMode={gameMode}
              playersAmount={playersAmount}
              completedGames={completedGames}
              whoWon={whoWon}
              maxPoints={maxPoints}
              handleUpateScores={handleUpateScores}
              handleNextGame={handleNextGame}
            />

            <NotesDone />
          </Stack>
        ) : (
          <Stack spacing={1.75}>
            <MatchSettings />

            <Button
              onClick={handleStartGame}
              variant="contained"
              size="large"
              fullWidth
              startIcon={<PlayArrow />}
            >
              {t("startPlaying")}
            </Button>
          </Stack>
        )}

        {/* Sidebar: table seating stays visible during setup and play */}
        <Stack
          spacing={1.75}
          sx={{
            position: { md: "sticky" },
            top: { md: 80 },
          }}
        >
          <TableDraw />
        </Stack>
      </Box>
    </Box>
  );
}
