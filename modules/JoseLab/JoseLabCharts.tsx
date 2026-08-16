"use client";

import {
  leadTermA,
  leadTermB,
  leadTermC,
  volumeAtG,
  type Breakdown,
  type FormulaId,
  type WeightsA,
  type WeightsB,
  type WeightsC,
} from "@/lib/joseLab/compute";
import { personName, type LabPlayer } from "@/lib/joseLab/data";
import { JOSES_ACCENT } from "@/modules/Analytics/dashboardChrome";
import { Box, Card, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLOR_A = JOSES_ACCENT;
const COLOR_B = "rgb(31, 107, 88)";
const COLOR_C = "rgb(61, 108, 140)";
const PIN = "rgb(180, 84, 47)";

const PART_COLORS = {
  games: JOSES_ACCENT,
  sqrt: "rgb(90, 90, 90)",
  datas: "rgb(31, 107, 88)",
  pts: "rgb(140, 98, 57)",
  po: "rgb(61, 108, 140)",
  zap: "rgb(180, 84, 47)",
};

function ChartCard({
  title,
  height = 300,
  children,
}: {
  title: string;
  height?: number;
  children: ReactNode;
}) {
  return (
    <Card sx={{ p: 1.5, minWidth: 0 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
        {title}
      </Typography>
      <Box sx={{ width: "100%", height, minWidth: 0 }}>{children}</Box>
    </Card>
  );
}

function leadTerm(
  n: number,
  formula: FormulaId,
  weightsA: WeightsA,
  weightsB: WeightsB,
  weightsC: WeightsC
): number {
  switch (formula) {
    case "A":
      return leadTermA(n, weightsA);
    case "B":
      return leadTermB(n, weightsB);
    case "C":
      return leadTermC(n, weightsC);
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function scatterFill(formula: FormulaId): string {
  switch (formula) {
    case "A":
      return alpha(COLOR_A, 0.35);
    case "B":
      return alpha(COLOR_B, 0.35);
    case "C":
      return alpha(COLOR_C, 0.35);
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function pick(
  players: LabPlayer[],
  ids: readonly string[]
): LabPlayer[] {
  return ids
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is LabPlayer => !!p);
}

type Props = {
  formula: FormulaId;
  weightsA: WeightsA;
  weightsB: WeightsB;
  weightsC: WeightsC;
  denomCap: number | null;
  players: LabPlayer[];
  scored: { player: LabPlayer; br: Breakdown | null }[];
  pinnedIds: string[];
};

const LINE_COLORS = [
  PIN,
  COLOR_A,
  COLOR_B,
  "rgb(61, 108, 140)",
  "rgb(140, 98, 57)",
  "rgb(120, 70, 130)",
  "rgb(90, 90, 90)",
  "rgb(160, 60, 50)",
];

export default memo(function JoseLabCharts({
  formula,
  weightsA,
  weightsB,
  weightsC,
  denomCap,
  players,
  scored,
  pinnedIds,
}: Props) {
  const pinnedSet = new Set(pinnedIds);
  const pinnedPlayers = pick(players, pinnedIds);
  const pinNames = pinnedPlayers.map((p) => personName(p));
  const pinLabel =
    pinNames.length === 0
      ? "none pinned — tap a pin in the table"
      : pinNames.join(", ");

  const leadCurve = Array.from({ length: 61 }, (_, i) => {
    const n = i - 30;
    return {
      n,
      A: leadTermA(n, weightsA),
      B: leadTermB(n, weightsB),
      C: leadTermC(n, weightsC),
    };
  });

  const leadPeople = pinnedPlayers.map((p) => {
    const n = p.W - p.L;
    return {
      n,
      lead: leadTerm(n, formula, weightsA, weightsB, weightsC),
      name: personName(p),
    };
  });

  const scatter = scored
    .filter((row) => row.br)
    .map((row) => ({
      name: personName(row.player),
      n: row.br!.n,
      r: row.br!.r,
      pin: pinnedSet.has(row.player.id),
    }));
  const scatterPins = scatter.filter((row) => row.pin);
  const scatterRest = scatter.filter((row) => !row.pin);

  const breakdown = scored
    .filter((row) => row.br && pinnedSet.has(row.player.id))
    .sort((a, b) => (b.br?.r ?? 0) - (a.br?.r ?? 0))
    .map((row) => ({
      name: personName(row.player),
      sqrt: Number(row.br!.sqrt.toFixed(2)),
      games: Number(row.br!.games.toFixed(2)),
      datas: Number(row.br!.datas.toFixed(2)),
      pts: Number(row.br!.pts.toFixed(2)),
      po: Number(row.br!.po.toFixed(2)),
      zap: Number(row.br!.zap.toFixed(2)),
    }));

  const volumeKeys = pinNames;
  const volume = Array.from({ length: 25 }, (_, i) => {
    const G = 8 + i * 8;
    const row: Record<string, number> = { G };
    pinnedPlayers.forEach((p) => {
      row[personName(p)] = Number(
        volumeAtG(p, formula, weightsA, weightsB, weightsC, G, denomCap).toFixed(2)
      );
    });
    return row;
  });

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
      }}
    >
      <ChartCard title={`Lead term · ${pinLabel}`}>
        <ResponsiveContainer width="100%" height="100%" debounce={80}>
          <ComposedChart
            data={leadCurve}
            margin={{ top: 36, right: 28, left: 4, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={alpha("#241D14", 0.12)}
            />
            <XAxis
              type="number"
              dataKey="n"
              domain={[-30, 30]}
              tick={{ fontSize: 11 }}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={0} stroke={alpha("#241D14", 0.35)} />
            <Line
              type="monotone"
              dataKey="A"
              stroke={COLOR_A}
              dot={false}
              strokeWidth={2}
              name="A tanh"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="B"
              stroke={COLOR_B}
              dot={false}
              strokeWidth={2}
              name="B kn"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="C"
              stroke={COLOR_C}
              dot={false}
              strokeWidth={2}
              name="C ΔG"
              isAnimationActive={false}
            />
            <Scatter name="people" data={leadPeople} dataKey="lead" fill={PIN} isAnimationActive={false}>
              <LabelList dataKey="name" position="top" fontSize={11} />
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="R vs n · all in this set, names = pinned">
        <ResponsiveContainer width="100%" height="100%" debounce={80}>
          <ScatterChart margin={{ top: 28, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={alpha("#241D14", 0.12)}
            />
            <XAxis type="number" dataKey="n" name="n" tick={{ fontSize: 11 }} />
            <YAxis type="number" dataKey="r" name="R" tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) => Number(value).toFixed(1)}
              labelFormatter={(_, payload) => {
                const name = payload?.[0]?.payload?.name;
                return typeof name === "string" ? name : "";
              }}
            />
            <ReferenceLine y={0} stroke={alpha("#241D14", 0.35)} />
            <Scatter
              name="others"
              data={scatterRest}
              fill={scatterFill(formula)}
              isAnimationActive={false}
            />
            <Scatter name="pinned" data={scatterPins} fill={PIN} isAnimationActive={false}>
              <LabelList dataKey="name" position="top" fontSize={11} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={`Breakdown · ${pinLabel}`}>
        <ResponsiveContainer width="100%" height="100%" debounce={80}>
          <BarChart
            layout="vertical"
            data={breakdown}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={alpha("#241D14", 0.12)}
            />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 12 }}
            />
            <Tooltip formatter={(value) => Number(value).toFixed(2)} />
            <Legend />
            <ReferenceLine x={0} stroke={alpha("#241D14", 0.35)} />
            <Bar
              dataKey="sqrt"
              stackId="r"
              name="√(G/2)"
              fill={PART_COLORS.sqrt}
              isAnimationActive={false}
            />
            <Bar
              dataKey="games"
              stackId="r"
              name="games / lead"
              fill={PART_COLORS.games}
              isAnimationActive={false}
            />
            <Bar
              dataKey="datas"
              stackId="r"
              name="datas"
              fill={PART_COLORS.datas}
              isAnimationActive={false}
            />
            <Bar
              dataKey="pts"
              stackId="r"
              name="points"
              fill={PART_COLORS.pts}
              isAnimationActive={false}
            />
            <Bar
              dataKey="po"
              stackId="r"
              name="pollos"
              fill={PART_COLORS.po}
              isAnimationActive={false}
            />
            <Bar
              dataKey="zap"
              stackId="r"
              name="zapatos"
              fill={PART_COLORS.zap}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={`Volume · ${pinLabel}`}>
        <ResponsiveContainer width="100%" height="100%" debounce={80}>
          <LineChart
            data={volume}
            margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={alpha("#241D14", 0.12)}
            />
            <XAxis dataKey="G" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {volumeKeys.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </Box>
  );
});
