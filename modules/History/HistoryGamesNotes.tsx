"use client";

import Note from "@/components/Notes/Note";
import { seatNamesFromSeats, type HistoryGame } from "@/lib/analytics/history";
import { useTranslation } from "@/i18n/useTranslation";
import {
  activeTeamNumbers,
  teamNumberFrom,
} from "@/utils/matchSettings";
import { teamInitialLabelsByNumber } from "@/utils/teams";
import { Box, Card, Stack, Typography } from "@mui/material";
import { useMemo } from "react";

type Props = {
  games: HistoryGame[];
  playersAmount: number;
  modeLabel: string;
  seatNames: string[];
};

/**
 * Read-only completed-game notes for imported history (newest first).
 */
export default function HistoryGamesNotes({
  games,
  playersAmount,
  modeLabel,
  seatNames,
}: Props) {
  const { t, teamName } = useTranslation();
  const isFreeForAll = modeLabel === "Free For All";
  const teamNumbers = activeTeamNumbers(playersAmount, isFreeForAll);
  const columnCount = teamNumbers.length;

  const labelFor = (teamNumber: number, game: HistoryGame) => {
    const names =
      game.seats.length > 0 ? seatNamesFromSeats(game.seats) : seatNames;
    const labels = teamInitialLabelsByNumber(
      playersAmount,
      modeLabel,
      names
    ) as Record<number, string>;
    return labels[teamNumber] || teamName(teamNumber);
  };

  const ordered = useMemo(
    () =>
      games
        .map((game, index) => ({ game, index }))
        .slice()
        .reverse(),
    [games]
  );

  return (
    <Stack spacing={1.75}>
      {ordered.map(({ game, index: gameIndex }) => {
        const winningTeam = teamNumberFrom(game.winner);

        return (
          <Card
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
              {winningTeam ? (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("tookIt", { team: labelFor(winningTeam, game) })}
                </Typography>
              ) : null}
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
                    hands={
                      (game[
                        `t${teamNumber}Datas` as keyof HistoryGame
                      ] as number[]) ?? []
                    }
                    taken={
                      (game[
                        `t${teamNumber}Taken` as keyof HistoryGame
                      ] as number[]) ?? []
                    }
                    isWinner={winningTeam === teamNumber}
                    teamNumber={teamNumber}
                    label={labelFor(teamNumber, game)}
                  />
                </Box>
              ))}
            </Box>
          </Card>
        );
      })}
    </Stack>
  );
}
