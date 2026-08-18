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
  type WeightsK2,
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
const COLOR_K2 = "rgb(180, 110, 30)";
const PIN = "rgb(180, 84, 47)";

const PART_COLORS = {
  games: JOSES_ACCENT,
  sqrt: "rgb(90, 90, 90)",
  datas: "rgb(31, 107, 88)",
  pts: "rgb(140, 98, 57)",
  po: "rgb(61, 108, 140)",
  zap: "rgb(180, 84, 47)",
};

type BreakdownBarRow = {
  name: string;
  dG: number;
  dDW: number;
  dPF: number;
  dPo: number;
  dZap: number;
  sqrt: number;
  games: number;
  datas: number;
  pts: number;
  po: number;
  zap: number;
  r: number;
};

const BREAKDOWN_TIP_LINES = [
  { label: "ΔG", delta: "dG", add: "games" },
  { label: "ΔDW", delta: "dDW", add: "datas" },
  { label: "ΔPF", delta: "dPF", add: "pts" },
  { label: "ΔPo", delta: "dPo", add: "po" },
  { label: "ΔZap", delta: "dZap", add: "zap" },
] as const;

type BreakdownBarKey = "sqrt" | "games" | "datas" | "pts" | "po" | "zap";

type BreakdownBarSpec = {
  dataKey: BreakdownBarKey;
  name: string;
  fill: string;
};

/** Stack + legend order. Recharts 3 sorts the legend alphabetically unless told not to. */
function breakdownBars(formula: FormulaId): BreakdownBarSpec[] {
  const rest: BreakdownBarSpec[] = [
    {
      dataKey: "games",
      name: formula === "C" ? "games" : "games / lead",
      fill: PART_COLORS.games,
    },
    { dataKey: "datas", name: "datas", fill: PART_COLORS.datas },
    { dataKey: "pts", name: "points", fill: PART_COLORS.pts },
    { dataKey: "po", name: "pollos", fill: PART_COLORS.po },
    { dataKey: "zap", name: "zapatos", fill: PART_COLORS.zap },
  ];
  if (formula === "C") {
    return [
      { dataKey: "sqrt", name: "√(G/2)", fill: PART_COLORS.sqrt },
      ...rest,
    ];
  }
  return rest;
}

function breakdownLegendOrder(formula: FormulaId) {
  const keys = breakdownBars(formula).map((bar) => bar.dataKey);
  return (item: { dataKey?: unknown }) => {
    const raw = item.dataKey;
    const key = typeof raw === "string" || typeof raw === "number" ? String(raw) : "";
    const i = keys.indexOf(key as BreakdownBarKey);
    return i === -1 ? keys.length : i;
  };
}

const TIP_MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace';

type TipItem = {
  name?: string;
  value?: number | string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};

function signedDelta(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

function signedAdd(n: number): string {
  const text = n.toFixed(2);
  return n > 0 ? `+${text}` : text;
}

function addColor(n: number): string {
  if (n > 0) return "success.dark";
  if (n < 0) return "error.dark";
  return "text.secondary";
}

function TipShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        px: 1.25,
        py: 1,
        minWidth: 188,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        boxShadow: 1,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function TipRow({
  label,
  value,
  color,
  strong = false,
}: {
  label: string;
  value: string;
  color?: string;
  strong?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 1.5,
        fontFamily: TIP_MONO,
        fontSize: strong ? 13 : 12,
        fontWeight: strong ? 800 : 400,
        lineHeight: 1.55,
      }}
    >
      <Box
        component="span"
        sx={{ color: strong ? "text.primary" : "text.secondary" }}
      >
        {label}
      </Box>
      <Box
        component="span"
        sx={{ fontWeight: 700, color: color ?? "text.primary" }}
      >
        {value}
      </Box>
    </Box>
  );
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function BreakdownTooltip({
  active,
  payload,
  formula,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: BreakdownBarRow }>;
  formula?: FormulaId;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <TipShell title={row.name}>
      {formula === "C" ? (
        <TipRow
          label="√(G/2)"
          value={`(${signedAdd(row.sqrt)})`}
          color={addColor(row.sqrt)}
        />
      ) : null}
      {BREAKDOWN_TIP_LINES.map((line) => (
        <TipRow
          key={line.label}
          label={`${line.label} ${signedDelta(row[line.delta])}`}
          value={`(${signedAdd(row[line.add])})`}
          color={addColor(row[line.add])}
        />
      ))}
      <Box
        sx={{
          mt: 0.75,
          pt: 0.6,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <TipRow
          label="R"
          value={signedAdd(row.r)}
          color={addColor(row.r)}
          strong
        />
      </Box>
    </TipShell>
  );
}

function LeadTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TipItem>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const person = payload.find(
    (item) => typeof item.payload?.name === "string"
  );
  if (person && typeof person.payload?.name === "string") {
    const n = asNumber(person.payload.n) ?? asNumber(label) ?? 0;
    const lead = asNumber(person.payload.lead) ?? asNumber(person.value) ?? 0;
    return (
      <TipShell title={person.payload.name}>
        <TipRow label={`ΔG ${signedDelta(n)}`} value={`(${signedAdd(lead)})`} color={addColor(lead)} />
      </TipShell>
    );
  }
  const row = payload[0]?.payload;
  const n = asNumber(row?.n) ?? asNumber(label) ?? 0;
  const lines = [
    { label: "K(x)", key: "B" },
    { label: "K2(x)", key: "K2" },
    { label: "OG F(x)", key: "C" },
    { label: "Tangent (x)", key: "A" },
  ] as const;
  return (
    <TipShell title={`ΔG ${signedDelta(n)}`}>
      {lines.map((line) => {
        const value = asNumber(row?.[line.key]) ?? 0;
        return (
          <TipRow
            key={line.key}
            label={line.label}
            value={`(${signedAdd(value)})`}
            color={addColor(value)}
          />
        );
      })}
    </TipShell>
  );
}

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TipItem>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const name = typeof row?.name === "string" ? row.name : "";
  const n = asNumber(row?.n) ?? 0;
  const r = asNumber(row?.r) ?? 0;
  return (
    <TipShell title={name || "R"}>
      <TipRow label="ΔG" value={signedDelta(n)} />
      <Box
        sx={{
          mt: 0.75,
          pt: 0.6,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <TipRow label="R" value={signedAdd(r)} color={addColor(r)} strong />
      </Box>
    </TipShell>
  );
}

function VolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TipItem>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const G = asNumber(payload[0]?.payload?.G) ?? asNumber(label) ?? 0;
  return (
    <TipShell title={`G ${G}`}>
      {payload.map((item) => {
        const value = asNumber(item.value);
        if (value == null) return null;
        const name = String(item.name ?? item.dataKey ?? "");
        if (name === "G") return null;
        return (
          <TipRow
            key={name}
            label={name}
            value={`(${signedAdd(value)})`}
            color={addColor(value)}
          />
        );
      })}
    </TipShell>
  );
}

function SqrtTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TipItem>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const row =
    payload.find((item) => item.dataKey === "raw" || item.dataKey === "term")
      ?.payload ?? payload[0]?.payload;
  const G = asNumber(row?.G) ?? asNumber(label) ?? 0;
  const raw = asNumber(row?.raw);
  const term = asNumber(row?.term);
  return (
    <TipShell title={`G ${G}`}>
      {raw != null ? (
        <TipRow
          label="√(G/2)"
          value={signedAdd(raw)}
          color={PART_COLORS.sqrt}
        />
      ) : null}
      {term != null ? (
        <TipRow
          label="kSqrt × √(G/2)"
          value={signedAdd(term)}
          color={COLOR_C}
        />
      ) : null}
    </TipShell>
  );
}

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
  weightsC: WeightsC,
  weightsK2: WeightsK2
): number {
  switch (formula) {
    case "A":
      return leadTermA(n, weightsA);
    case "B":
      return leadTermB(n, weightsB);
    case "K2":
      return leadTermB(n, weightsK2);
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
    case "K2":
      return alpha(COLOR_K2, 0.35);
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
  weightsK2: WeightsK2;
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
  weightsK2,
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
      K2: leadTermB(n, weightsK2),
      C: leadTermC(n, weightsC),
    };
  });

  const leadPeople = pinnedPlayers.map((p) => {
    const n = p.W - p.L;
    return {
      n,
      lead: leadTerm(n, formula, weightsA, weightsB, weightsC, weightsK2),
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
      dG: row.br!.n,
      dDW: row.player.dDW,
      dPF: row.player.dPF,
      dPo: row.player.dPo,
      dZap: row.player.dZap,
      sqrt: Number(row.br!.sqrt.toFixed(2)),
      games: Number(row.br!.games.toFixed(2)),
      datas: Number(row.br!.datas.toFixed(2)),
      pts: Number(row.br!.pts.toFixed(2)),
      po: Number(row.br!.po.toFixed(2)),
      zap: Number(row.br!.zap.toFixed(2)),
      r: Number(row.br!.r.toFixed(2)),
    }));

  const volumeKeys = pinNames;
  const volume = Array.from({ length: 25 }, (_, i) => {
    const G = 8 + i * 8;
    const row: Record<string, number> = { G };
    pinnedPlayers.forEach((p) => {
      row[personName(p)] = Number(
        volumeAtG(p, formula, weightsA, weightsB, weightsC, weightsK2, G, denomCap).toFixed(2)
      );
    });
    return row;
  });

  const sqrtCurve = Array.from({ length: 51 }, (_, i) => {
    const G = i * 4;
    const raw = G <= 0 ? 0 : Math.sqrt(G / 2);
    return {
      G,
      raw: Number(raw.toFixed(3)),
      term: Number((weightsC.kSqrt * raw).toFixed(3)),
    };
  });
  const sqrtYMax = Math.max(10, Math.ceil(weightsC.kSqrt * 10));

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
            <Tooltip content={<LeadTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke={alpha("#241D14", 0.35)} />
            <Line
              type="monotone"
              dataKey="B"
              stroke={COLOR_B}
              dot={false}
              strokeWidth={2}
              name="K(x)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="K2"
              stroke={COLOR_K2}
              dot={false}
              strokeWidth={2}
              name="K2(x)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="C"
              stroke={COLOR_C}
              dot={false}
              strokeWidth={2}
              name="OG F(x)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="A"
              stroke={COLOR_A}
              dot={false}
              strokeWidth={2}
              name="Tangent (x)"
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
            <Tooltip content={<ScatterTooltip />} />
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
            <Tooltip content={(props) => <BreakdownTooltip {...props} formula={formula} />} />
            <Legend itemSorter={breakdownLegendOrder(formula)} />
            <ReferenceLine x={0} stroke={alpha("#241D14", 0.35)} />
            {breakdownBars(formula).map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                stackId="r"
                name={bar.name}
                fill={bar.fill}
                isAnimationActive={false}
              />
            ))}
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
            <Tooltip content={<VolumeTooltip />} />
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

      {formula === "C" ? (
        <ChartCard title="√(G/2) as G grows · OG F(x)">
          <ResponsiveContainer width="100%" height="100%" debounce={80}>
            <LineChart
              data={sqrtCurve}
              margin={{ top: 16, right: 28, left: 4, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={alpha("#241D14", 0.12)}
              />
              <XAxis dataKey="G" tick={{ fontSize: 11 }} />
              <YAxis
                type="number"
                domain={[0, sqrtYMax]}
                allowDataOverflow
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={<SqrtTooltip />}
                isAnimationActive={false}
                filterNull
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="raw"
                stroke={PART_COLORS.sqrt}
                strokeDasharray="4 3"
                dot={false}
                strokeWidth={2}
                name="√(G/2)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="term"
                stroke={COLOR_C}
                dot={false}
                strokeWidth={2}
                name={`${weightsC.kSqrt} × √(G/2)`}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}
    </Box>
  );
});
