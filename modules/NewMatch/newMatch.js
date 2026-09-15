"use client";

import EndMatchControl from "@/components/Header/EndMatchControl";
import { useMatchStore } from "@/lib/matchStore";
import MatchSettings, {
  MatchSummary,
} from "@/sections/MatchSettings/MatchSettings";
import NoteMaker from "@/sections/NoteMaker/NoteMaker";
import NotesDone from "@/sections/NotesDone/NotesDone";
import TableDraw from "@/sections/TableDraw/TableDraw";
import { useTranslation } from "@/i18n/useTranslation";
import { useMatchTeamFullLabel } from "@/hooks/useMatchTeamLabel";
import { FONT_SCORE } from "@/muiTheme/typography";
import {
  activeTeamNumbers,
  addHandToGame,
  emptyGame,
  removeHandFromGame,
  tallyPollosZapatos,
  tallyWins,
  TEAM_KEYS,
  winnerFromGameTotals,
} from "@/utils/matchSettings";
import { Box, Card, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import useToast from "@/hooks/useToast";

function MarkStat({ label, value, live, align = "left" }) {
  return (
    <Box sx={{ textAlign: align, minWidth: 44 }}>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: "text.secondary",
          letterSpacing: "0.04em",
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.25,
          fontFamily: FONT_SCORE,
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.2,
          fontVariantNumeric: "tabular-nums",
          color: live ? "text.primary" : "text.disabled",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function ShutoutMarks({ marks, justify = "flex-start" }) {
  const { t } = useTranslation();
  const pollos = marks?.pollosFor ?? 0;
  const zapatos = marks?.zapatosFor ?? 0;
  const align = justify === "flex-end" ? "right" : "left";

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent={justify}
      sx={{ mt: 1 }}
    >
      <MarkStat
        label={t("pollo")}
        value={pollos}
        live={pollos > 0}
        align={align}
      />
      <MarkStat
        label={t("zapato")}
        value={zapatos}
        live={zapatos > 0}
        align={align}
      />
    </Stack>
  );
}

function TeamDot({ teamNumber }) {
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        flexShrink: 0,
        backgroundColor: (theme) => theme.palette[TEAM_KEYS[teamNumber]].main,
      }}
    />
  );
}

function WinsFigure({ teamNumber, wins, trailing }) {
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: FONT_SCORE,
        fontSize: { xs: 28, sm: 34 },
        fontWeight: 700,
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        color: (theme) => {
          const ink = theme.palette[TEAM_KEYS[teamNumber]].dark;
          return trailing ? alpha(ink, 0.42) : ink;
        },
      }}
    >
      {wins}
    </Typography>
  );
}

function StandingName({ teamNumber, label, trailing, marks, align }) {
  const isRight = align === "right";

  return (
    <Box sx={{ minWidth: 0, textAlign: isRight ? "right" : "left" }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.85}
        sx={{ justifyContent: isRight ? "flex-end" : "flex-start" }}
      >
        {!isRight ? <TeamDot teamNumber={teamNumber} /> : null}
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 15,
            lineHeight: 1.35,
            color: (theme) =>
              trailing
                ? "text.secondary"
                : theme.palette[TEAM_KEYS[teamNumber]].dark,
          }}
        >
          {label}
        </Typography>
        {isRight ? <TeamDot teamNumber={teamNumber} /> : null}
      </Stack>
      <ShutoutMarks
        marks={marks}
        justify={isRight ? "flex-end" : "flex-start"}
      />
    </Box>
  );
}

function StandingRows({ standings, teamLabel, hasLead, leaderWins, shutoutByTeam }) {
  return (
    <Stack spacing={1.75} divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
      {standings.map(({ teamNumber, wins }) => {
        const trailing = hasLead && wins < leaderWins;

        return (
          <Stack
            key={teamNumber}
            direction="row"
            alignItems="flex-start"
            spacing={1.5}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={0.85}>
                <TeamDot teamNumber={teamNumber} />
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: 15,
                    lineHeight: 1.35,
                    color: (theme) =>
                      trailing
                        ? "text.secondary"
                        : theme.palette[TEAM_KEYS[teamNumber]].dark,
                  }}
                >
                  {teamLabel(teamNumber)}
                </Typography>
              </Stack>
              <ShutoutMarks marks={shutoutByTeam.get(teamNumber)} />
            </Box>
            <WinsFigure
              teamNumber={teamNumber}
              wins={wins}
              trailing={trailing}
            />
          </Stack>
        );
      })}
    </Stack>
  );
}

function MatchStanding({ standings, shutouts }) {
  const { t } = useTranslation();
  const teamLabel = useMatchTeamFullLabel();
  const leaderWins = Math.max(0, ...standings.map((s) => s.wins));
  const hasLead = leaderWins > 0;
  const isPair = standings.length === 2;
  const shutoutByTeam = useMemo(
    () => new Map(shutouts.map((row) => [row.teamNumber, row])),
    [shutouts]
  );
  const [left, right] = standings;

  return (
    <Card sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2.25 } }} aria-label={t("matchStanding")}>
      {isPair ? (
        <>
          <Box
            sx={{
              display: { xs: "none", sm: "grid" },
              gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
              alignItems: "start",
              columnGap: 2.5,
            }}
          >
            <StandingName
              teamNumber={left.teamNumber}
              label={teamLabel(left.teamNumber)}
              trailing={hasLead && left.wins < leaderWins}
              marks={shutoutByTeam.get(left.teamNumber)}
              align="left"
            />
            <Stack
              direction="row"
              alignItems="baseline"
              spacing={1.25}
              sx={{ px: 0.5, pt: 0.15 }}
            >
              <WinsFigure
                teamNumber={left.teamNumber}
                wins={left.wins}
                trailing={hasLead && left.wins < leaderWins}
              />
              <Typography
                component="span"
                sx={{
                  color: "text.disabled",
                  fontSize: 20,
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                –
              </Typography>
              <WinsFigure
                teamNumber={right.teamNumber}
                wins={right.wins}
                trailing={hasLead && right.wins < leaderWins}
              />
            </Stack>
            <StandingName
              teamNumber={right.teamNumber}
              label={teamLabel(right.teamNumber)}
              trailing={hasLead && right.wins < leaderWins}
              marks={shutoutByTeam.get(right.teamNumber)}
              align="right"
            />
          </Box>
          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            <StandingRows
              standings={standings}
              teamLabel={teamLabel}
              hasLead={hasLead}
              leaderWins={leaderWins}
              shutoutByTeam={shutoutByTeam}
            />
          </Box>
        </>
      ) : (
        <StandingRows
          standings={standings}
          teamLabel={teamLabel}
          hasLead={hasLead}
          leaderWins={leaderWins}
          shutoutByTeam={shutoutByTeam}
        />
      )}

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          mt: 2,
          pt: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          flexWrap: "wrap",
          rowGap: 1,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <MatchSummary includeTeams={false} />
        </Box>
        <EndMatchControl />
      </Stack>
    </Card>
  );
}

export default function NewMatch() {
  const displayToast = useToast();
  const { t } = useTranslation();

  const {
    playersAmount,
    gameMode,
    maxPoints,
    player1,
    player2,
    player3,
    player4,
    isGameStarted,
    setStartGame,
    whoWon,
    setWhoWon,
    completedGames,
    setCompletedGame,
    currentGame,
    setCurrentGame,
  } = useMatchStore(
    useShallow((s) => ({
      playersAmount: s.playersAmount,
      gameMode: s.gameMode,
      maxPoints: s.maxPoints,
      player1: s.player1,
      player2: s.player2,
      player3: s.player3,
      player4: s.player4,
      isGameStarted: s.isGameStarted,
      setStartGame: s.setStartGame,
      whoWon: s.whoWon,
      setWhoWon: s.setWhoWon,
      completedGames: s.completedGames,
      setCompletedGame: s.setCompletedGame,
      currentGame: s.currentGame,
      setCurrentGame: s.setCurrentGame,
    }))
  );

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

    // Close as recorded — keep real hand scores and totals (including
    // overshoot past the target). Do not invent a pad hand to force the
    // column to the target (same as the mobile app).
    const convertedGame = {
      ...tempCurrentGame,
      winner: whoWon,
    };

    setCompletedGame([...completedGames, convertedGame]);
    setCurrentGame(emptyGame);
    setWhoWon("");
  };

  const liveTeams = () =>
    activeTeamNumbers(playersAmount, gameMode?.label === "Free For All");

  const syncWinnerFromGame = (game) => {
    setWhoWon(winnerFromGameTotals(game, Number(maxPoints), liveTeams()));
  };

  const handleUpateScores = (scoreText, teamNumber) => {
    const next = addHandToGame(currentGame, teamNumber, Number(scoreText));
    setCurrentGame(next);
    syncWinnerFromGame(next);
  };

  const handleRemoveHand = (teamNumber, index) => {
    const next = removeHandFromGame(currentGame, teamNumber, index);
    setCurrentGame(next);
    syncWinnerFromGame(next);
  };

  const isFreeForAll = gameMode?.label === "Free For All";
  const teamNumbers = activeTeamNumbers(playersAmount, isFreeForAll);
  const standings = tallyWins(completedGames, teamNumbers);
  const shutouts = tallyPollosZapatos(completedGames, teamNumbers);

  return (
    <Box
      sx={{
        maxWidth: isGameStarted ? 1120 : 1280,
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
              ? "minmax(0, 1.1fr) minmax(360px, 1fr)"
              : "minmax(0, 1.15fr) minmax(300px, 0.85fr)",
          },
        }}
      >
        {isGameStarted ? (
          <Stack spacing={1.75}>
            <MatchStanding standings={standings} shutouts={shutouts} />

            <NoteMaker
              isGameStarted={isGameStarted}
              gameMode={gameMode}
              playersAmount={playersAmount}
              completedGames={completedGames}
              whoWon={whoWon}
              maxPoints={maxPoints}
              handleUpateScores={handleUpateScores}
              handleRemoveHand={handleRemoveHand}
              handleNextGame={handleNextGame}
            />

            <NotesDone />
          </Stack>
        ) : (
          <Stack spacing={1.75}>
            <MatchSettings onStart={handleStartGame} />
          </Stack>
        )}

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
