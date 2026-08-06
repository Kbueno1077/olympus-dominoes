"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatJosesCoefficient } from "@/lib/analytics/joseCoefficient";
import type { LeaderboardRow, PlayerStatsView } from "@/lib/analytics/types";
import { Box, Card, Stack, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = {
  primary: "rgb(31, 107, 88)",
  secondary: "rgb(180, 84, 47)",
  info: "rgb(61, 108, 140)",
};

type Props = {
  leaderboard: LeaderboardRow[];
  activeStats: PlayerStatsView | null;
  playerName: string | null;
  t: (key: string, values?: Record<string, string | number>) => string;
};

export default function AnalyticsCharts({
  leaderboard,
  activeStats,
  playerName,
  t,
}: Props) {
  const coefData = leaderboard.slice(0, 8).map((row) => ({
    name: row.playerName,
    coefficient: Number((row.josesCoefficient ?? 0).toFixed(1)),
  }));

  const recordData = activeStats
    ? [
        {
          label: t("statsGamesWon"),
          value: activeStats.gamesWon,
          fill: CHART_COLORS.primary,
        },
        {
          label: t("statsGamesLost"),
          value: activeStats.gamesLost,
          fill: CHART_COLORS.secondary,
        },
      ]
    : [];

  const shutoutData = activeStats
    ? [
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
      ]
    : [];

  const coefConfig = {
    coefficient: {
      label: t("statsJosesCoefficient"),
      color: CHART_COLORS.primary,
    },
  };

  const shutoutConfig = {
    for: { label: t("statsFor"), color: CHART_COLORS.primary },
    against: { label: t("statsAgainst"), color: CHART_COLORS.secondary },
  };

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
      }}
    >
      <Card sx={{ p: 2 }}>
        <Typography
          variant="overline"
          component="p"
          sx={{ color: "text.secondary", mb: 1 }}
        >
          {t("statsChartCoef")}
        </Typography>
        {coefData.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("statsNoData")}
          </Typography>
        ) : (
          <ChartContainer config={coefConfig} className="h-[220px] w-full">
            <BarChart
              data={coefData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                angle={coefData.length > 4 ? -25 : 0}
                textAnchor={coefData.length > 4 ? "end" : "middle"}
                height={coefData.length > 4 ? 56 : 30}
              />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip
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
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </Card>

      <Card sx={{ p: 2 }}>
        <Typography
          variant="overline"
          component="p"
          sx={{ color: "text.secondary", mb: 1 }}
        >
          {playerName
            ? t("statsChartRecord", { name: playerName })
            : t("statsChartRecordGeneric")}
        </Typography>
        {!activeStats ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("statsNoData")}
          </Typography>
        ) : (
          <Stack spacing={2}>
            <ChartContainer
              config={{
                value: {
                  label: t("statsGamesPlayed"),
                  color: CHART_COLORS.info,
                },
              }}
              className="h-[120px] w-full"
            >
              <BarChart
                data={recordData}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={88}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {recordData.map((entry) => (
                    <Cell key={entry.label} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>

            <ChartContainer
              config={shutoutConfig}
              className="h-[160px] w-full"
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
                <Bar
                  dataKey="for"
                  fill="var(--color-for)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="against"
                  fill="var(--color-against)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </Stack>
        )}
      </Card>
    </Box>
  );
}
