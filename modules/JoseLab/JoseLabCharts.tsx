"use client";

import {
  leadTermB,
  leadTermC,
  volumeAtG,
  type Breakdown,
  type FormulaId,
  type WeightsC,
  type WeightsK,
} from "@/lib/joseLab/compute";
import { personName, type LabPlayer } from "@/lib/joseLab/data";
import { JOSES_ACCENT } from "@/modules/Analytics/dashboardChrome";
import { Box, Card, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo, useEffect, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

const COLOR_K = "rgb(180, 110, 30)";
const COLOR_C = "rgb(61, 108, 140)";
const COLOR_KJ = "rgb(31, 107, 88)";
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

type LeadCurveRow = {
  n: number;
  K: number;
  KJ: number;
  C: number;
  pinLead: number | null;
  pinNames: string | null;
};

type MixPoint = {
  name: string;
  lead: number;
  extras: number;
  r: number;
  ratio: number | null;
  ratioLabel: string;
  pin: boolean;
};

type WaterfallStep = {
  name: string;
  base: number;
  span: number;
  amount: number;
  total: number;
  fill: string;
};

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
  const row =
    payload.find((item) => asNumber(item.payload?.K) != null)?.payload ??
    payload[0]?.payload;
  const n = asNumber(row?.n) ?? asNumber(label) ?? 0;
  const pinNames = typeof row?.pinNames === "string" ? row.pinNames : null;
  const lines = [
    { label: "K(x)", key: "K" },
    { label: "KJ(x)", key: "KJ" },
    { label: "OG F(x)", key: "C" },
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
      {pinNames ? (
        <Box
          sx={{
            mt: 0.75,
            pt: 0.6,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <TipRow label="here" value={pinNames} />
        </Box>
      ) : null}
    </TipShell>
  );
}

function MixTooltip({
  active,
  payload,
  yName = "extras",
}: {
  active?: boolean;
  payload?: ReadonlyArray<TipItem>;
  yName?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const name = typeof row?.name === "string" ? row.name : "";
  const lead = asNumber(row?.lead) ?? 0;
  const extras = asNumber(row?.extras) ?? 0;
  const r = asNumber(row?.r) ?? 0;
  const ratio = asNumber(row?.ratio);
  return (
    <TipShell title={name || `Lead vs ${yName}`}>
      <TipRow
        label="lead (X)"
        value={signedAdd(lead)}
        color={addColor(lead)}
      />
      <TipRow
        label={`${yName} (Y)`}
        value={signedAdd(extras)}
        color={addColor(extras)}
      />
      <TipRow
        label={`${yName} / lead`}
        value={ratio == null ? `${yName} only` : `${ratio.toFixed(2)}×`}
      />
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

function WaterfallTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TipItem>;
}) {
  if (!active || !payload?.length) return null;
  const row =
    payload.find((item) => item.dataKey === "span")?.payload ??
    payload[0]?.payload;
  const name = typeof row?.name === "string" ? row.name : "";
  const amount = asNumber(row?.amount) ?? 0;
  const total = asNumber(row?.total) ?? 0;
  return (
    <TipShell title={name || "Waterfall"}>
      <TipRow
        label={name === "R" ? "R" : "term"}
        value={signedAdd(amount)}
        color={addColor(amount)}
        strong={name === "R"}
      />
      {name === "R" ? null : (
        <TipRow label="running R" value={signedAdd(total)} color={addColor(total)} />
      )}
    </TipShell>
  );
}

function PinNamesLabel({
  x,
  y,
  value,
}: {
  x?: number | string;
  y?: number | string;
  value?: unknown;
}) {
  const text = typeof value === "string" ? value : "";
  const px = asNumber(x);
  const py = asNumber(y);
  if (!text || px == null || py == null) return null;
  return (
    <text x={px} y={py} dy={-10} textAnchor="middle" fontSize={11} fill="#241D14">
      {text}
    </text>
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
  hint,
  header,
  height = 300,
  children,
}: {
  title: string;
  hint?: string;
  header?: ReactNode;
  height?: number;
  children: ReactNode;
}) {
  return (
    <Card sx={{ p: 1.5, minWidth: 0 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: hint ? 0.25 : 0.75 }}>
        {title}
      </Typography>
      {hint ? (
        <Typography
          variant="caption"
          sx={{ display: "block", color: "text.secondary", mb: 0.75, lineHeight: 1.35 }}
        >
          {hint}
        </Typography>
      ) : null}
      {header}
      <Box sx={{ width: "100%", height, minWidth: 0 }}>{children}</Box>
    </Card>
  );
}

function leadTerm(
  n: number,
  formula: FormulaId,
  weightsK: WeightsK,
  weightsC: WeightsC,
  weightsKJ: WeightsK
): number {
  switch (formula) {
    case "K":
      return leadTermB(n, weightsK);
    case "KJ":
      return leadTermB(n, weightsKJ);
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
    case "K":
      return alpha(COLOR_K, 0.35);
    case "KJ":
      return alpha(COLOR_KJ, 0.35);
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

function waterfallFromBreakdown(
  br: Breakdown,
  formula: FormulaId
): WaterfallStep[] {
  const parts: { name: string; amount: number; fill: string }[] = [];
  if (formula === "C") {
    parts.push({ name: "√(G/2)", amount: br.sqrt, fill: PART_COLORS.sqrt });
  }
  parts.push(
    { name: "Lead", amount: br.games, fill: PART_COLORS.games },
    { name: "Datas", amount: br.datas, fill: PART_COLORS.datas },
    { name: "Points", amount: br.pts, fill: PART_COLORS.pts },
    { name: "Pollos", amount: br.po, fill: PART_COLORS.po },
    { name: "Zapatos", amount: br.zap, fill: PART_COLORS.zap }
  );

  let cursor = 0;
  const rows: WaterfallStep[] = parts.map((part) => {
    const amount = part.amount;
    const base = amount >= 0 ? cursor : cursor + amount;
    cursor += amount;
    return {
      name: part.name,
      base,
      span: Math.abs(amount),
      amount,
      total: cursor,
      fill: part.fill,
    };
  });

  rows.push({
    name: "R",
    base: br.r >= 0 ? 0 : br.r,
    span: Math.abs(br.r),
    amount: br.r,
    total: br.r,
    fill: JOSES_ACCENT,
  });
  return rows;
}

type ExtraVsLeadSpec = {
  id: "sqrt" | "datas" | "pts" | "po" | "zap";
  title: string;
  yName: string;
  fill: string;
  extraOf: (br: Breakdown) => number;
};

function extraVsLeadSpecs(formula: FormulaId): ExtraVsLeadSpec[] {
  const rest: ExtraVsLeadSpec[] = [
    {
      id: "datas",
      title: "Datas vs lead",
      yName: "datas",
      fill: PART_COLORS.datas,
      extraOf: (br) => br.datas,
    },
    {
      id: "pts",
      title: "Points vs lead",
      yName: "points",
      fill: PART_COLORS.pts,
      extraOf: (br) => br.pts,
    },
    {
      id: "po",
      title: "Pollos vs lead",
      yName: "pollos",
      fill: PART_COLORS.po,
      extraOf: (br) => br.po,
    },
    {
      id: "zap",
      title: "Zapatos vs lead",
      yName: "zapatos",
      fill: PART_COLORS.zap,
      extraOf: (br) => br.zap,
    },
  ];
  if (formula === "C") {
    return [
      {
        id: "sqrt",
        title: "√(G/2) vs lead",
        yName: "√(G/2)",
        fill: PART_COLORS.sqrt,
        extraOf: (br) => br.sqrt,
      },
      ...rest,
    ];
  }
  return rest;
}

function toMixPoints(
  scored: { player: LabPlayer; br: Breakdown | null }[],
  pinnedSet: Set<string>,
  extraOf: (br: Breakdown) => number
): MixPoint[] {
  return scored
    .filter((row) => row.br)
    .map((row) => {
      const br = row.br!;
      const lead = br.games;
      const extras = extraOf(br);
      const ratio = lead === 0 ? null : extras / lead;
      return {
        name: personName(row.player),
        lead: Number(lead.toFixed(2)),
        extras: Number(extras.toFixed(2)),
        r: Number(br.r.toFixed(2)),
        ratio,
        ratioLabel: ratio == null ? "" : `${ratio.toFixed(1)}×`,
        pin: pinnedSet.has(row.player.id),
      };
    });
}

function LeadExtraScatter({
  points,
  restFill,
  yName,
}: {
  points: MixPoint[];
  restFill: string;
  yName: string;
}) {
  const pins = points.filter((row) => row.pin);
  const rest = points.filter((row) => !row.pin);
  return (
    <ResponsiveContainer width="100%" height="100%" debounce={80}>
      <ScatterChart margin={{ top: 28, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={alpha("#241D14", 0.12)}
        />
        <XAxis
          type="number"
          dataKey="lead"
          name="lead"
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="extras"
          name={yName}
          tick={{ fontSize: 11 }}
        />
        <Tooltip content={<MixTooltip yName={yName} />} />
        <ReferenceLine x={0} stroke={alpha("#241D14", 0.35)} />
        <ReferenceLine y={0} stroke={alpha("#241D14", 0.35)} />
        <Scatter
          name="others"
          data={rest}
          fill={restFill}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="ratioLabel"
            position="top"
            fontSize={10}
            fill={alpha("#241D14", 0.7)}
          />
        </Scatter>
        <Scatter
          name="pinned"
          data={pins}
          fill={PIN}
          isAnimationActive={false}
        >
          <LabelList dataKey="name" position="top" fontSize={11} />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

type Props = {
  formula: FormulaId;
  weightsK: WeightsK;
  weightsC: WeightsC;
  weightsKJ: WeightsK;
  players: LabPlayer[];
  scored: { player: LabPlayer; br: Breakdown | null }[];
  pinnedIds: string[];
};

const LINE_COLORS = [
  PIN,
  JOSES_ACCENT,
  COLOR_K,
  "rgb(61, 108, 140)",
  "rgb(140, 98, 57)",
  "rgb(120, 70, 130)",
  "rgb(90, 90, 90)",
  "rgb(160, 60, 50)",
];

export default memo(function JoseLabCharts({
  formula,
  weightsK,
  weightsC,
  weightsKJ,
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

  const [waterfallId, setWaterfallId] = useState(pinnedIds[0] ?? "");
  useEffect(() => {
    if (!pinnedIds.includes(waterfallId)) {
      setWaterfallId(pinnedIds[0] ?? "");
    }
  }, [pinnedIds, waterfallId]);

  const peopleByN = new Map<number, string[]>();
  pinnedPlayers.forEach((p) => {
    const n = p.W - p.L;
    const names = peopleByN.get(n) ?? [];
    names.push(personName(p));
    peopleByN.set(n, names);
  });

  const leadCurve: LeadCurveRow[] = Array.from({ length: 61 }, (_, i) => {
    const n = i - 30;
    const names = peopleByN.get(n) ?? [];
    return {
      n,
      K: leadTermB(n, weightsK),
      KJ: leadTermB(n, weightsKJ),
      C: leadTermC(n, weightsC),
      pinLead: names.length
        ? leadTerm(n, formula, weightsK, weightsC, weightsKJ)
        : null,
      pinNames: names.length ? names.join(" · ") : null,
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

  const mix = toMixPoints(scored, pinnedSet, (br) => br.r - br.games);
  const extraMix = extraVsLeadSpecs(formula).map((spec) => ({
    spec,
    points: toMixPoints(scored, pinnedSet, spec.extraOf),
  }));

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

  const waterfallPlayer =
    scored.find((row) => row.player.id === waterfallId && row.br) ?? null;
  const waterfallSteps = waterfallPlayer?.br
    ? waterfallFromBreakdown(waterfallPlayer.br, formula)
    : [];
  const waterfallName = waterfallPlayer
    ? personName(waterfallPlayer.player)
    : "";

  const volumeKeys = pinNames;
  const volume = Array.from({ length: 25 }, (_, i) => {
    const G = 8 + i * 8;
    const row: Record<string, number> = { G };
    pinnedPlayers.forEach((p) => {
      row[personName(p)] = Number(
        volumeAtG(p, formula, weightsK, weightsC, weightsKJ, G).toFixed(2)
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
      <ChartCard
        title="Lead vs net games"
        hint={`Dots = ${pinLabel}`}
      >
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
              dataKey="K"
              stroke={COLOR_K}
              dot={false}
              strokeWidth={2}
              name="K(x)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="KJ"
              stroke={COLOR_KJ}
              dot={false}
              strokeWidth={2}
              name="KJ(x)"
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
              type="linear"
              dataKey="pinLead"
              stroke="none"
              legendType="none"
              name="people"
              isAnimationActive={false}
              activeDot={false}
              dot={(props: {
                cx?: number;
                cy?: number;
                payload?: LeadCurveRow;
              }) => {
                if (
                  props.payload?.pinLead == null ||
                  props.cx == null ||
                  props.cy == null
                ) {
                  return <g />;
                }
                return (
                  <circle cx={props.cx} cy={props.cy} r={4} fill={PIN} />
                );
              }}
            >
              <LabelList dataKey="pinNames" content={PinNamesLabel} />
            </Line>
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

      <ChartCard
        title="Lead vs extras · all in this set"
        hint="X = games term. Y = everything else. Closers sit right; volume sits up. Ratio = extras / lead."
      >
        <LeadExtraScatter
          points={mix}
          restFill={scatterFill(formula)}
          yName="extras"
        />
      </ChartCard>

      <ChartCard
        title={`Waterfall to R${waterfallName ? ` · ${waterfallName}` : ""}`}
        hint="Lead → extras, stacked as a running total. Pin someone, then pick who."
        header={
          pinnedPlayers.length > 0 ? (
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={0.5}
              sx={{ mb: 0.75 }}
            >
              {pinnedPlayers.map((p) => {
                const selected = p.id === waterfallId;
                return (
                  <Chip
                    key={p.id}
                    size="small"
                    label={personName(p)}
                    onClick={() => setWaterfallId(p.id)}
                    variant={selected ? "filled" : "outlined"}
                    sx={{
                      height: 22,
                      fontSize: 11,
                      fontWeight: selected ? 700 : 500,
                      bgcolor: selected ? alpha(PIN, 0.18) : undefined,
                      borderColor: selected ? PIN : undefined,
                    }}
                  />
                );
              })}
            </Stack>
          ) : null
        }
      >
        {waterfallSteps.length === 0 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              fontSize: 13,
            }}
          >
            Pin someone in the table to see the waterfall.
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%" debounce={80}>
            <BarChart
              data={waterfallSteps}
              margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={alpha("#241D14", 0.12)}
              />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<WaterfallTooltip />} />
              <ReferenceLine y={0} stroke={alpha("#241D14", 0.35)} />
              <Bar
                dataKey="base"
                stackId="wf"
                fill="transparent"
                legendType="none"
                isAnimationActive={false}
              />
              <Bar dataKey="span" stackId="wf" isAnimationActive={false}>
                {waterfallSteps.map((step) => (
                  <Cell key={step.name} fill={step.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {extraMix.map(({ spec, points }) => (
        <ChartCard
          key={spec.id}
          title={`${spec.title} · all in this set`}
          hint={`X = games term. Y = ${spec.yName}. Ratio = ${spec.yName} / lead.`}
        >
          <LeadExtraScatter
            points={points}
            restFill={alpha(spec.fill, 0.45)}
            yName={spec.yName}
          />
        </ChartCard>
      ))}

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
