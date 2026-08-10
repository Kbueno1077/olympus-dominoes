"use client";

import { teamLabels } from "@/lib/play/engine";
import type { MatchSnapshot } from "@/lib/play/types";
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

/** Match scorepad in the same pencilled-note style as the live annotator:
 * team columns with hand points; running total only at the foot.
 */
export default function PlayScorepad({ match, compact = false }: Props) {
  const { t } = useTranslation();
  const labels = teamLabels(match.modeId);
  const teams = Object.keys(labels)
    .map(Number)
    .sort((a, b) => a - b);

  const handsByTeam: Record<number, number[]> = Object.fromEntries(
    teams.map((team) => [team, [] as number[]])
  );
  for (const hand of match.hands) {
    handsByTeam[hand.winnerTeam]?.push(hand.pointsAwarded);
  }

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
          px: compact ? 1.25 : 1.75,
          py: compact ? 1 : 1.25,
          borderBottom: (theme) =>
            `1px solid ${alpha(theme.palette.grey[600], 0.14)}`,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: compact ? 14 : undefined }}>
          {t("matchStanding")}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {t("playFirstTo", { n: match.maxPoints })}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${teams.length}, minmax(0, 1fr))`,
        }}
      >
        {teams.map((team, index) => {
          const tint = TEAM_TINT[team] ?? TEAM_TINT[1];
          const hands = handsByTeam[team] ?? [];
          const total = match.teamScores[team] ?? 0;
          const progress =
            match.maxPoints > 0
              ? Math.min((total / match.maxPoints) * 100, 100)
              : 0;

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
                {hands.length === 0 ? (
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
                  hands.map((pts, handIndex) => {
                    const isFirst = handIndex === 0;
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
                        {isFirst ? (
                          <>
                            <Typography
                              component="span"
                              sx={{
                                minWidth: 28,
                                textAlign: "right",
                                fontFamily: FONT_HAND,
                                fontSize: compact ? 18 : 21,
                                fontWeight: 500,
                                lineHeight: 1,
                                color: "text.secondary",
                              }}
                            >
                              x
                            </Typography>
                            <Box
                              component="span"
                              sx={{
                                width: 8,
                                height: "1px",
                                backgroundColor: "text.disabled",
                              }}
                            />
                          </>
                        ) : null}
                        <Typography
                          component="span"
                          sx={{
                            minWidth: 28,
                            textAlign: isFirst ? "left" : "center",
                            fontFamily: FONT_HAND,
                            fontSize: compact ? 18 : 21,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: "text.primary",
                          }}
                        >
                          {pts}
                        </Typography>
                      </Stack>
                    );
                  })
                )}
              </Box>

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
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
