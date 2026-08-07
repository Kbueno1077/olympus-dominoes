"use client";

import AddScoreDialog from "@/components/Dialogs/AddScoreDialog/AddScoreDialog";
import { useMatchTeamLabel } from "@/hooks/useMatchTeamLabel";
import { useTranslation } from "@/i18n/useTranslation";
import { currentGameRecoil, gameEditionModeRecoil } from "@/recoil/recoilState";
import { activeTeamNumbers, TEAM_KEYS, teamNumberFrom } from "@/utils/matchSettings";
import { Icon } from "@iconify/react";
import { ArrowForward } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useRecoilState } from "recoil";
import NoteHand from "./NoteHand";

function TeamColumn({
  teamNumber,
  teamLabel,
  hands,
  total,
  maxPoints,
  isWinner,
  gameOver,
  isGameStarted,
  gameEditionMode,
  onRemoveHand,
  onAddScore,
  index,
  columnCount,
}) {
  const { t } = useTranslation();
  const teamKey = TEAM_KEYS[teamNumber];
  const hasOverflowed = total >= maxPoints;
  const progress = maxPoints > 0 ? Math.min((total / maxPoints) * 100, 100) : 0;

  return (
    <Box
      sx={{
        px: { xs: 1, sm: 1.75 },
        // Two-column pad: rule on odd seats. Wide free-for-all: rule after first.
        borderLeft: {
          xs: index % 2 === 1 ? "1px solid" : "none",
          md:
            columnCount > 2
              ? index > 0
                ? "1px solid"
                : "none"
              : index % 2 === 1
                ? "1px solid"
                : "none",
        },
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={0.75}
        sx={{ mb: 1 }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: (theme) => theme.palette[teamKey].main,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", lineHeight: 1 }}
        >
          {teamLabel}
        </Typography>
        {isWinner && (
          <Icon
            icon="ant-design:trophy-filled"
            style={{ fontSize: 15, color: "#D4A017" }}
          />
        )}
      </Stack>

      <Box sx={{ borderTop: "2px solid", borderColor: "divider", mb: 1.25 }} />

      {/* Hands, oldest first, each showing this hand and the running total */}
      <Box sx={{ flex: 1, minHeight: 32 }}>
        {hands.map((hand, handIndex) => (
          <NoteHand
            key={`${teamNumber}-${handIndex}-${hand}`}
            gameEditionMode={gameEditionMode}
            handleRemoveDataFromGame={onRemoveHand}
            index={handIndex}
            teamDatas={hands}
            teamNumber={teamNumber}
          />
        ))}
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <AddScoreDialog
          addScore={onAddScore}
          disabled={gameOver || !isGameStarted}
          teamNumber={teamNumber}
          teamKey={teamKey}
          teamLabel={teamLabel}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Stack
          direction="row"
          alignItems="baseline"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("total")}
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 20,
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              color: hasOverflowed ? "warning.dark" : "text.primary",
            }}
          >
            {total}
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={progress}
          aria-label={t("progressAria", {
            team: teamLabel,
            points: maxPoints,
          })}
          sx={{
            mt: 0.75,
            height: 4,
            borderRadius: 2,
            backgroundColor: (theme) => alpha(theme.palette.grey[600], 0.18),
            "& .MuiLinearProgress-bar": {
              borderRadius: 2,
              backgroundColor: (theme) =>
                hasOverflowed
                  ? theme.palette.warning.main
                  : theme.palette[teamKey].main,
            },
          }}
        />
      </Box>
    </Box>
  );
}

export default function NoteMaker({
  isGameStarted,
  completedGames,
  gameMode,
  playersAmount,
  whoWon,
  handleUpateScores,
  handleNextGame,
  maxPoints,
}) {
  const { t } = useTranslation();
  const teamLabel = useMatchTeamLabel();
  const [gameEditionMode, setGameEditionMode] = useRecoilState(
    gameEditionModeRecoil
  );
  const [currentGame, setCurrentGame] = useRecoilState(currentGameRecoil);

  const handleRemoveDataFromGame = (teamNumber, index) => {
    const newCurrentGame = { ...currentGame };
    const teamDatasName = `t${teamNumber}Datas`;
    const teamTotalsName = `t${teamNumber}TotalPoints`;

    const newTeamTotalPoints =
      newCurrentGame[teamTotalsName] - newCurrentGame[teamDatasName][index];

    const frontPart = newCurrentGame[teamDatasName].slice(0, index);
    const lastPart = newCurrentGame[teamDatasName].slice(index + 1);

    newCurrentGame[teamTotalsName] = newTeamTotalPoints;
    newCurrentGame[teamDatasName] = [...frontPart, ...lastPart];

    setCurrentGame(newCurrentGame);
  };

  const isFreeForAll = gameMode?.label === "Free For All";
  const teamNumbers = activeTeamNumbers(playersAmount, isFreeForAll);
  const numericMax = Number(maxPoints);
  const columnCount = teamNumbers.length;
  const winningTeam = teamNumberFrom(whoWon);
  const gameOver = Boolean(whoWon);

  return (
    <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6" sx={{ color: "text.primary" }}>
            {t("gameNumber", { n: completedGames.length + 1 })}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("firstToPoints", { n: maxPoints })}
          </Typography>
        </Box>

        <Button
          size="small"
          variant={gameEditionMode ? "contained" : "outlined"}
          color={gameEditionMode ? "inherit" : "primary"}
          onClick={() => setGameEditionMode(!gameEditionMode)}
          aria-pressed={gameEditionMode}
        >
          {gameEditionMode ? t("doneEditing") : t("editHands")}
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          // Partner play stays as a classic two-column pad; free-for-all
          // spreads across the available width once the screen can take it.
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md:
              columnCount > 2
                ? `repeat(${columnCount}, minmax(0, 1fr))`
                : "repeat(2, minmax(0, 1fr))",
          },
          rowGap: 3,
        }}
      >
        {teamNumbers.map((teamNumber, index) => (
          <TeamColumn
            key={teamNumber}
            teamNumber={teamNumber}
            teamLabel={teamLabel(teamNumber)}
            hands={currentGame[`t${teamNumber}Datas`]}
            total={currentGame[`t${teamNumber}TotalPoints`]}
            maxPoints={numericMax}
            isWinner={whoWon === `Team ${teamNumber}`}
            gameOver={gameOver}
            isGameStarted={isGameStarted}
            gameEditionMode={gameEditionMode}
            onRemoveHand={handleRemoveDataFromGame}
            onAddScore={handleUpateScores}
            index={index}
            columnCount={columnCount}
          />
        ))}
      </Box>

      <Box
        sx={{
          mt: 2.5,
          pt: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 1.5 }}
        >
          {winningTeam
            ? t("teamReached", {
                team: teamLabel(winningTeam),
                points: maxPoints,
              })
            : t("waitingForTarget", { points: maxPoints })}
        </Typography>

        <Button
          onClick={handleNextGame}
          variant="contained"
          size="large"
          fullWidth
          disabled={!winningTeam}
          endIcon={<ArrowForward />}
          sx={{ minHeight: 48 }}
        >
          {t("nextGame")}
        </Button>
      </Box>
    </Card>
  );
}
