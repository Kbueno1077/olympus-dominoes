"use client";

import AddScoreDialog from "@/components/Dialogs/AddScoreDialog/AddScoreDialog";
import { useTranslation } from "@/i18n/useTranslation";
import { currentGameRecoil, gameEditionModeRecoil } from "@/recoil/recoilState";
import { Icon } from "@iconify/react";
import {
  Box,
  Card,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { activeTeamNumbers, TEAM_KEYS } from "@/utils/matchSettings";
import { useRecoilState } from "recoil";
import NoteHand from "./NoteHand";

function TeamColumn({
  teamNumber,
  hands,
  total,
  maxPoints,
  isWinner,
  isGameStarted,
  gameEditionMode,
  onRemoveHand,
  onAddScore,
  showLeftRule,
}) {
  const { t, teamName } = useTranslation();
  const teamKey = TEAM_KEYS[teamNumber];
  const hasOverflowed = total >= maxPoints;
  const progress = maxPoints > 0 ? Math.min((total / maxPoints) * 100, 100) : 0;

  return (
    <Box
      sx={{
        px: { xs: 1, sm: 1.75 },
        // The line down the middle of a paper scorepad.
        borderLeft: showLeftRule ? "1px solid" : "none",
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
            backgroundColor: (t) => t.palette[teamKey].main,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", lineHeight: 1 }}
        >
          {teamName(teamNumber)}
        </Typography>
        {isWinner && (
          <Icon
            icon="ant-design:trophy-filled"
            style={{ fontSize: 15, color: "#C08A2E" }}
          />
        )}
      </Stack>

      <Box sx={{ borderTop: "2px solid", borderColor: "divider", mb: 1.25 }} />

      {/* Hands, oldest first, each showing this hand and the running total */}
      <Box sx={{ flex: 1, minHeight: 32 }}>
        {hands.map((hand, index) => (
          <NoteHand
            key={`${teamNumber}-${index}-${hand}`}
            gameEditionMode={gameEditionMode}
            handleRemoveDataFromGame={onRemoveHand}
            index={index}
            teamDatas={hands}
            teamNumber={teamNumber}
          />
        ))}
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <AddScoreDialog
          addScore={onAddScore}
          disabled={hasOverflowed || !isGameStarted}
          teamNumber={teamNumber}
          teamKey={teamKey}
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
            team: teamName(teamNumber),
            points: maxPoints,
          })}
          sx={{
            mt: 0.75,
            height: 4,
            borderRadius: 2,
            backgroundColor: (t) => alpha(t.palette.grey[600], 0.18),
            "& .MuiLinearProgress-bar": {
              borderRadius: 2,
              backgroundColor: (t) =>
                hasOverflowed ? t.palette.warning.main : t.palette[teamKey].main,
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
  maxPoints,
}) {
  const { t } = useTranslation();
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

        <Tooltip title={gameEditionMode ? t("doneEditing") : t("editHands")}>
          <IconButton
            color={gameEditionMode ? "default" : "primary"}
            onClick={() => setGameEditionMode(!gameEditionMode)}
            aria-label={
              gameEditionMode ? t("stopEditingAria") : t("editHands")
            }
          >
            <Icon
              icon={
                gameEditionMode ? "ic:baseline-edit-off" : "ic:baseline-edit"
              }
              style={{ fontSize: 20 }}
            />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          rowGap: 3,
        }}
      >
        {teamNumbers.map((teamNumber, index) => (
          <TeamColumn
            key={teamNumber}
            teamNumber={teamNumber}
            hands={currentGame[`t${teamNumber}Datas`]}
            total={currentGame[`t${teamNumber}TotalPoints`]}
            maxPoints={numericMax}
            isWinner={whoWon === `Team ${teamNumber}`}
            isGameStarted={isGameStarted}
            gameEditionMode={gameEditionMode}
            onRemoveHand={handleRemoveDataFromGame}
            onAddScore={handleUpateScores}
            showLeftRule={index % 2 === 1}
          />
        ))}
      </Box>
    </Card>
  );
}
