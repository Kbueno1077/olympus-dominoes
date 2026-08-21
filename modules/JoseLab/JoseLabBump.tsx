"use client";

import type { FormulaId } from "@/lib/joseLab/compute";
import { personName, type LabPlayer } from "@/lib/joseLab/data";
import {
  Box,
  Button,
  Popover,
  Stack,
  TableCell,
  Typography,
} from "@mui/material";
import { useState, type MouseEvent } from "react";

export type CountKey = "G" | "W" | "L";
export type DeltaKey = "dDW" | "dPF" | "dPo" | "dZap";
export type StockKey =
  | "HF"
  | "HA"
  | "PF"
  | "PA"
  | "PoF"
  | "PoA"
  | "ZapF"
  | "ZapA";
export type BumpKey = CountKey | DeltaKey | StockKey;
export type Extras = Partial<Record<BumpKey, number>>;
export type ExtraMap = Record<string, Extras>;

const COUNT_STEPS = [1, 5, 10, 25] as const;
const POINT_STEPS = [10, 50, 100, 250] as const;
const SMALL_STEPS = [1, 2, 5, 10] as const;

const bumpBtnSx = {
  minWidth: 0,
  px: 0.6,
  py: 0.1,
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.4,
  fontFamily: "ui-monospace, Menlo, monospace",
} as const;

export function stepsFor(key: BumpKey): readonly number[] {
  switch (key) {
    case "G":
    case "W":
    case "L":
    case "dDW":
    case "HF":
    case "HA":
      return COUNT_STEPS;
    case "dPF":
    case "PF":
    case "PA":
      return POINT_STEPS;
    case "dPo":
    case "dZap":
    case "PoF":
    case "PoA":
    case "ZapF":
    case "ZapA":
      return SMALL_STEPS;
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

export function fieldLabel(key: BumpKey): string {
  switch (key) {
    case "G":
      return "G";
    case "W":
      return "W";
    case "L":
      return "L";
    case "dDW":
      return "ΔDW";
    case "dPF":
      return "ΔPF";
    case "dPo":
      return "ΔPo";
    case "dZap":
      return "ΔZap";
    case "HF":
      return "HF";
    case "HA":
      return "HA";
    case "PF":
      return "PF";
    case "PA":
      return "PA";
    case "PoF":
      return "PoF";
    case "PoA":
      return "PoA";
    case "ZapF":
      return "ZapF";
    case "ZapA":
      return "ZapA";
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

function minLive(key: BumpKey): number | null {
  switch (key) {
    case "G":
      return 1;
    case "W":
    case "L":
    case "HF":
    case "HA":
    case "PF":
    case "PA":
    case "PoF":
    case "PoA":
    case "ZapF":
    case "ZapA":
      return 0;
    case "dDW":
    case "dPF":
    case "dPo":
    case "dZap":
      return null;
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

function signedInt(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

export function formatField(key: BumpKey, n: number): string {
  switch (key) {
    case "dDW":
    case "dPF":
    case "dPo":
    case "dZap":
      return signedInt(n);
    case "G":
    case "W":
    case "L":
    case "HF":
    case "HA":
    case "PF":
    case "PA":
    case "PoF":
    case "PoA":
    case "ZapF":
    case "ZapA":
      return String(n);
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

export function fieldValue(player: LabPlayer, key: BumpKey): number {
  switch (key) {
    case "G":
      return player.G;
    case "W":
      return player.W;
    case "L":
      return player.L;
    case "dDW":
      return player.dDW;
    case "dPF":
      return player.dPF;
    case "dPo":
      return player.dPo;
    case "dZap":
      return player.dZap;
    case "HF":
      return player.HF ?? 0;
    case "HA":
      return player.HA ?? 0;
    case "PF":
      return player.PF ?? 0;
    case "PA":
      return player.PA ?? 0;
    case "PoF":
      return player.PoF ?? 0;
    case "PoA":
      return player.PoA ?? 0;
    case "ZapF":
      return player.ZapF ?? 0;
    case "ZapA":
      return player.ZapA ?? 0;
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

function addOpt(
  base: number | undefined,
  extra: number | undefined
): number | undefined {
  if (base == null) return undefined;
  return base + (extra ?? 0);
}

export function applyExtras(
  stock: LabPlayer,
  extra: Extras | undefined
): LabPlayer {
  const e = extra ?? {};
  const extraW = e.W ?? 0;
  const extraL = e.L ?? 0;
  const extraG = e.G ?? 0;
  const HF = addOpt(stock.HF, e.HF);
  const HA = addOpt(stock.HA, e.HA);
  const PF = addOpt(stock.PF, e.PF);
  const PA = addOpt(stock.PA, e.PA);
  const PoF = addOpt(stock.PoF, e.PoF);
  const PoA = addOpt(stock.PoA, e.PoA);
  const ZapF = addOpt(stock.ZapF, e.ZapF);
  const ZapA = addOpt(stock.ZapA, e.ZapA);
  return {
    ...stock,
    W: Math.max(0, stock.W + extraW),
    L: Math.max(0, stock.L + extraL),
    G: Math.max(1, stock.G + extraW + extraL + extraG),
    dDW: HF != null && HA != null ? HF - HA : stock.dDW + (e.dDW ?? 0),
    dPF: PF != null && PA != null ? PF - PA : stock.dPF + (e.dPF ?? 0),
    dPo: PoF != null && PoA != null ? PoF - PoA : stock.dPo + (e.dPo ?? 0),
    dZap: ZapF != null && ZapA != null ? ZapF - ZapA : stock.dZap + (e.dZap ?? 0),
    HF,
    HA,
    PF,
    PA,
    PoF,
    PoA,
    ZapF,
    ZapA,
  };
}

function pruneExtras(extra: Extras): Extras | undefined {
  const next: Extras = {};
  (Object.keys(extra) as BumpKey[]).forEach((key) => {
    const value = extra[key];
    if (value != null && value !== 0) next[key] = value;
  });
  return Object.keys(next).length === 0 ? undefined : next;
}

export function bumpExtras(
  map: ExtraMap,
  id: string,
  stock: LabPlayer,
  key: BumpKey,
  delta: number
): ExtraMap {
  const extra = { ...(map[id] ?? {}) };
  extra[key] = (extra[key] ?? 0) + delta;
  const live = applyExtras(stock, extra);
  const min = minLive(key);
  if (min != null && fieldValue(live, key) < min) {
    return map;
  }
  const pruned = pruneExtras(extra);
  const next = { ...map };
  if (pruned == null) delete next[id];
  else next[id] = pruned;
  return next;
}

export function resetField(map: ExtraMap, id: string, key: BumpKey): ExtraMap {
  const extra = map[id];
  if (extra == null) return map;
  const nextExtra = { ...extra };
  delete nextExtra[key];
  const pruned = pruneExtras(nextExtra);
  const next = { ...map };
  if (pruned == null) delete next[id];
  else next[id] = pruned;
  return next;
}

export function resetPerson(map: ExtraMap, id: string): ExtraMap {
  if (!(id in map)) return map;
  const next = { ...map };
  delete next[id];
  return next;
}

export function extraCount(map: ExtraMap): number {
  return Object.keys(map).length;
}

function fieldHint(key: BumpKey): string {
  switch (key) {
    case "G":
      return "Independent games. W–L and nets stay put — extras do not dilute.";
    case "W":
      return "Each win also adds 1 to G. Nets stay put.";
    case "L":
      return "Each loss also adds 1 to G. Nets stay put.";
    case "dDW":
      return "Datas net. G and W–L stay put.";
    case "dPF":
      return "Points net. G and W–L stay put.";
    case "dPo":
      return "Pollos net. G and W–L stay put.";
    case "dZap":
      return "Zapatos net. G and W–L stay put.";
    case "HF":
      return "Hands for. ΔDW = HF − HA.";
    case "HA":
      return "Hands against. ΔDW = HF − HA.";
    case "PF":
      return "Points for. ΔPF = PF − PA.";
    case "PA":
      return "Points against. ΔPF = PF − PA.";
    case "PoF":
      return "Pollos for. ΔPo = PoF − PoA.";
    case "PoA":
      return "Pollos against. ΔPo = PoF − PoA.";
    case "ZapF":
      return "Zapatos for. ΔZap = ZapF − ZapA.";
    case "ZapA":
      return "Zapatos against. ΔZap = ZapF − ZapA.";
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

export function denomHint(formula: FormulaId, G: number): string {
  switch (formula) {
    case "K":
    case "KJ":
      return "no denom · extras in game units (not /G)";
    case "C":
      return `no denom · √(G/2) = ${Math.sqrt(G / 2).toFixed(2)}`;
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function canStep(
  stock: LabPlayer,
  extra: Extras | undefined,
  key: BumpKey,
  delta: number
): boolean {
  const trial = { ...(extra ?? {}) };
  trial[key] = (trial[key] ?? 0) + delta;
  const live = applyExtras(stock, trial);
  const min = minLive(key);
  if (min == null) return true;
  return fieldValue(live, key) >= min;
}

type DenomCtx = {
  formula: FormulaId;
};

function BumpButton({
  player,
  stock,
  extra,
  bumpKey,
  denom,
  onBump,
  onResetField,
  onResetPerson,
}: {
  player: LabPlayer;
  stock: LabPlayer;
  extra: Extras | undefined;
  bumpKey: BumpKey;
  denom?: DenomCtx;
  onBump: (key: BumpKey, delta: number) => void;
  onResetField: (key: BumpKey) => void;
  onResetPerson: () => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const live = fieldValue(player, bumpKey);
  const stockVal = fieldValue(stock, bumpKey);
  const extraVal = extra?.[bumpKey] ?? 0;
  const bumped =
    bumpKey === "G" ? player.G !== stock.G : extraVal !== 0;
  const steps = stepsFor(bumpKey);
  const movesG = bumpKey === "G" || bumpKey === "W" || bumpKey === "L";

  const open = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchor(event.currentTarget);
  };

  return (
    <>
      <Button
        size="small"
        variant={bumped ? "contained" : "outlined"}
        color={bumped ? "warning" : "inherit"}
        onClick={open}
        aria-label={`Bump ${fieldLabel(bumpKey)} for ${personName(player)}`}
        sx={bumpBtnSx}
      >
        {formatField(bumpKey, live)}
      </Button>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Stack sx={{ p: 1.25, minWidth: 228 }} gap={1} onClick={(event) => event.stopPropagation()}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {personName(player)} · {fieldLabel(bumpKey)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", fontFamily: "ui-monospace, Menlo, monospace" }}
            >
              stock {formatField(bumpKey, stockVal)}
              {bumped
                ? ` → live ${formatField(bumpKey, live)} (${signedInt(live - stockVal)})`
                : ""}
            </Typography>
            {movesG && denom ? (
              <Typography
                variant="caption"
                sx={{ display: "block", fontFamily: "ui-monospace, Menlo, monospace" }}
              >
                G {player.G}
                {player.G !== stock.G ? ` (stock ${stock.G})` : ""} ·{" "}
                {denomHint(denom.formula, player.G)}
              </Typography>
            ) : null}
            <Typography variant="caption" color="text.secondary">
              {fieldHint(bumpKey)}
            </Typography>
          </Box>
          <Stack direction="row" gap={0.5} justifyContent="space-between">
            {steps.map((step) => (
              <Button
                key={`down-${step}`}
                size="small"
                variant="outlined"
                color="inherit"
                disabled={!canStep(stock, extra, bumpKey, -step)}
                onClick={() => onBump(bumpKey, -step)}
                sx={{ minWidth: 0, px: 0.75, fontFamily: "ui-monospace, Menlo, monospace" }}
              >
                −{step}
              </Button>
            ))}
          </Stack>
          <Stack direction="row" gap={0.5} justifyContent="space-between">
            {steps.map((step) => (
              <Button
                key={`up-${step}`}
                size="small"
                variant="outlined"
                onClick={() => onBump(bumpKey, step)}
                sx={{ minWidth: 0, px: 0.75, fontFamily: "ui-monospace, Menlo, monospace" }}
              >
                +{step}
              </Button>
            ))}
          </Stack>
          <Stack direction="row" gap={0.5}>
            <Button
              size="small"
              variant="text"
              disabled={extraVal === 0}
              onClick={() => onResetField(bumpKey)}
            >
              Reset {fieldLabel(bumpKey)}
            </Button>
            <Button
              size="small"
              variant="text"
              color="warning"
              disabled={extra == null}
              onClick={onResetPerson}
            >
              Reset person
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}

export function RecordBumpCell({
  player,
  stock,
  extra,
  denom,
  onBump,
  onResetField,
  onResetPerson,
}: {
  player: LabPlayer;
  stock: LabPlayer;
  extra: Extras | undefined;
  denom: DenomCtx;
  onBump: (key: BumpKey, delta: number) => void;
  onResetField: (key: BumpKey) => void;
  onResetPerson: () => void;
}) {
  const keys: CountKey[] = ["G", "W", "L"];
  return (
    <TableCell
      sx={{
        py: 0.4,
        px: 0.75,
        fontSize: 12,
        lineHeight: 1.25,
        whiteSpace: "nowrap",
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace',
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <Stack direction="row" alignItems="center" gap={0.25}>
        {keys.map((key, index) => (
          <Stack key={key} direction="row" alignItems="center" gap={0.25}>
            {index > 0 ? <Box component="span">–</Box> : null}
            <BumpButton
              player={player}
              stock={stock}
              extra={extra}
              bumpKey={key}
              denom={denom}
              onBump={onBump}
              onResetField={onResetField}
              onResetPerson={onResetPerson}
            />
          </Stack>
        ))}
      </Stack>
    </TableCell>
  );
}

export function BumpValueCell({
  player,
  stock,
  extra,
  bumpKey,
  onBump,
  onResetField,
  onResetPerson,
}: {
  player: LabPlayer;
  stock: LabPlayer;
  extra: Extras | undefined;
  bumpKey: BumpKey;
  onBump: (key: BumpKey, delta: number) => void;
  onResetField: (key: BumpKey) => void;
  onResetPerson: () => void;
}) {
  return (
    <TableCell
      align="right"
      sx={{
        py: 0.4,
        px: 0.75,
        fontSize: 12,
        lineHeight: 1.25,
        whiteSpace: "nowrap",
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace',
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <BumpButton
        player={player}
        stock={stock}
        extra={extra}
        bumpKey={bumpKey}
        onBump={onBump}
        onResetField={onResetField}
        onResetPerson={onResetPerson}
      />
    </TableCell>
  );
}
