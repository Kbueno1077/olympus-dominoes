"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatJosesCoefficient } from "@/lib/analytics/joseCoefficient";
import {
  perGameRatePct,
  perHandAverage,
} from "@/lib/analytics/signedDiff";
import type { LeaderboardRow, PlayerStatsView } from "@/lib/analytics/types";
import { JOSES_ACCENT } from "@/modules/Analytics/dashboardChrome";
import { Box, Card, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  primary: "rgb(31, 107, 88)",
  secondary: "rgb(180, 84, 47)",
  info: "rgb(61, 108, 140)",
  joses: JOSES_ACCENT,
};

type Props = {
  leaderboard: LeaderboardRow[];
  activeStats: PlayerStatsView | null;
  playerName: string | null;
  t: (key: string, values?: Record<string, string | number>) => string;
};

function ChartCard({
  title,
  children,
  tall = false,
}: {
  title: string;
  children: React.ReactNode;
  tall?: boolean;
}) {
  return (
    <Card
      sx={{
        p: { xs: 1.5, sm: 2 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: tall ? { xs: 240, sm: 280 } : { xs: 220, sm: 240 },
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="overline"
        component="p"
        sx={{ color: "text.secondary", mb: 1 }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, width: "100%" }}>
        {children}
      </Box>
    </Card>
  );
}

/**
 * Dense chart grid for the Stats dashboard. Pure presentational + memoized data.
 */
export default function StatsDashboardCharts({
  leaderboard,
  activeStats,
  playerName,
  t,
}: Props) {
  const coefData = useMemo(
    () =>
      leaderboard.slice(0, 10).map((row) => ({
        name:
          row.playerName.length > 10
            ? `${row.playerName.slice(0, 9)}…`
            : row.playerName,
        fullName: row.playerName,
        coefficient: Number((row.josesCoefficient ?? 0).toFixed(1)),
      })),
    [leaderboard]
  );

  const gamesPie = useMemo(() => {
    if (!activeStats) return [];
    return [
      {
        name: t("statsGamesWon"),
        value: activeStats.gamesWon,
        fill: COLORS.primary,
      },
      {
        name: t("statsGamesLost"),
        value: activeStats.gamesLost,
        fill: COLORS.secondary,
      },
    ].filter((d) => d.value > 0);
  }, [activeStats, t]);

  const gamesSummary = useMemo(() => {
    if (!activeStats || activeStats.gamesPlayed <= 0) return null;
    const total = activeStats.gamesPlayed;
    const wonPct = Math.round((activeStats.gamesWon / total) * 100);
    const lostPct = Math.round((activeStats.gamesLost / total) * 100);
    return { total, wonPct, lostPct };
  }, [activeStats]);

  const pointsData = useMemo(() => {
    if (!activeStats) return [];
    return [
      {
        name: t("statsFor"),
        value: activeStats.pointsFor,
        fill: COLORS.primary,
      },
      {
        name: t("statsAgainst"),
        value: activeStats.pointsAgainst,
        fill: COLORS.secondary,
      },
    ];
  }, [activeStats, t]);

  const handsData = useMemo(() => {
    if (!activeStats) return [];
    return [
      {
        name: t("statsFor"),
        value: activeStats.handsWon,
        fill: COLORS.primary,
      },
      {
        name: t("statsAgainst"),
        value: activeStats.handsLost,
        fill: COLORS.secondary,
      },
    ];
  }, [activeStats, t]);

  const shutoutData = useMemo(() => {
    if (!activeStats) return [];
    return [
      {
        name: t("pollo"),
        for: activeStats.pollosFor,
        against: activeStats.pollosAgainst,
      },
      {
        name: t("zapato"),
        for: activeStats.zapatosFor,
        against: activeStats.zapatosAgainst,
      },
    ];
  }, [activeStats, t]);

  const shutoutRateData = useMemo(() => {
    if (!activeStats) return [];
    const G = activeStats.gamesPlayed;
    const polloPct = perGameRatePct(activeStats.pollosFor, G);
    const zapatoPct = perGameRatePct(activeStats.zapatosFor, G);
    return [
      {
        name: t("pollo"),
        pct: polloPct == null ? 0 : Number(polloPct.toFixed(1)),
        label: polloPct == null ? "—" : `${polloPct.toFixed(0)}%`,
        count: activeStats.pollosFor,
        fill: COLORS.primary,
      },
      {
        name: t("zapato"),
        pct: zapatoPct == null ? 0 : Number(zapatoPct.toFixed(1)),
        label: zapatoPct == null ? "—" : `${zapatoPct.toFixed(0)}%`,
        count: activeStats.zapatosFor,
        fill: COLORS.secondary,
      },
    ];
  }, [activeStats, t]);

  const perHandData = useMemo(() => {
    if (!activeStats) return [];
    const forAvg = perHandAverage(activeStats.pointsFor, activeStats.handsFor);
    const againstAvg = perHandAverage(
      activeStats.pointsAgainst,
      activeStats.handsAgainst
    );
    return [
      {
        name: t("statsFor"),
        value: forAvg == null ? 0 : Number(forAvg.toFixed(1)),
      },
      {
        name: t("statsAgainst"),
        value: againstAvg == null ? 0 : Number(againstAvg.toFixed(1)),
      },
    ];
  }, [activeStats, t]);

  const empty = (
    <Typography variant="body2" sx={{ color: "text.secondary", py: 4 }}>
      {t("statsNoData")}
    </Typography>
  );

  const gamesTitle = playerName
    ? t("statsChartRecord", { name: playerName })
    : t("statsChartGames");

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(3, minmax(0, 1fr))",
        },
      }}
    >
      <Box
        sx={{
          gridColumn: { xs: "1", sm: "1 / -1", xl: "1 / 3" },
          minWidth: 0,
          maxWidth: "100%",
        }}
      >
        <ChartCard title={t("statsChartCoef")} tall>
          {coefData.length === 0 ? (
            empty
          ) : (
            <ChartContainer
              config={{
                coefficient: {
                  label: t("statsJosesCoefficient"),
                  color: COLORS.joses,
                },
              }}
              className="h-[240px] w-full"
            >
              <BarChart
                data={coefData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={64}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  labelFormatter={(_label, payload) =>
                    String(payload?.[0]?.payload?.fullName ?? _label ?? "")
                  }
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        formatJosesCoefficient(Number(value))
                      }
                    />
                  }
                />
                <Bar
                  dataKey="coefficient"
                  fill="var(--color-coefficient)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </ChartCard>
      </Box>

      <ChartCard title={gamesTitle}>
        {!activeStats || !gamesSummary ? (
          empty
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: "100%" }}
            spacing={1}
          >
            {gamesPie.length === 0 ? (
              empty
            ) : (
              <ChartContainer
                config={{
                  value: { label: t("statsGamesPlayed"), color: COLORS.info },
                }}
                className="h-[150px] w-full"
              >
                <PieChart>
                  <Pie
                    data={gamesPie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={42}
                    outerRadius={64}
                    paddingAngle={3}
                  >
                    {gamesPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                </PieChart>
              </ChartContainer>
            )}
            <Stack spacing={0.25} alignItems="center">
              <Typography sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {t("statsGamesTotal", { n: gamesSummary.total })}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "primary.main", fontVariantNumeric: "tabular-nums" }}
              >
                {t("statsGamesWonPct", {
                  n: activeStats.gamesWon,
                  pct: gamesSummary.wonPct,
                })}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "secondary.main", fontVariantNumeric: "tabular-nums" }}
              >
                {t("statsGamesLostPct", {
                  n: activeStats.gamesLost,
                  pct: gamesSummary.lostPct,
                })}
              </Typography>
            </Stack>
          </Stack>
        )}
      </ChartCard>

      <ChartCard title={t("statsChartPointsForAgainst")}>
        {!activeStats ? (
          empty
        ) : (
          <ChartContainer
            config={{
              value: { label: t("points"), color: COLORS.info },
            }}
            className="h-[200px] w-full"
          >
            <BarChart
              data={pointsData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {pointsData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </ChartCard>

      <ChartCard title={t("statsChartPointsPerHand")}>
        {!activeStats ? (
          empty
        ) : (
          <ChartContainer
            config={{
              value: {
                label: t("statsChartPointsPerHand"),
                color: COLORS.primary,
              },
            }}
            className="h-[200px] w-full"
          >
            <BarChart
              data={perHandData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {perHandData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={i === 0 ? COLORS.primary : COLORS.secondary}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </ChartCard>

      <ChartCard title={t("statsChartHandsForAgainst")}>
        {!activeStats ? (
          empty
        ) : (
          <ChartContainer
            config={{
              value: { label: t("statsHandsTotal"), color: COLORS.info },
            }}
            className="h-[200px] w-full"
          >
            <BarChart
              data={handsData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {handsData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </ChartCard>

      <ChartCard title={t("statsCompareChartShutouts")}>
        {!activeStats ? (
          empty
        ) : (
          <ChartContainer
            config={{
              for: { label: t("statsFor"), color: COLORS.primary },
              against: { label: t("statsAgainst"), color: COLORS.secondary },
            }}
            className="h-[200px] w-full"
          >
            <BarChart
              data={shutoutData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="for" fill="var(--color-for)" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="against"
                fill="var(--color-against)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </ChartCard>

      <ChartCard title={t("statsChartShutoutRates")}>
        {!activeStats ? (
          empty
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: "100%" }}
            spacing={1}
          >
            <ChartContainer
              config={{
                pct: {
                  label: t("statsChartShutoutRates"),
                  color: COLORS.info,
                },
              }}
              className="h-[150px] w-full"
            >
              <BarChart
                data={shutoutRateData}
                margin={{ top: 22, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis
                  domain={[0, "auto"]}
                  tickFormatter={(v) => `${v}%`}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `${Number(value).toFixed(0)}%`}
                    />
                  }
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {shutoutRateData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="label"
                    position="top"
                    style={{
                      fill: "currentColor",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
            >
              {shutoutRateData.map((entry) => (
                <Typography
                  key={entry.name}
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {entry.name}:{" "}
                  <Box
                    component="span"
                    sx={{ fontWeight: 700, color: "text.primary" }}
                  >
                    {entry.label}
                  </Box>
                  {" · "}
                  {t("statsShutoutRateHint", {
                    n: entry.count,
                    games: activeStats.gamesPlayed,
                  })}
                </Typography>
              ))}
            </Stack>
          </Stack>
        )}
      </ChartCard>
    </Box>
  );
}
