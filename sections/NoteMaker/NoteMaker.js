"use client";

import AddScoreDialog from "@/components/Dialogs/AddScoreDialog/AddScoreDialog";
import PadColumn from "@/components/Notes/PadColumn";
import { useMatchTeamLabel } from "@/hooks/useMatchTeamLabel";
import { useTranslation } from "@/i18n/useTranslation";
import { FONT_HAND } from "@/muiTheme/typography";
import { useMatchStore } from "@/lib/matchStore";
import { activeTeamNumbers, TEAM_KEYS, teamNumberFrom } from "@/utils/matchSettings";
import { Icon } from "@iconify/react";
import { ArrowForward } from "@mui/icons-material";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import {
  Box,
  Button,
  Card,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import NoteHand from "./NoteHand";

function TeamColumn({
  teamNumber,
  teamLabel,
  hands,
  taken,
  total,
  maxPoints,
  isWinner,
  gameOver,
  isGameStarted,
  gameEditionMode,
  onRemoveHand,
  onAddScore,
  index,
}) {
  const teamKey = TEAM_KEYS[teamNumber];
  const hasOverflowed = total >= maxPoints;
  const showAdd = isGameStarted && !gameOver && !gameEditionMode;

  const header = (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={0.75}
      sx={{ minHeight: 22 }}
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
        component="span"
        sx={{
          fontFamily: FONT_HAND,
          fontSize: 20,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "0.02em",
          textTransform: "none",
          color: "text.primary",
        }}
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
  );

  return (
    <PadColumn index={index} header={header}>
      <Box sx={{ minHeight: 28 }}>
        {hands.map((hand, handIndex) => (
          <NoteHand
            key={`${teamNumber}-${handIndex}-${hand}`}
            gameEditionMode={gameEditionMode}
            handleRemoveDataFromGame={onRemoveHand}
            index={handIndex}
            teamDatas={hands}
            takenOrder={taken?.[handIndex]}
            teamNumber={teamNumber}
            isLast={handIndex === hands.length - 1}
            overflowed={hasOverflowed}
            ruled={showAdd}
          />
        ))}
        {showAdd ? (
          <AddScoreDialog
            addScore={onAddScore}
            teamNumber={teamNumber}
            teamKey={teamKey}
            teamLabel={teamLabel}
          />
        ) : null}
      </Box>
    </PadColumn>
  );
}

export default function NoteMaker({
  isGameStarted,
  completedGames,
  gameMode,
  playersAmount,
  whoWon,
  handleUpateScores,
  handleRemoveHand,
  handleNextGame,
  maxPoints,
}) {
  const { t } = useTranslation();
  const teamLabel = useMatchTeamLabel();
  const gameEditionMode = useMatchStore((s) => s.gameEditionMode);
  const setGameEditionMode = useMatchStore((s) => s.setGameEditionMode);
  const currentGame = useMatchStore((s) => s.currentGame);

  const isFreeForAll = gameMode?.label === "Free For All";
  const teamNumbers = activeTeamNumbers(playersAmount, isFreeForAll);
  const numericMax = Number(maxPoints);
  const columnCount = teamNumbers.length;
  const winningTeam = teamNumberFrom(whoWon);
  const gameOver = Boolean(whoWon);

  return (
    <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Typography variant="h6" sx={{ color: "text.primary", mb: 2 }}>
          {t("gameNumber", { n: completedGames.length + 1 })}
        </Typography>

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
            taken={currentGame[`t${teamNumber}Taken`] ?? []}
            total={currentGame[`t${teamNumber}TotalPoints`]}
            maxPoints={numericMax}
            isWinner={whoWon === `Team ${teamNumber}`}
            gameOver={gameOver}
            isGameStarted={isGameStarted}
            gameEditionMode={gameEditionMode}
            onRemoveHand={handleRemoveHand}
            onAddScore={handleUpateScores}
            index={index}
          />
        ))}
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          mt: 1.5,
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", minWidth: 0, flex: 1 }}
        >
          {winningTeam
            ? t("teamReached", {
                team: teamLabel(winningTeam),
                points: maxPoints,
              })
            : t("waitingForTarget", { points: maxPoints })}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexShrink: 0 }}>
          <Tooltip title={gameEditionMode ? t("doneEditing") : t("editHands")}>
            <IconButton
              size="small"
              color={gameEditionMode ? "primary" : "default"}
              onClick={() => setGameEditionMode(!gameEditionMode)}
              aria-pressed={gameEditionMode}
              aria-label={gameEditionMode ? t("doneEditing") : t("editHands")}
              sx={{
                width: 34,
                height: 34,
                border: "1px solid",
                borderColor: (theme) =>
                  gameEditionMode
                    ? alpha(theme.palette.primary.main, 0.45)
                    : "divider",
                backgroundColor: (theme) =>
                  gameEditionMode
                    ? alpha(theme.palette.primary.main, 0.14)
                    : "transparent",
                borderRadius: 1,
              }}
            >
              {gameEditionMode ? (
                <CheckOutlined fontSize="small" />
              ) : (
                <EditNoteOutlined fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          {winningTeam ? (
            <Button
              onClick={handleNextGame}
              variant="contained"
              size="small"
              endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
              sx={{
                height: 34,
                minHeight: 34,
                py: 0,
                px: 1.25,
              }}
            >
              {t("nextGame")}
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  );
}
