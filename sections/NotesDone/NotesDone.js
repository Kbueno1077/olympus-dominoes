"use client";

import ConfirmDeleteGame from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteGame";
import Note from "@/components/Notes/Note";
import {
  completedGamesRecoil,
  gameModeRecoil,
  playersAmountRecoil,
} from "@/recoil/recoilState";
import { useTranslation } from "@/i18n/useTranslation";
import { activeTeamNumbers, teamNumberFrom } from "@/utils/matchSettings";
import { Box, Card, Stack, Typography } from "@mui/material";
import { useRecoilState, useRecoilValue } from "recoil";

export default function NotesDone() {
  const { t, teamName } = useTranslation();
  const [completedGames, setCompletedGame] =
    useRecoilState(completedGamesRecoil);

  const playersAmount = useRecoilValue(playersAmountRecoil);
  const gameMode = useRecoilValue(gameModeRecoil);

  const removeGame = (index) => {
    const remaining = completedGames.filter((_, i) => i !== index);
    setCompletedGame(remaining);
  };

  const isFreeForAll = gameMode?.label === "Free For All";
  const teamNumbers = activeTeamNumbers(playersAmount, isFreeForAll);
  const columnCount = teamNumbers.length;

  return (
    <>
      {completedGames.map((game, gameIndex) => {
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
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="subtitle1" sx={{ color: "text.primary" }}>
                  {t("gameNumber", { n: gameIndex + 1 })}
                </Typography>
                {winningTeam && (
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {t("tookIt", { team: teamName(winningTeam) })}
                  </Typography>
                )}
              </Stack>

              <ConfirmDeleteGame onCofirm={removeGame} index={gameIndex} />
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
                borderTop: "2px solid",
                borderColor: "divider",
                pt: 1.5,
              }}
            >
              {teamNumbers.map((teamNumber, index) => (
                <Box
                  key={teamNumber}
                  sx={{
                    px: 1,
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
                  }}
                >
                  <Note
                    hands={game[`t${teamNumber}Datas`] ?? []}
                    isWinner={winningTeam === teamNumber}
                    teamNumber={teamNumber}
                  />
                </Box>
              ))}
            </Box>
          </Card>
        );
      })}
    </>
  );
}
