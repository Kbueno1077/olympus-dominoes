"use client";

import {
  mapTimelineScores,
  thinTimelinePoints,
  type CoefficientTimeline,
  type TimelineStock,
} from "@/lib/analytics/coefficientTimeline";
import {
  computePlayer,
  type FormulaId,
  type WeightsC,
  type WeightsK,
} from "@/lib/joseLab/compute";
import type { LabPlayer } from "@/lib/joseLab/data";
import { LIVE_PLAYER_ID_PREFIX } from "@/lib/joseLab/fromDataset";
import { JosesCoefficientTimelinePlot } from "@/modules/Analytics/JosesCoefficientTimelineChart";
import { LabExpandable } from "@/modules/JoseLab/JoseLabExpand";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";

const STRIDES = [1, 2, 5, 10, 25] as const;

type Stride = (typeof STRIDES)[number];

function stockToPlayer(stock: TimelineStock): LabPlayer {
  return {
    id: "timeline",
    name: "",
    W: stock.gamesWon,
    L: stock.gamesLost,
    G: stock.gamesPlayed,
    dDW: stock.handsFor - stock.handsAgainst,
    dPF: stock.pointsFor - stock.pointsAgainst,
    dPo: stock.pollosFor - stock.pollosAgainst,
    dZap: stock.zapatosFor - stock.zapatosAgainst,
    pin: false,
    dataset: "live",
    kind: "csv",
  };
}

function statsIdsFromPins(pinnedIds: readonly string[]): number[] {
  const ids: number[] = [];
  for (const id of pinnedIds) {
    if (!id.startsWith(LIVE_PLAYER_ID_PREFIX)) continue;
    const raw = id.slice(LIVE_PLAYER_ID_PREFIX.length);
    if (!/^\d+$/.test(raw)) continue;
    ids.push(Number(raw));
  }
  return ids;
}

type Props = {
  timeline: CoefficientTimeline;
  formula: FormulaId;
  weightsK: WeightsK;
  weightsC: WeightsC;
  weightsKJ: WeightsK;
  pinnedIds: readonly string[];
};

export default function JoseLabTimeline({
  timeline,
  formula,
  weightsK,
  weightsC,
  weightsKJ,
  pinnedIds,
}: Props) {
  const [stride, setStride] = useState<Stride>(1);
  const highlightPlayerIds = useMemo(
    () => statsIdsFromPins(pinnedIds),
    [pinnedIds]
  );

  const scored = useMemo(
    () =>
      mapTimelineScores(timeline, (stock) => {
        const breakdown = computePlayer(
          stockToPlayer(stock),
          formula,
          weightsK,
          weightsC,
          weightsKJ
        );
        return breakdown ? breakdown.r : null;
      }),
    [timeline, formula, weightsK, weightsC, weightsKJ]
  );

  const shown = useMemo(
    () => thinTimelinePoints(scored, stride),
    [scored, stride]
  );

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
      title="Jose through history"
      hint="Whole save, after each match ends. Sliders rescale the lines. Pins draw thicker. Table bumps are not on this chart."
      kind="chart"
      tile
      header={
        <Stack
          direction="row"
          alignItems="center"
          gap={0.5}
          flexWrap="wrap"
          sx={{ mb: 0.75 }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: "text.secondary", mr: 0.25 }}
          >
            Every
          </Typography>
          {STRIDES.map((step) => {
            const selected = step === stride;
            return (
              <Chip
                key={step}
                size="small"
                label={step === 1 ? "match" : String(step)}
                aria-label={
                  step === 1
                    ? "Plot every match"
                    : `Plot every ${step} matches`
                }
                onClick={() => setStride(step)}
                variant={selected ? "filled" : "outlined"}
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: selected ? 700 : 500,
                }}
              />
            );
          })}
        </Stack>
      }
    >
      <Box sx={{ width: "100%", height: "100%", minWidth: 0, minHeight: 0 }}>
        <JosesCoefficientTimelinePlot
          players={timeline.players}
          points={shown}
          highlightPlayerIds={highlightPlayerIds}
          emptyLabel="No finished matches in this save yet."
          formatValue={(value) => value.toFixed(2)}
          digits={2}
        />
      </Box>
    </LabExpandable>
    </Box>
  );
}
