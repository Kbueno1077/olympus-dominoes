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
import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type Props = {
  match: MatchSnapshot;
  /** Tighter chrome for the play sidebar. */
  compact?: boolean;
};

type ShutoutMarks = {
  pollosFor: number;
  zapatosFor: number;
};

function handsByTeam(
  hands: HandRecord[],
  teams: number[]
): Record<number, { points: number; taken: number }[]> {
  const map: Record<number, { points: number; taken: number }[]> =
    Object.fromEntries(teams.map((team) => [team, []]));
  for (const hand of hands) {
    map[hand.winnerTeam]?.push({
      points: hand.pointsAwarded,
      taken: hand.handIndex,
    });
  }
  return map;
}

/** Pollos / zapatos dealt while winning (opponent had 0 / 1 hands). */
function tallyShutouts(
  completed: CompletedPlayGame[],
  teams: number[]
): Map<number, ShutoutMarks> {
  const map = new Map(
    teams.map((team) => [team, { pollosFor: 0, zapatosFor: 0 }])
  );
  for (const game of completed) {
    const byTeam = handsByTeam(game.hands, teams);
    const marks = map.get(game.winnerTeam);
    if (!marks) continue;
    for (const other of teams) {
      if (other === game.winnerTeam) continue;
      const handCount = (byTeam[other] ?? []).length;
      if (handCount === 0) marks.pollosFor += 1;
      else if (handCount === 1) marks.zapatosFor += 1;
    }
  }
  return map;
}

function Outcome({
  isWinner,
  handCount,
}: {
  isWinner: boolean;
  handCount: number;
}) {
  const { t } = useTranslation();

  if (isWinner) {
    return (
      <Chip
        label={t("winner")}
        size="small"
        sx={{
          fontSize: 11,
          color: "primary.dark",
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.14),
        }}
      />
    );
  }

  if (handCount === 0 || handCount === 1) {
    const isPollo = handCount === 0;
    return (
      <Chip
        label={isPollo ? `🐔 ${t("pollo")}` : `👟 ${t("zapato")}`}
        size="small"
        sx={{
          fontSize: 11,
          color: "secondary.dark",
          backgroundColor: (theme) =>
            alpha(theme.palette.secondary.main, 0.14),
        }}
      />
    );
  }

  return null;
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
  winnerTeam,
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
  /** Set when the game is decided — enables winner / pollo / zapato chips. */
  winnerTeam: number | null;
}) {
  const { t } = useTranslation();
  const byTeam = handsByTeam(hands, teams);
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
                  teamHands.map((hand, handIndex) => {
                    const isFirst = handIndex === 0;
                    const pts = hand.points;
                    const running = teamHands
                      .slice(0, handIndex + 1)
                      .reduce((sum, row) => sum + row.points, 0);
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
                        {hand.taken > 0 ? (
                          <Typography
                            component="span"
                            sx={{
                              minWidth: 12,
                              fontSize: 10,
                              lineHeight: 1,
                              fontWeight: 600,
                              color: "text.disabled",
                              textAlign: "right",
                            }}
                          >
                            {hand.taken}
                          </Typography>
                        ) : null}
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

              {decided ? (
                <Box
                  sx={{
                    mt: 1.25,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Outcome
                    isWinner={team === winnerTeam}
                    handCount={teamHands.length}
                  />
                </Box>
              ) : showProgress ? (
                <Box sx={{ mt: 1.25 }}>
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
                </Box>
              ) : null}
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
  shutouts,
}: {
  match: MatchSnapshot;
  teams: number[];
  labels: Record<number, string>;
  compact: boolean;
  shutouts: Map<number, ShutoutMarks>;
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
          const marks = shutouts.get(team);
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
              <Typography
                variant="caption"
                sx={{ color: "text.secondary" }}
                noWrap
              >
                {t(labels[team])}
              </Typography>
              {marks && (marks.pollosFor > 0 || marks.zapatosFor > 0) ? (
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
  const shutouts = tallyShutouts(match.completedGames, teams);
  const currentWinner =
    match.gameOver && match.gameWinnerTeams[0] != null
      ? match.gameWinnerTeams[0]
      : null;

  return (
    <Stack spacing={compact ? 1.5 : 2}>
      <Standing
        match={match}
        teams={teams}
        labels={labels}
        compact={compact}
        shutouts={shutouts}
      />

      <GamePad
        title={t("gameNumber", { n: match.gameIndex })}
        subtitle={
          currentWinner != null
            ? t("tookIt", { team: t(labels[currentWinner]) })
            : t("firstToPoints", { n: match.maxPoints })
        }
        hands={match.hands}
        teamScores={match.teamScores}
        teams={teams}
        labels={labels}
        maxPoints={match.maxPoints}
        compact={compact}
        showProgress={!match.gameOver}
        winnerTeam={currentWinner}
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
          winnerTeam={game.winnerTeam}
        />
      ))}
    </Stack>
  );
}
