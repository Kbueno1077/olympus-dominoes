"use client";

import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useTranslation } from "@/i18n/useTranslation";
import {
  coefficientAxisTicks,
  mapTimelineScores,
  timelinePointsForPlayers,
  timelineStockToJosesInput,
  timelineWindowStart,
  type CoefficientTimeline,
  type CoefficientTimelinePlayer,
  type ScoredTimelinePoint,
} from "@/lib/analytics/coefficientTimeline";
import { formatMatchDate, resolveMatchHeading } from "@/lib/analytics/history";
import {
  computeJosesCoefficient,
  formatJosesCoefficient,
} from "@/lib/analytics/joseCoefficient";
import { JOSES_ACCENT } from "@/modules/Analytics/dashboardChrome";
import {
  LabExpandable,
  useLabChartExpanded,
} from "@/modules/JoseLab/JoseLabExpand";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Person from "@mui/icons-material/Person";
import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import { useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

/** Separated on the bone background — not the muddy greens that were blending. */
const PALETTE = [
  "#C2410C",
  "#1D4ED8",
  "#0F6E56",
  "#7C3AED",
  "#B45309",
  "#BE185D",
  "#0E7490",
  "#B91C1C",
  "#4D7C0F",
  "#6D28D9",
  "#9A3412",
  "#0369A1",
];

const LINE_WIDTH = 2.75;
const LINE_WIDTH_EMPHASIS = 3.75;
/** Dates visible in the card. Full screen shows a longer stretch of the same series. */
const WINDOW_INLINE = 6;
const WINDOW_FULL = 15;

type PlotProps = {
  players: CoefficientTimelinePlayer[];
  points: ScoredTimelinePoint[];
  highlightPlayerIds?: readonly number[];
  emptyLabel: string;
  formatValue: (value: number) => string;
  /** Decimal places used to decide when a shift is visible. */
  digits?: number;
};

function seriesKey(playerId: number): string {
  return `p${playerId}`;
}

function axisLabel(language: string, endedAt: string, index: number): string {
  const time = new Date(endedAt).getTime();
  if (!Number.isFinite(time)) return String(index + 1);
  const locale = language === "es" ? "es-ES" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(time));
}

function tooltipLabel(
  language: string,
  title: string,
  endedAt: string
): string {
  const heading = resolveMatchHeading(language, title, endedAt);
  if (!heading.showDateSubtitle) return heading.heading;
  return `${heading.heading} · ${formatMatchDate(language, endedAt)}`;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatTick(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (Math.abs(value) >= 10) return String(Math.round(value));
  return value.toFixed(1);
}

function formatSigned(
  delta: number,
  formatValue: (value: number) => string
): string {
  const text = formatValue(Math.abs(delta));
  if (delta > 0) return `+${text}`;
  if (delta < 0) return `−${text}`;
  return text;
}

type ChartRow = Record<string, string | number | null>;

type TipItem = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: ChartRow;
};

function shiftAgainstPrevious(
  item: TipItem,
  digits: number
): number | null {
  const row = item.payload;
  const index = row?.index;
  const key = item.dataKey == null ? "" : String(item.dataKey);
  if (typeof index !== "number" || index <= 0 || !key) return null;
  const previous = row?.[`prev:${key}`];
  if (typeof item.value !== "number" || typeof previous !== "number") return null;
  return roundTo(item.value - previous, digits);
}

function TimelineTooltip({
  active,
  payload,
  formatValue,
  digits,
}: {
  active?: boolean;
  payload?: TipItem[];
  formatValue: (value: number) => string;
  digits: number;
}) {
  if (!active || !payload?.length) return null;
  const label = payload[0]?.payload?.tooltipLabel;
  const rows = payload
    .filter(
      (item): item is TipItem & { value: number } =>
        typeof item.value === "number" && Number.isFinite(item.value)
    )
    .slice()
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid max-h-64 min-w-[12rem] items-start gap-1.5 overflow-y-auto rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2.5 py-1.5 text-xs shadow-xl">
      {typeof label === "string" && label ? (
        <div className="font-medium text-[rgb(var(--text))]">{label}</div>
      ) : null}
      <div className="grid gap-1">
        {rows.map((item) => {
          const delta = shiftAgainstPrevious(item, digits);
          const shiftColor =
            delta == null || delta === 0
              ? "rgb(var(--text-muted))"
              : delta > 0
                ? "rgb(31, 107, 88)"
                : "rgb(166, 51, 40)";
          return (
            <div
              key={String(item.dataKey ?? item.name)}
              className="flex w-full items-center justify-between gap-4"
            >
              <div className="flex min-w-0 items-center gap-1.5 text-[rgb(var(--text-muted))]">
                <span
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </div>
              <span className="flex items-baseline gap-2 font-mono font-medium tabular-nums text-[rgb(var(--text))]">
                {formatValue(item.value)}
                {delta == null ? null : (
                  <span className="font-bold" style={{ color: shiftColor }}>
                    ({formatSigned(delta, formatValue)})
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type DotProps = {
  cx?: number;
  cy?: number;
  index?: number;
  value?: number | string;
  stroke?: string;
  payload?: ChartRow;
};

export function JosesCoefficientTimelinePlot({
  players,
  points,
  highlightPlayerIds = [],
  emptyLabel,
  formatValue,
  digits = 1,
}: PlotProps) {
  const { language, t } = useTranslation();
  const expanded = useLabChartExpanded();
  const pageSize = expanded ? WINDOW_FULL : WINDOW_INLINE;
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const hidden = useMemo(() => new Set(hiddenIds), [hiddenIds]);
  const shown = useMemo(() => {
    const active = new Set<number>();
    for (const player of players) {
      if (!hidden.has(player.playerId)) active.add(player.playerId);
    }
    return timelinePointsForPlayers(points, active);
  }, [hidden, players, points]);
  const anchor = `${shown.length}:${pageSize}`;
  const [scroll, setScroll] = useState<{
    anchor: string;
    start: number;
  } | null>(null);
  const wheelCarry = useRef(0);
  const maxStart = Math.max(0, shown.length - pageSize);
  const windowStart = timelineWindowStart(
    shown.length,
    pageSize,
    scroll != null && scroll.anchor === anchor ? scroll.start : null
  );
  const highlight = useMemo(
    () => new Set(highlightPlayerIds),
    [highlightPlayerIds]
  );
  const soleHighlight =
    highlightPlayerIds.length === 1 ? highlightPlayerIds[0] : null;

  const ordered = useMemo(() => {
    const last = points[points.length - 1]?.values ?? {};
    return [...players].sort((a, b) => {
      const av = last[a.playerId];
      const bv = last[b.playerId];
      if (av == null && bv == null) return a.name.localeCompare(b.name);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (bv !== av) return bv - av;
      return a.name.localeCompare(b.name);
    });
  }, [players, points]);

  const colorFor = (playerId: number) => {
    if (playerId === soleHighlight) return JOSES_ACCENT;
    return PALETTE[Math.abs(playerId) % PALETTE.length] ?? PALETTE[0];
  };

  const rows = useMemo(
    () =>
      shown.map((point, index) => {
        const row: Record<string, string | number | null> = {
          index,
          tooltipLabel: tooltipLabel(language, point.title, point.endedAt),
          axisLabel: axisLabel(language, point.endedAt, index),
        };
        const previous = index > 0 ? shown[index - 1] : undefined;
        for (const player of players) {
          const key = seriesKey(player.playerId);
          const value = point.values[player.playerId];
          const prior = previous?.values[player.playerId];
          row[key] = value ?? null;
          row[`prev:${key}`] = prior ?? null;
        }
        return row;
      }),
    [language, players, shown]
  );

  const yTicks = useMemo(() => {
    const values: number[] = [];
    const slice = shown.slice(windowStart, windowStart + pageSize);
    for (const point of slice) {
      for (const player of players) {
        if (hidden.has(player.playerId)) continue;
        const value = point.values[player.playerId];
        if (typeof value === "number" && Number.isFinite(value)) {
          values.push(value);
        }
      }
    }
    if (values.length === 0) return [0];
    return coefficientAxisTicks(Math.min(...values), Math.max(...values));
  }, [hidden, pageSize, players, shown, windowStart]);

  const hasValue = shown.some((point) => Object.keys(point.values).length > 0);
  const seriesHasScores = points.some(
    (point) => Object.keys(point.values).length > 0
  );

  if (!seriesHasScores) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "grid",
          placeItems: "center",
          px: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {emptyLabel}
        </Typography>
      </Box>
    );
  }

  const config: Record<string, { label: string; color: string }> = {};
  for (const player of ordered) {
    config[seriesKey(player.playerId)] = {
      label: player.name,
      color: colorFor(player.playerId),
    };
  }

  const visible = ordered.filter((player) => !hidden.has(player.playerId));
  const drawn = [
    ...visible.filter((player) => !highlight.has(player.playerId)),
    ...visible.filter((player) => highlight.has(player.playerId)),
  ];
  const yMin = yTicks[0] ?? 0;
  const yMax = yTicks[yTicks.length - 1] ?? 0;
  const windowRows = rows.slice(windowStart, windowStart + pageSize);
  const moveWindow = (next: number) => {
    setScroll({
      anchor,
      start: Math.min(Math.max(0, next), maxStart),
    });
  };

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {hasValue ? (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          position: "relative",
        }}
        onWheel={(event) => {
          if (maxStart === 0 || Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
            return;
          }
          wheelCarry.current += event.deltaX;
          const hops = Math.trunc(wheelCarry.current / 48);
          if (hops === 0) return;
          wheelCarry.current -= hops * 48;
          setScroll((current) => {
            const base = timelineWindowStart(
              shown.length,
              pageSize,
              current != null && current.anchor === anchor ? current.start : null
            );
            return {
              anchor,
              start: timelineWindowStart(shown.length, pageSize, base + hops),
            };
          });
        }}
      >
        <Box sx={{ position: "absolute", inset: 0 }}>
          <ChartContainer config={config} className="h-full w-full">
            <LineChart
              data={windowRows}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="index"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                interval="preserveStartEnd"
                tickFormatter={(value) => {
                  const row = rows[Number(value)];
                  return typeof row?.axisLabel === "string"
                    ? row.axisLabel
                    : "";
                }}
              />
              <YAxis
                type="number"
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fontSize: 12 }}
                ticks={yTicks}
                domain={[yMin, yMax]}
                allowDataOverflow
                tickFormatter={(value) => formatTick(Number(value))}
              />
              <ChartTooltip
                content={(props) => (
                  <TimelineTooltip
                    active={props.active}
                    payload={props.payload as unknown as TipItem[] | undefined}
                    formatValue={formatValue}
                    digits={digits}
                  />
                )}
              />
              <ReferenceLine y={0} stroke="rgb(210, 196, 172)" />
              {drawn.map((player) => {
                const key = seriesKey(player.playerId);
                const emphasis = highlight.has(player.playerId);
                const color = colorFor(player.playerId);
                return (
                  <Line
                    key={key}
                    type="linear"
                    dataKey={key}
                    name={player.name}
                    stroke={`var(--color-${key})`}
                    strokeWidth={emphasis ? LINE_WIDTH_EMPHASIS : LINE_WIDTH}
                    dot={(dotProps: DotProps) => {
                      const index = dotProps.index ?? -1;
                      const current = dotProps.value;
                      const previous = dotProps.payload?.[`prev:${key}`];
                      const changed =
                        typeof current === "number" &&
                        (typeof previous !== "number" ||
                          roundTo(current - previous, digits) !== 0);
                      if (
                        !changed ||
                        dotProps.cx == null ||
                        dotProps.cy == null ||
                        typeof current !== "number"
                      ) {
                        return <g key={`${key}-${index}`} />;
                      }
                      return (
                        <circle
                          key={`${key}-${index}`}
                          cx={dotProps.cx}
                          cy={dotProps.cy}
                          r={4}
                          fill={color}
                          stroke="#fff"
                          strokeWidth={1.5}
                        />
                      );
                    }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          </ChartContainer>
        </Box>
      </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: "grid",
            placeItems: "center",
            px: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {emptyLabel}
          </Typography>
        </Box>
      )}
      {maxStart > 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            flexShrink: 0,
            py: 1.5,
          }}
        >
          <Button
            type="button"
            size="small"
            disabled={windowStart === 0}
            aria-label={t("statsTimelineEarlier")}
            onClick={() => moveWindow(windowStart - pageSize)}
            startIcon={<ChevronLeft fontSize="small" />}
            sx={{
              minWidth: 0,
              flexShrink: 0,
              px: 0.75,
              py: 0.25,
              fontSize: 12,
              fontWeight: 700,
              textTransform: "none",
              whiteSpace: "nowrap",
              color: windowStart > 0 ? JOSES_ACCENT : "text.disabled",
            }}
          >
            {t("statsTimelineEarlier")}
          </Button>
          <Box
            component="input"
            type="range"
            min={0}
            max={maxStart}
            step={1}
            value={windowStart}
            aria-label={t("statsTimelineScroll")}
            onChange={(event) => moveWindow(Number(event.target.value))}
            sx={{
              flex: 1,
              minWidth: 0,
              accentColor: JOSES_ACCENT,
              cursor: "pointer",
            }}
          />
          <Button
            type="button"
            size="small"
            disabled={windowStart === maxStart}
            aria-label={t("statsTimelineLater")}
            onClick={() => moveWindow(windowStart + pageSize)}
            endIcon={<ChevronRight fontSize="small" />}
            sx={{
              minWidth: 0,
              flexShrink: 0,
              px: 0.75,
              py: 0.25,
              fontSize: 12,
              fontWeight: 700,
              textTransform: "none",
              whiteSpace: "nowrap",
              color: windowStart < maxStart ? JOSES_ACCENT : "text.disabled",
            }}
          >
            {t("statsTimelineLater")}
          </Button>
        </Box>
      ) : null}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
          maxHeight: 72,
          overflow: "auto",
          pt: 0.75,
          flexShrink: 0,
        }}
      >
        {ordered.map((player) => {
          const off = hidden.has(player.playerId);
          return (
            <Box
              key={player.playerId}
              component="button"
              type="button"
              aria-pressed={!off}
              onClick={() =>
                setHiddenIds((current) =>
                  current.includes(player.playerId)
                    ? current.filter((id) => id !== player.playerId)
                    : [...current, player.playerId]
                )
              }
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                border: 0,
                background: "transparent",
                cursor: "pointer",
                font: "inherit",
                fontSize: 12,
                fontWeight: highlight.has(player.playerId) ? 700 : 500,
                color: off ? "text.disabled" : "text.primary",
                px: 0.25,
                py: 0.25,
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  bgcolor: colorFor(player.playerId),
                  opacity: off ? 0.35 : 1,
                }}
              />
              {player.name}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

type StatsProps = {
  timeline: CoefficientTimeline;
  highlightPlayerId: number | null;
  title: string;
  hint: string;
  emptyLabel: string;
};

export function StatsJosesCoefficientTimeline({
  timeline,
  highlightPlayerId,
  title,
  hint,
  emptyLabel,
}: StatsProps) {
  const { t } = useTranslation();
  const [onlyMine, setOnlyMine] = useState({ card: false, full: false });
  const points = useMemo(
    () =>
      mapTimelineScores(timeline, (stock) =>
        computeJosesCoefficient(timelineStockToJosesInput(stock))
      ),
    [timeline]
  );
  const playersFor = (full: boolean) => {
    const mine = full ? onlyMine.full : onlyMine.card;
    if (!mine || highlightPlayerId == null) return timeline.players;
    return timeline.players.filter(
      (player) => player.playerId === highlightPlayerId
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        height: "100%",
        gridRow: "span 2",
        minHeight: { xs: 440, sm: 520 },
      }}
    >
      <LabExpandable
        title={title}
        hint={hint}
        kind="chart"
        tile
        actions={
          highlightPlayerId == null
            ? undefined
            : (full) => {
                const mine = full ? onlyMine.full : onlyMine.card;
                const label = mine
                  ? t("statsTimelineEverybody")
                  : t("statsTimelineOnlyMine");
                return (
                  <Tooltip title={label}>
                    <IconButton
                      size="small"
                      aria-pressed={mine}
                      aria-label={label}
                      onClick={() =>
                        setOnlyMine((current) =>
                          full
                            ? { ...current, full: !current.full }
                            : { ...current, card: !current.card }
                        )
                      }
                      sx={{
                        color: mine ? "primary.main" : "text.secondary",
                      }}
                    >
                      <Person fontSize="small" />
                    </IconButton>
                  </Tooltip>
                );
              }
        }
      >
        {(full) => (
          <Box
            sx={{ width: "100%", height: "100%", minWidth: 0, minHeight: 0 }}
          >
            <JosesCoefficientTimelinePlot
              players={playersFor(full)}
              points={points}
              highlightPlayerIds={
                highlightPlayerId == null ? [] : [highlightPlayerId]
              }
              emptyLabel={emptyLabel}
              formatValue={(value) => formatJosesCoefficient(value)}
              digits={1}
            />
          </Box>
        )}
      </LabExpandable>
    </Box>
  );
}
