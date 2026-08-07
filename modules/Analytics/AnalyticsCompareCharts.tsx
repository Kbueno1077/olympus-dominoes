"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatJosesCoefficient } from "@/lib/analytics/joseCoefficient";
import type { PlayerStatsView } from "@/lib/analytics/types";
import { Box, Card, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  XAxis,
  YAxis,
} from "recharts";

const PLAYER_COLORS = [
  "rgb(31, 107, 88)",
  "rgb(61, 108, 140)",
  "rgb(180, 84, 47)",
  "rgb(140, 98, 57)",
  "rgb(90, 110, 70)",
  "rgb(120, 70, 100)",
  "rgb(50, 120, 130)",
  "rgb(150, 90, 60)",
  "rgb(70, 90, 120)",
  "rgb(110, 120, 55)",
];

const SERIES = {
  won: "rgb(31, 107, 88)",
  lost: "rgb(180, 84, 47)",
  favor: "rgb(31, 107, 88)",
  against: "rgb(180, 84, 47)",
  pollos: "rgb(61, 108, 140)",
  zapatos: "rgb(140, 98, 57)",
};

export type CompareChartPlayer = {
  id: number;
  name: string;
  stats: PlayerStatsView | null;
};

type Props = {
  players: CompareChartPlayer[];
  t: (key: string, values?: Record<string, string | number>) => string;
};

function shortName(name: string) {
  if (name.length <= 10) return name;
  return `${name.slice(0, 9)}…`;
}

export default function AnalyticsCompareCharts({ players, t }: Props) {
  const rows = players
    .map((player, index) => {
      const s = player.stats;
      if (!s) return null;
      return {
        id: player.id,
        name: shortName(player.name),
        fullName: player.name,
        color: PLAYER_COLORS[index % PLAYER_COLORS.length],
        coefficient: Number((s.josesCoefficient ?? 0).toFixed(1)),
        won: s.gamesWon,
        lost: s.gamesLost,
        pointsFor: s.pointsFor,
        pointsAgainst: s.pointsAgainst,
        pollosFor: s.pollosFor,
        zapatosFor: s.zapatosFor,
        handsWon: s.handsWon,
        handsLost: s.handsLost,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  if (rows.length === 0) return null;

  const recordConfig = {
    won: { label: t("statsGamesWon"), color: SERIES.won },
    lost: { label: t("statsGamesLost"), color: SERIES.lost },
  };

  const pointsConfig = {
    pointsFor: { label: t("statsPointsFor"), color: SERIES.favor },
    pointsAgainst: { label: t("statsPointsAgainst"), color: SERIES.against },
  };

  const shutoutConfig = {
    pollosFor: { label: t("pollo"), color: SERIES.pollos },
    zapatosFor: { label: t("zapato"), color: SERIES.zapatos },
  };

  const handsConfig = {
    handsWon: { label: t("statsHandsWon"), color: SERIES.won },
    handsLost: { label: t("statsHandsLost"), color: SERIES.lost },
  };

  const coefConfig = {
    coefficient: {
      label: t("statsJosesCoefficient"),
      color: SERIES.favor,
    },
  };

  const angled = rows.length > 3;

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
          md: "repeat(2, minmax(0, 1fr))",
        },
      }}
    >
      <ChartCard title={t("statsChartCoef")}>
        <ChartContainer config={coefConfig} className="h-[220px] w-full">
          <BarChart
            data={rows}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              angle={angled ? -25 : 0}
              textAnchor={angled ? "end" : "middle"}
              height={angled ? 52 : 30}
            />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <ChartTooltip
              labelFormatter={(_label, payload) => {
                const full = payload?.[0]?.payload?.fullName;
                return typeof full === "string" ? full : String(_label ?? "");
              }}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    formatJosesCoefficient(Number(value))
                  }
                />
              }
            />
            <Bar dataKey="coefficient" radius={[5, 5, 0, 0]}>
              {rows.map((row) => (
                <Cell key={row.id} fill={row.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title={t("statsCompareChartRecord")}>
        <ChartContainer config={recordConfig} className="h-[220px] w-full">
          <BarChart
            data={rows}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              angle={angled ? -25 : 0}
              textAnchor={angled ? "end" : "middle"}
              height={angled ? 52 : 30}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <ChartTooltip
              labelFormatter={(_label, payload) => {
                const full = payload?.[0]?.payload?.fullName;
                return typeof full === "string" ? full : String(_label ?? "");
              }}
              content={<ChartTooltipContent />}
            />
            <Legend />
            <Bar
              dataKey="won"
              fill="var(--color-won)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="lost"
              fill="var(--color-lost)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title={t("statsCompareChartPoints")}>
        <ChartContainer config={pointsConfig} className="h-[220px] w-full">
          <BarChart
            data={rows}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              angle={angled ? -25 : 0}
              textAnchor={angled ? "end" : "middle"}
              height={angled ? 52 : 30}
            />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip
              labelFormatter={(_label, payload) => {
                const full = payload?.[0]?.payload?.fullName;
                return typeof full === "string" ? full : String(_label ?? "");
              }}
              content={<ChartTooltipContent />}
            />
            <Legend />
            <Bar
              dataKey="pointsFor"
              fill="var(--color-pointsFor)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="pointsAgainst"
              fill="var(--color-pointsAgainst)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title={t("statsCompareChartHands")}>
        <ChartContainer config={handsConfig} className="h-[220px] w-full">
          <BarChart
            data={rows}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              angle={angled ? -25 : 0}
              textAnchor={angled ? "end" : "middle"}
              height={angled ? 52 : 30}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <ChartTooltip
              labelFormatter={(_label, payload) => {
                const full = payload?.[0]?.payload?.fullName;
                return typeof full === "string" ? full : String(_label ?? "");
              }}
              content={<ChartTooltipContent />}
            />
            <Legend />
            <Bar
              dataKey="handsWon"
              fill="var(--color-handsWon)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="handsLost"
              fill="var(--color-handsLost)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title={t("statsCompareChartShutouts")}>
        <ChartContainer config={shutoutConfig} className="h-[220px] w-full">
          <BarChart
            data={rows}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              angle={angled ? -25 : 0}
              textAnchor={angled ? "end" : "middle"}
              height={angled ? 52 : 30}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <ChartTooltip
              labelFormatter={(_label, payload) => {
                const full = payload?.[0]?.payload?.fullName;
                return typeof full === "string" ? full : String(_label ?? "");
              }}
              content={<ChartTooltipContent />}
            />
            <Legend />
            <Bar
              dataKey="pollosFor"
              fill="var(--color-pollosFor)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="zapatosFor"
              fill="var(--color-zapatosFor)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </Box>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card
      sx={{
        p: { xs: 1.5, sm: 2 },
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
      <Box
        sx={{
          minWidth: 0,
          width: "100%",
          minHeight: 220,
          position: "relative",
        }}
      >
        {children}
      </Box>
    </Card>
  );
}
