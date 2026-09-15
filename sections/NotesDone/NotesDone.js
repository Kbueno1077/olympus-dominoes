"use client";

import ConfirmDeleteGame from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteGame";
import Note from "@/components/Notes/Note";
import { useMatchTeamLabel } from "@/hooks/useMatchTeamLabel";
import { useMatchStore } from "@/lib/matchStore";
import { useTranslation } from "@/i18n/useTranslation";
import { activeTeamNumbers, teamNumberFrom } from "@/utils/matchSettings";
import { Box, Card, Stack, Typography } from "@mui/material";
import { useMemo } from "react";

export default function NotesDone() {
  const { t } = useTranslation();
  const teamLabel = useMatchTeamLabel();
  const completedGames = useMatchStore((s) => s.completedGames);
  const setCompletedGame = useMatchStore((s) => s.setCompletedGame);

  const playersAmount = useMatchStore((s) => s.playersAmount);
  const gameMode = useMatchStore((s) => s.gameMode);

  const removeGame = (index) => {
    const remaining = completedGames.filter((_, i) => i !== index);
    setCompletedGame(remaining);
  };

  const isFreeForAll = gameMode?.label === "Free For All";
  const teamNumbers = activeTeamNumbers(playersAmount, isFreeForAll);
  const columnCount = teamNumbers.length;

  // Most recent completed game first; keep original index for numbering/delete.
  const ordered = useMemo(
    () =>
      completedGames
        .map((game, index) => ({ game, index }))
        .slice()
        .reverse(),
    [completedGames]
  );

  return (
    <>
      {ordered.map(({ game, index: gameIndex }) => {
        const winningTeam = teamNumberFrom(game.winner);

        return (
          <Card
            // Completed games carry no id, so position is the only stable key.
            key={`game-${gameIndex}`}
            sx={{
              p: { xs: 2, sm: 2.5 },
              backgroundColor: "background.neutral",
            }}
          >
            <Stack
              direction="row"
              alignItems="baseline"
              spacing={1}
              sx={{ mb: 1.5 }}
            >
              <Typography variant="subtitle1" sx={{ color: "text.primary" }}>
                {t("gameNumber", { n: gameIndex + 1 })}
              </Typography>
              {winningTeam && (
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary" }}
                >
                  {t("tookIt", { team: teamLabel(winningTeam) })}
                </Typography>
              )}
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md:
                    columnCount > 2
                      ? `repeat(${columnCount}, minmax(0, 1fr))`
                      : "repeat(2, minmax(0, 1fr))",
                },
                rowGap: 2,
                pt: 0.5,
              }}
            >
              {teamNumbers.map((teamNumber, index) => (
                <Note
                  key={teamNumber}
                  index={index}
                  hands={game[`t${teamNumber}Datas`] ?? []}
                  taken={game[`t${teamNumber}Taken`] ?? []}
                  isWinner={winningTeam === teamNumber}
                  teamNumber={teamNumber}
                  label={teamLabel(teamNumber)}
                />
              ))}
            </Box>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="flex-end"
              sx={{ mt: 1.5 }}
            >
              <ConfirmDeleteGame onCofirm={removeGame} index={gameIndex} />
            </Stack>
          </Card>
        );
      })}
    </>
  );
}
