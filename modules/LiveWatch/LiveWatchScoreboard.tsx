"use client";

import { FONT_HAND } from "@/muiTheme/typography";
import { TEAM_TINT } from "@/modules/Play/PlayChain";
import type { LiveWatchGame, LiveWatchSnapshot } from "@/lib/liveWatch/types";
import { activeTeamNumbers, tallyPollosZapatos, tallyWins } from "@/utils/matchSettings";
import { FREE_FOR_ALL, teamInitialLabelsByNumber } from "@/utils/teams";
import { stripTrailingPadHands } from "@/lib/analytics/hands";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

function teamNumbersFor(snapshot: LiveWatchSnapshot): number[] {
  return activeTeamNumbers(
    snapshot.playersAmount,
    snapshot.modeLabel === FREE_FOR_ALL
  );
}

function labelsFor(snapshot: LiveWatchSnapshot): Record<number, string> {
  const fromTeams: Record<number, string> = {};
  for (const team of snapshot.teams ?? []) {
    fromTeams[team.teamNumber] = team.label;
  }
  if (Object.keys(fromTeams).length > 0) return fromTeams;
  return teamInitialLabelsByNumber(
    snapshot.playersAmount,
    snapshot.modeLabel,
    snapshot.currentSeats ?? []
  ) as Record<number, string>;
}

function HandRows({
  hands,
  taken,
}: {
  hands: number[];
  taken: number[];
}) {
  const cleaned = stripTrailingPadHands(hands);
  let running = 0;
  return (
    <Box sx={{ flex: 1, minHeight: 32 }}>
      {cleaned.map((pts, handIndex) => {
        const isFirst = handIndex === 0;
        running += pts;
        const order = taken[handIndex] ?? 0;
        return (
          <Stack
            key={`${handIndex}-${pts}`}
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{
              py: 0.35,
              fontVariantNumeric: "tabular-nums",
              borderBottom: "1px dashed",
              borderColor: "divider",
            }}
          >
            {order > 0 ? (
              <Typography
                component="span"
                sx={{
                  minWidth: 12,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "text.disabled",
                  textAlign: "right",
                }}
              >
                {order}
              </Typography>
            ) : null}
            <Typography
              component="span"
              sx={{
                minWidth: 28,
                textAlign: "right",
                fontFamily: FONT_HAND,
                fontSize: 18,
                fontWeight: 500,
                lineHeight: 1,
                color: "text.secondary",
              }}
            >
              {isFirst ? "x" : pts}
            </Typography>
            <Box
              component="span"
              sx={{ width: 8, height: "1px", bgcolor: "text.disabled" }}
            />
            <Typography
              component="span"
              sx={{
                minWidth: 28,
                textAlign: "left",
                fontFamily: FONT_HAND,
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {isFirst ? pts : running}
            </Typography>
          </Stack>
        );
      })}
    </Box>
  );
}

function GamePad({
  title,
  game,
  teams,
  labels,
  maxPoints,
  showProgress,
}: {
  title: string;
  game: LiveWatchGame;
  teams: number[];
  labels: Record<number, string>;
  maxPoints: number;
  showProgress: boolean;
}) {
  const { t } = useTranslation();
  const winnerRaw = game.winner && game.winner !== "none" ? game.winner : "";
  const winnerMatch = winnerRaw.match(/Team\s+(\d+)/i);
  const winnerTeam = winnerMatch ? Number(winnerMatch[1]) : null;
  const decided = winnerTeam != null;

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[600], 0.2)}`,
        backgroundColor: alpha("#FDF8EE", 0.95),
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        sx={{
          px: 1.5,
          py: 1.1,
          borderBottom: (theme) =>
            `1px solid ${alpha(theme.palette.grey[600], 0.14)}`,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{title}</Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${teams.length}, minmax(0, 1fr))`,
        }}
      >
        {teams.map((team, index) => {
          const tint = TEAM_TINT[team] ?? TEAM_TINT[1];
          const hands = (game[`t${team}Datas` as keyof LiveWatchGame] as number[]) ?? [];
          const taken = (game[`t${team}Taken` as keyof LiveWatchGame] as number[]) ?? [];
          const total =
            (game[`t${team}TotalPoints` as keyof LiveWatchGame] as number) ?? 0;
          const progress =
            maxPoints > 0 ? Math.min((total / maxPoints) * 100, 100) : 0;
          const isWinner = decided && winnerTeam === team;
          const handCount = stripTrailingPadHands(hands).length;

          return (
            <Box
              key={team}
              sx={{
                px: 1.25,
                py: 1.25,
                borderLeft: index > 0 ? "1px solid" : "none",
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
                    bgcolor: tint,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", lineHeight: 1 }}
                >
                  {labels[team] || `T${team}`}
                </Typography>
              </Stack>

              <Box sx={{ borderTop: "2px solid", borderColor: "divider", mb: 1 }} />

              <HandRows hands={hands} taken={taken} />

              <Box sx={{ mt: 1.5 }}>
                {decided ? (
                  <Stack alignItems="center" sx={{ mb: 1 }}>
                    {isWinner ? (
                      <Chip
                        size="small"
                        label={t("winner")}
                        sx={{
                          fontSize: 11,
                          color: "primary.dark",
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.14),
                        }}
                      />
                    ) : handCount <= 1 ? (
                      <Chip
                        size="small"
                        label={
                          handCount === 0
                            ? `🐔 ${t("pollo")}`
                            : `👟 ${t("zapato")}`
                        }
                        sx={{
                          fontSize: 11,
                          color: "secondary.dark",
                          bgcolor: (theme) =>
                            alpha(theme.palette.secondary.main, 0.14),
                        }}
                      />
                    ) : null}
                  </Stack>
                ) : null}

                <Stack
                  direction="row"
                  alignItems="baseline"
                  justifyContent="space-between"
                >
                  <Typography variant="caption" color="text.secondary">
                    {t("total")}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 20,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {total}
                  </Typography>
                </Stack>
                {showProgress && !decided ? (
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ mt: 0.75, height: 6, borderRadius: 99 }}
                  />
                ) : null}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function Standing({ snapshot }: { snapshot: LiveWatchSnapshot }) {
  const { t } = useTranslation();
  const teams = teamNumbersFor(snapshot);
  const labels = labelsFor(snapshot);
  const wins: { teamNumber: number; wins: number }[] = tallyWins(
    snapshot.games ?? [],
    teams
  );
  const shutouts: {
    teamNumber: number;
    pollosFor: number;
    zapatosFor: number;
  }[] = tallyPollosZapatos(snapshot.games ?? [], teams);
  const shutoutByTeam = new Map(
    shutouts.map((row: { teamNumber: number; pollosFor: number; zapatosFor: number }) => [
      row.teamNumber,
      row,
    ] as const)
  );
  const leaderWins = Math.max(0, ...wins.map((w) => w.wins));

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[600], 0.2)}`,
        backgroundColor: alpha("#FDF8EE", 0.95),
        px: 1.5,
        py: 1.25,
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: "text.secondary", display: "block", mb: 1 }}
      >
        {snapshot.isClosed ? t("matchStanding") : t("openTable")}
      </Typography>
      <Stack direction="row" spacing={1}>
        {wins.map(({ teamNumber, wins: w }) => {
          const tint = TEAM_TINT[teamNumber] ?? TEAM_TINT[1];
          const leading = w > 0 && w === leaderWins;
          const marks = shutoutByTeam.get(teamNumber);
          return (
            <Box
              key={teamNumber}
              sx={{
                flex: 1,
                textAlign: "center",
                py: 1,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: leading ? alpha(tint, 0.45) : "divider",
                bgcolor: leading ? alpha(tint, 0.08) : "transparent",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 22,
                  color: tint,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {w}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {labels[teamNumber] || `T${teamNumber}`}
              </Typography>
              {marks ? (
                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 10,
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
    </Box>
  );
}

/** Read-only scorepad: standing + current + finished games. */
export default function LiveWatchScoreboard({
  snapshot,
}: {
  snapshot: LiveWatchSnapshot;
}) {
  const { t } = useTranslation();
  const teams = teamNumbersFor(snapshot);
  const labels = labelsFor(snapshot);
  const games = [...(snapshot.games ?? [])].reverse();

  return (
    <Stack spacing={1.5}>
      <Standing snapshot={snapshot} />

      {snapshot.currentGame ? (
        <GamePad
          title={t("liveWatchGame", { n: snapshot.gameIndex })}
          game={snapshot.currentGame}
          teams={teams}
          labels={labels}
          maxPoints={snapshot.maxPoints}
          showProgress
        />
      ) : null}

      {games.map((game, index) => {
        const gameNumber = games.length - index;
        return (
          <GamePad
            key={`done-${gameNumber}`}
            title={t("liveWatchGame", { n: gameNumber })}
            game={game}
            teams={teams}
            labels={labels}
            maxPoints={snapshot.maxPoints}
            showProgress={false}
          />
        );
      })}
    </Stack>
  );
}
