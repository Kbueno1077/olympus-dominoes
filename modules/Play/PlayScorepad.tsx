"use client";

import { teamLabels } from "@/lib/play/engine";
import type {
  CompletedPlayGame,
  HandRecord,
  MatchSnapshot,
} from "@/lib/play/types";
import { useTranslation } from "@/i18n/useTranslation";
import { FONT_HAND } from "@/muiTheme/typography";
import { TEAM_TINT } from "@/modules/Play/PlayChain";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type Props = {
  match: MatchSnapshot;
  /** Tighter chrome for the play sidebar. */
  compact?: boolean;
};

function handsByTeam(
  hands: HandRecord[],
  teams: number[]
): Record<number, number[]> {
  const map: Record<number, number[]> = Object.fromEntries(
    teams.map((team) => [team, [] as number[]])
  );
  for (const hand of hands) {
    map[hand.winnerTeam]?.push(hand.pointsAwarded);
  }
  return map;
}

function GamePad({
  title,
  subtitle,
  hands,
  teamScores,
  teams,
  labels,
  maxPoints,
  compact,
  showProgress,
}: {
  title: string;
  subtitle?: string;
  hands: HandRecord[];
  teamScores: Record<number, number>;
  teams: number[];
  labels: Record<number, string>;
  maxPoints: number;
  compact: boolean;
  showProgress: boolean;
}) {
  const { t } = useTranslation();
  const byTeam = handsByTeam(hands, teams);

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
        spacing={1}
        sx={{
          px: compact ? 1.25 : 1.75,
          py: compact ? 1 : 1.25,
          borderBottom: (theme) =>
            `1px solid ${alpha(theme.palette.grey[600], 0.14)}`,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: compact ? 14 : 15 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", textAlign: "right" }}
          >
            {subtitle}
          </Typography>
        )}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${teams.length}, minmax(0, 1fr))`,
        }}
      >
        {teams.map((team, index) => {
          const tint = TEAM_TINT[team] ?? TEAM_TINT[1];
          const teamHands = byTeam[team] ?? [];
          const total = teamScores[team] ?? 0;
          const progress =
            maxPoints > 0 ? Math.min((total / maxPoints) * 100, 100) : 0;

          return (
            <Box
              key={team}
              sx={{
                px: compact ? 1 : 1.5,
                py: compact ? 1.25 : 1.5,
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
                    backgroundColor: tint,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    lineHeight: 1,
                    fontSize: 10,
                  }}
                  noWrap
                >
                  {t(labels[team])}
                </Typography>
              </Stack>

              <Box
                sx={{ borderTop: "2px solid", borderColor: "divider", mb: 1 }}
              />

              <Box sx={{ flex: 1, minHeight: 28 }}>
                {teamHands.length === 0 ? (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      textAlign: "center",
                      color: "text.disabled",
                      py: 0.5,
                    }}
                  >
                    —
                  </Typography>
                ) : (
                  teamHands.map((pts, handIndex) => {
                    const isFirst = handIndex === 0;
                    const running = teamHands
                      .slice(0, handIndex + 1)
                      .reduce((a, b) => a + b, 0);
                    return (
                      <Stack
                        key={`${team}-${handIndex}-${pts}`}
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
                        <Typography
                          component="span"
                          sx={{
                            minWidth: 28,
                            textAlign: "right",
                            fontFamily: FONT_HAND,
                            fontSize: compact ? 17 : 20,
                            fontWeight: 500,
                            lineHeight: 1,
                            color: "text.secondary",
                          }}
                        >
                          {isFirst ? "x" : pts}
                        </Typography>
                        <Box
                          component="span"
                          sx={{
                            width: 8,
                            height: "1px",
                            backgroundColor: "text.disabled",
                          }}
                        />
                        <Typography
                          component="span"
                          sx={{
                            minWidth: 28,
                            textAlign: "left",
                            fontFamily: FONT_HAND,
                            fontSize: compact ? 17 : 20,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: "text.primary",
                          }}
                        >
                          {isFirst ? pts : running}
                        </Typography>
                      </Stack>
                    );
                  })
                )}
              </Box>

              <Box sx={{ mt: 1.25 }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: compact ? 13 : 14,
                    textAlign: "center",
                    fontVariantNumeric: "tabular-nums",
                    mb: showProgress ? 0.75 : 0,
                  }}
                >
                  {total}
                </Typography>
                {showProgress && (
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 4,
                      borderRadius: 1,
                      backgroundColor: alpha(tint, 0.15),
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: tint,
                        borderRadius: 1,
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function Standing({
  match,
  teams,
  labels,
  compact,
}: {
  match: MatchSnapshot;
  teams: number[];
  labels: Record<number, string>;
  compact: boolean;
}) {
  const { t } = useTranslation();
  const leader = Math.max(0, ...teams.map((team) => match.gamesWon[team] ?? 0));

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[600], 0.2)}`,
        backgroundColor: alpha("#FDF8EE", 0.95),
        px: compact ? 1.25 : 1.75,
        py: compact ? 1.25 : 1.5,
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: "text.secondary", display: "block", mb: 1.25 }}
      >
        {t("matchStanding")}
      </Typography>
      <Stack direction="row" spacing={1}>
        {teams.map((team) => {
          const wins = match.gamesWon[team] ?? 0;
          const tint = TEAM_TINT[team] ?? TEAM_TINT[1];
          const leading = wins > 0 && wins === leader;
          return (
            <Box
              key={team}
              sx={{
                flex: 1,
                minWidth: 0,
                textAlign: "center",
                py: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: leading ? alpha(tint, 0.45) : "divider",
                backgroundColor: leading ? alpha(tint, 0.08) : "transparent",
              }}
            >
              <Typography
                sx={{
                  fontSize: compact ? 20 : 22,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  fontVariantNumeric: "tabular-nums",
                  color: tint,
                }}
              >
                {wins}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                {t(labels[team])}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

/**
 * Annotator-style notebook: match standing (games won), current game pad,
 * then finished games (newest first).
 */
export default function PlayScorepad({ match, compact = false }: Props) {
  const { t } = useTranslation();
  const labels = teamLabels(match.modeId);
  const teams = Object.keys(labels)
    .map(Number)
    .sort((a, b) => a - b);

  const completedNewestFirst = [...match.completedGames].reverse();

  return (
    <Stack spacing={compact ? 1.5 : 2}>
      <Standing
        match={match}
        teams={teams}
        labels={labels}
        compact={compact}
      />

      <GamePad
        title={t("gameNumber", { n: match.gameIndex })}
        subtitle={
          match.gameOver && match.gameWinnerTeams[0] != null
            ? t("tookIt", { team: t(labels[match.gameWinnerTeams[0]]) })
            : t("firstToPoints", { n: match.maxPoints })
        }
        hands={match.hands}
        teamScores={match.teamScores}
        teams={teams}
        labels={labels}
        maxPoints={match.maxPoints}
        compact={compact}
        showProgress={!match.gameOver}
      />

      {completedNewestFirst.map((game: CompletedPlayGame) => (
        <GamePad
          key={`done-${game.gameIndex}`}
          title={t("gameNumber", { n: game.gameIndex })}
          subtitle={t("tookIt", { team: t(labels[game.winnerTeam]) })}
          hands={game.hands}
          teamScores={game.finalScores}
          teams={teams}
          labels={labels}
          maxPoints={match.maxPoints}
          compact={compact}
          showProgress={false}
        />
      ))}
    </Stack>
  );
}
