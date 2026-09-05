"use client";

import {
  DEFAULT_C,
  DEFAULT_K,
  DEFAULT_KJ,
  computePlayer,
  equationLines,
  extraExchange,
  gameExchange,
  kExtraWeights,
  ogExtraWeights,
  rWorthPerUnit,
  type Breakdown,
  type FormulaId,
  type WeightsC,
  type WeightsK,
} from "@/lib/joseLab/compute";
import {
  DEFAULT_CSV_PINS,
  DEFAULT_MOCK_PINS,
  README_PLAYERS,
  TEST_PLAYERS,
  type LabPlayer,
} from "@/lib/joseLab/data";
import {
  BumpValueCell,
  RecordBumpCell,
  applyExtras,
  bumpExtras,
  extraCount,
  resetField,
  resetPerson,
  type BumpKey,
  type ExtraMap,
} from "@/modules/JoseLab/JoseLabBump";
import {
  dashboardAsideSx,
  dashboardMainSx,
  dashboardShellSx,
} from "@/modules/Analytics/dashboardChrome";
import JoseLabCharts, {
  type ChartsPerRow,
} from "@/modules/JoseLab/JoseLabCharts";
import { LabExpandable } from "@/modules/JoseLab/JoseLabExpand";
import Add from "@mui/icons-material/Add";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PushPin from "@mui/icons-material/PushPin";
import PushPinOutlined from "@mui/icons-material/PushPinOutlined";
import Remove from "@mui/icons-material/Remove";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const JOSE_K = "rgb(180, 110, 30)";
const JOSE_C = "rgb(61, 108, 140)";
const JOSE_KJ = "rgb(31, 107, 88)";

const cellSx = {
  py: 0.4,
  px: 0.75,
  fontSize: 12,
  lineHeight: 1.25,
  whiteSpace: "nowrap",
} as const;

const monoSx = {
  ...cellSx,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace',
} as const;

const headSx = {
  ...cellSx,
  fontWeight: 700,
  bgcolor: "background.paper",
} as const;

function isChartsPerRow(value: unknown): value is ChartsPerRow {
  return (
    value === 1 || value === 2 || value === 3 || value === 4 || value === 5
  );
}

function ChartsPerRowStepper({
  value,
  onChange,
}: {
  value: ChartsPerRow;
  onChange: (next: ChartsPerRow) => void;
}) {
  const step = (delta: -1 | 1) => {
    const next = value + delta;
    if (isChartsPerRow(next)) onChange(next);
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.5}
      sx={{
        pl: 1.25,
        pr: 0.4,
        py: 0.25,
        border: "1px solid",
        borderColor: (theme: Theme) => alpha(theme.palette.grey[700], 0.28),
        borderRadius: "10px",
        bgcolor: (theme: Theme) => alpha(theme.palette.background.paper, 0.72),
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: "text.secondary", mr: 0.5 }}
      >
        Charts per row
      </Typography>
      <IconButton
        size="small"
        aria-label="Fewer charts per row"
        disabled={value <= 1}
        onClick={() => step(-1)}
      >
        <Remove fontSize="small" />
      </IconButton>
      <Typography
        aria-live="polite"
        sx={{
          minWidth: 18,
          textAlign: "center",
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
      <IconButton
        size="small"
        aria-label="More charts per row"
        disabled={value >= 5}
        onClick={() => step(1)}
      >
        <Add fontSize="small" />
      </IconButton>
    </Stack>
  );
}

const termPaneSx = {
  p: 1.1,
  minWidth: 0,
  border: "1px solid",
  borderColor: (theme: Theme) => alpha(theme.palette.grey[700], 0.28),
  borderRadius: 1.5,
  bgcolor: (theme: Theme) => alpha(theme.palette.background.paper, 0.92),
  boxShadow: (theme: Theme) =>
    `inset 0 0 0 1px ${alpha(theme.palette.common.white, 0.35)}`,
};

const resetMatchToggleSx = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: 14,
  py: 0.9,
  px: 1.25,
  minHeight: 0,
  lineHeight: 1.75,
  borderRadius: "10px",
} as const;

type ScoredRow = {
  player: LabPlayer;
  stock: LabPlayer;
  k: Breakdown | null;
  c: Breakdown | null;
  kj: Breakdown | null;
  br: Breakdown | null;
};

function scoreRows(
  stocks: LabPlayer[],
  extras: ExtraMap,
  formula: FormulaId,
  weightsK: WeightsK,
  weightsC: WeightsC,
  weightsKJ: WeightsK
): ScoredRow[] {
  return stocks.map((stock) => {
    const player = applyExtras(stock, extras[stock.id]);
    const br = computePlayer(player, formula, weightsK, weightsC, weightsKJ);
    return {
      player,
      stock,
      k: formula === "K" ? br : null,
      c: formula === "C" ? br : null,
      kj: formula === "KJ" ? br : null,
      br,
    };
  });
}

function scoreOf(row: ScoredRow, formula: FormulaId): number {
  switch (formula) {
    case "K":
      return row.k?.r ?? Number.NEGATIVE_INFINITY;
    case "KJ":
      return row.kj?.r ?? Number.NEGATIVE_INFINITY;
    case "C":
      return row.c?.r ?? Number.NEGATIVE_INFINITY;
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function resetWeights(
  formula: FormulaId,
  setK: (w: WeightsK) => void,
  setC: (w: WeightsC) => void,
  setKJ: (w: WeightsK) => void
) {
  switch (formula) {
    case "K":
      setK(DEFAULT_K);
      return;
    case "KJ":
      setKJ(DEFAULT_KJ);
      return;
    case "C":
      setC(DEFAULT_C);
      return;
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function formulaShortName(formula: FormulaId): string {
  switch (formula) {
    case "K":
      return "K(x)";
    case "KJ":
      return "KJ(x)";
    case "C":
      return "OG";
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

type SliderSpec = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

type SliderGroup = {
  id: string;
  title: string | null;
  hint?: string;
  specs: SliderSpec[];
};

type TermColumn = {
  id: string;
  term: string;
  multiplier: SliderSpec;
  divisor: SliderSpec | null;
};

function unitTermColumns(
  weights: WeightsK,
  setWeights: (updater: (w: WeightsK) => WeightsK) => void
): TermColumn[] {
  return [
    {
      id: "dG",
      term: "ΔG",
      multiplier: {
        id: "kGames",
        label: "× kG",
        min: 0,
        max: 8,
        step: 0.1,
        value: weights.kGames,
        onChange: (kGames) => setWeights((w) => ({ ...w, kGames })),
      },
      divisor: null,
    },
    {
      id: "dDW",
      term: "ΔDW",
      multiplier: {
        id: "kDatas",
        label: "× kDW",
        min: 0,
        max: 8,
        step: 0.1,
        value: weights.kDatas,
        onChange: (kDatas) => setWeights((w) => ({ ...w, kDatas })),
      },
      divisor: {
        id: "dwPerGame",
        label: "÷",
        min: 1,
        max: 12,
        step: 0.1,
        value: weights.dwPerGame,
        onChange: (dwPerGame) => setWeights((w) => ({ ...w, dwPerGame })),
      },
    },
    {
      id: "dPF",
      term: "ΔPF",
      multiplier: {
        id: "kPoints",
        label: "× kPF",
        min: 0,
        max: 8,
        step: 0.1,
        value: weights.kPoints,
        onChange: (kPoints) => setWeights((w) => ({ ...w, kPoints })),
      },
      divisor: {
        id: "pfPerGame",
        label: "÷",
        min: 40,
        max: 600,
        step: 5,
        value: weights.pfPerGame,
        onChange: (pfPerGame) => setWeights((w) => ({ ...w, pfPerGame })),
      },
    },
    {
      id: "dPo",
      term: "ΔPo",
      multiplier: {
        id: "kPollos",
        label: "× kPo",
        min: 0,
        max: 8,
        step: 0.1,
        value: weights.kPollos,
        onChange: (kPollos) => setWeights((w) => ({ ...w, kPollos })),
      },
      divisor: {
        id: "pollosPerGame",
        label: "÷",
        min: 1,
        max: 12,
        step: 0.5,
        value: weights.pollosPerGame,
        onChange: (pollosPerGame) =>
          setWeights((w) => ({ ...w, pollosPerGame })),
      },
    },
    {
      id: "dZap",
      term: "ΔZap",
      multiplier: {
        id: "kZapatos",
        label: "× kZap",
        min: 0,
        max: 8,
        step: 0.1,
        value: weights.kZapatos,
        onChange: (kZapatos) => setWeights((w) => ({ ...w, kZapatos })),
      },
      divisor: {
        id: "zapPerPollo",
        label: "zapatos / pollo",
        min: 0,
        max: 1,
        step: 0.05,
        value: weights.zapPerPollo,
        onChange: (zapPerPollo) =>
          setWeights((w) => ({ ...w, zapPerPollo })),
      },
    },
  ];
}

function UnitTermControls({
  columns,
  rail = false,
}: {
  columns: TermColumn[];
  rail?: boolean;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Same term in a column: multiplier on top, divisor under it. ΔG has no
        divisor.
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: { xs: 1, md: 1.5 },
          gridTemplateColumns: rail
            ? "repeat(2, minmax(0, 1fr))"
            : {
                xs: "1fr 1fr",
                sm: "repeat(3, minmax(0, 1fr))",
                md: "repeat(5, minmax(0, 1fr))",
              },
        }}
      >
        {columns.map((column) => (
          <Box
            key={column.id}
            sx={{
              ...termPaneSx,
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, letterSpacing: "0.04em" }}
            >
              {column.term}
            </Typography>
            <LabSlider spec={column.multiplier} />
            {column.divisor ? (
              <LabSlider spec={column.divisor} />
            ) : (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 52,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.disabled">
                  no ÷
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function signedInt(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

function signed(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  const text = n.toFixed(digits);
  if (n > 0) return `+${text}`;
  return text;
}

function LabSlider({ spec }: { spec: SliderSpec }) {
  const [live, setLive] = useState(spec.value);
  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) setLive(spec.value);
  }, [spec.value]);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {spec.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontFamily: "ui-monospace, Menlo, monospace", lineHeight: 1.2 }}
        >
          {spec.step < 0.1 ? live.toFixed(2) : live}
        </Typography>
      </Stack>
      <Slider
        size="small"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={live}
        onChange={(_, value) => {
          if (typeof value !== "number") return;
          dragging.current = true;
          setLive(value);
          startTransition(() => spec.onChange(value));
        }}
        onChangeCommitted={(_, value) => {
          dragging.current = false;
          if (typeof value !== "number") return;
          setLive(value);
          spec.onChange(value);
        }}
        valueLabelDisplay="auto"
        sx={{ py: 0.5, my: 0 }}
      />
    </Box>
  );
}

function LabSection({
  title,
  hint,
  children,
  sx,
}: {
  title: string;
  hint: string;
  children: ReactNode;
  sx?: object;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        minWidth: 0,
        ...sx,
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {hint}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

const EMPTY_FAIL_IDS: Set<string> = new Set();

function LabAccordion({
  title,
  defaultExpanded = false,
  children,
}: {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  return (
    <Accordion
      disableGutters
      defaultExpanded={defaultExpanded}
      sx={{
        boxShadow: "none",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px !important",
        overflow: "hidden",
        bgcolor: "background.paper",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          minHeight: 48,
          px: 1.5,
          "&.Mui-expanded": { minHeight: 48 },
          "& .MuiAccordionSummary-content": {
            my: 1,
            alignItems: "center",
            gap: 1,
            "&.Mui-expanded": { my: 1 },
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

function fmtQty(n: number | null, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const places = abs >= 10 ? digits : abs >= 1 ? 2 : abs >= 0.01 ? 3 : 4;
  const rounded = Math.round(n * 10 ** places) / 10 ** places;
  if (Math.abs(rounded - Math.round(rounded)) < 0.5 / 10 ** places) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(places);
}

function signedQty(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const text = fmtQty(n);
  return n > 0 ? `+${text}` : text;
}

function ExchangeTable({
  formula,
  weightsK,
  weightsC,
  weightsKJ,
  compact = false,
}: {
  formula: FormulaId;
  weightsK: WeightsK;
  weightsC: WeightsC;
  weightsKJ: WeightsK;
  compact?: boolean;
}) {
  const unitWeights = formula === "K" ? weightsK : weightsKJ;
  const extras = (() => {
    switch (formula) {
      case "K":
      case "KJ":
        return extraExchange(kExtraWeights(unitWeights));
      case "C":
        return extraExchange(ogExtraWeights(weightsC));
      default: {
        const _never: never = formula;
        return _never;
      }
    }
  })();
  const vsGame = gameExchange(formula, weightsK, weightsC, weightsKJ);
  const rWorth = rWorthPerUnit(formula, weightsK, weightsC, weightsKJ);
  const among = [
    { left: "1 ΔPo", right: `${fmtQty(extras.poPerZap, 2)} ΔZap` },
    { left: "1 ΔPo", right: `${fmtQty(extras.poPerDw, 2)} ΔDW` },
    { left: "1 ΔDW", right: `${fmtQty(extras.dwPerZap, 2)} ΔZap` },
    { left: "1 ΔDW", right: `${fmtQty(extras.pfPerDw)} ΔPF` },
    { left: "1 ΔPo", right: `${fmtQty(extras.pfPerPo)} ΔPF` },
    { left: "1 ΔZap", right: `${fmtQty(extras.pfPerZap)} ΔPF` },
  ];
  const games = [
    { left: "ΔDW", right: fmtQty(vsGame.dwPerGame, 2) },
    { left: "ΔPF", right: fmtQty(vsGame.pfPerGame) },
    { left: "ΔPo", right: fmtQty(vsGame.poPerGame, 2) },
    { left: "ΔZap", right: fmtQty(vsGame.zapPerGame, 2) },
  ];
  const cellSx = {
    py: 0.45,
    px: 1,
    fontFamily: "ui-monospace, Menlo, monospace",
    fontSize: 12,
    borderColor: "divider",
  };

  const blurb = (() => {
    switch (formula) {
      case "C":
        return `OG has no /G. Read the first table as “+1 of this stat adds this much to R.” √(G/2) is unsigned and is not in these exchanges.`;
      case "K":
      case "KJ":
        return `${formulaShortName(formula)} has no /G. First table: what +1 of each stat adds to R, and how many of that stat make +1 R. Then: how many extras equal one win, and how extras trade with each other.`;
      default: {
        const _never: never = formula;
        return _never;
      }
    }
  })();

  return (
    <Stack gap={1.75}>
      <Typography variant="body2" color="text.secondary" sx={{ display: "block" }}>
        {blurb}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: compact
            ? "1fr"
            : { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        <WorthPane title="+1 of this → R">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cellSx}>Unit</TableCell>
                <TableCell align="right" sx={cellSx}>
                  Adds to R
                </TableCell>
                <TableCell align="right" sx={cellSx}>
                  For +1 R
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rWorth.map((row) => (
                <TableRow key={row.unit}>
                  <TableCell sx={cellSx}>1 {row.unit}</TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontWeight: 700 }}>
                    {signedQty(row.r)}
                  </TableCell>
                  <TableCell align="right" sx={cellSx}>
                    {row.r == null || row.r === 0
                      ? "—"
                      : fmtQty(1 / row.r, 2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </WorthPane>
        <WorthPane
          title={`1 win (ΔG) = ${fmtQty(vsGame.gameR, 2)} R`}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cellSx}>Unit</TableCell>
                <TableCell align="right" sx={cellSx}>
                  Count
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {games.map((row) => (
                <TableRow key={row.left}>
                  <TableCell sx={cellSx}>{row.left}</TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontWeight: 700 }}>
                    {row.right}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </WorthPane>
        <WorthPane title="Extras vs extras">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cellSx}>1 of</TableCell>
                <TableCell align="right" sx={cellSx}>
                  Equals
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {among.map((row) => (
                <TableRow key={`${row.left}-${row.right}`}>
                  <TableCell sx={cellSx}>{row.left}</TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontWeight: 700 }}>
                    {row.right}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </WorthPane>
      </Box>
    </Stack>
  );
}

function WorthPane({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ fontWeight: 800, display: "block", mb: 0.5 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function RulesPanel() {
  return (
    <LabAccordion title="Rules">
      <Typography variant="caption" color="text.secondary">
        No ranking tests yet. We’ll put them back here once the extras mix
        settles.
      </Typography>
    </LabAccordion>
  );
}

function NameCell({
  player,
  pinned,
  onTogglePin,
}: {
  player: LabPlayer;
  pinned: boolean;
  onTogglePin: (id: string) => void;
}) {
  return (
    <TableCell sx={cellSx}>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <IconButton
          size="small"
          aria-label={pinned ? `Unpin ${player.name}` : `Pin ${player.name}`}
          aria-pressed={pinned}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin(player.id);
          }}
          sx={{ p: 0.25 }}
        >
          {pinned ? (
            <PushPin sx={{ fontSize: 16, color: "warning.dark" }} />
          ) : (
            <PushPinOutlined sx={{ fontSize: 16, color: "text.secondary" }} />
          )}
        </IconButton>
        {player.name}
        <Chip
          size="small"
          label={player.kind === "csv" ? "CSV" : "mock"}
          color={player.kind === "csv" ? "primary" : "default"}
          variant="outlined"
          sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
        />
      </Stack>
    </TableCell>
  );
}

function GroupHead({
  children,
  colSpan,
  color,
}: {
  children: ReactNode;
  colSpan: number;
  color: string;
}) {
  return (
    <TableCell
      align="center"
      colSpan={colSpan}
      sx={{
        ...headSx,
        bgcolor: alpha(color, 0.1),
        borderBottom: "none",
        py: 0.35,
      }}
    >
      {children}
    </TableCell>
  );
}

function formulaChrome(formula: FormulaId): {
  color: string;
  label: string;
  cols: string[];
} {
  switch (formula) {
    case "K":
      return {
        color: JOSE_K,
        label: "Adds to R",
        cols: ["ΔG", "ΔDW", "ΔPF", "ΔPo", "ΔZap", "R"],
      };
    case "KJ":
      return {
        color: JOSE_KJ,
        label: "Adds to R",
        cols: ["ΔG", "ΔDW", "ΔPF", "ΔPo", "ΔZap", "R"],
      };
    case "C":
      return {
        color: JOSE_C,
        label: "Adds to F",
        cols: ["√(G/2)", "ΔG", "ΔDW", "ΔPF", "ΔPo", "ΔZap", "R"],
      };
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function breakdownOf(row: ScoredRow, formula: FormulaId): Breakdown | null {
  switch (formula) {
    case "K":
      return row.k;
    case "KJ":
      return row.kj;
    case "C":
      return row.c;
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function contribCell(n: number | null | undefined) {
  const negative = n != null && n < 0;
  const positive = n != null && n > 0;
  return (
    <TableCell
      align="right"
      sx={{
        ...monoSx,
        color: negative ? "error.dark" : positive ? "success.dark" : "text.secondary",
      }}
    >
      {signed(n)}
    </TableCell>
  );
}

function ResultCells({
  formula,
  br,
}: {
  formula: FormulaId;
  br: Breakdown | null;
}) {
  const parts = (
    <>
      {contribCell(br?.datas)}
      {contribCell(br?.pts)}
      {contribCell(br?.po)}
      {contribCell(br?.zap)}
      <TableCell
        align="right"
        sx={{ ...monoSx, fontWeight: 800, color: formulaChrome(formula).color }}
      >
        {signed(br?.r)}
      </TableCell>
    </>
  );
  switch (formula) {
    case "K":
    case "KJ":
      return (
        <>
          {contribCell(br?.games)}
          {parts}
        </>
      );
    case "C":
      return (
        <>
          {contribCell(br?.sqrt)}
          {contribCell(br?.games)}
          {parts}
        </>
      );
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function rowBg(fail: boolean, pin: boolean) {
  if (fail) return (theme: { palette: { error: { main: string } } }) =>
    alpha(theme.palette.error.main, 0.12);
  if (pin) return (theme: { palette: { warning: { main: string } } }) =>
    alpha(theme.palette.warning.main, 0.06);
  return undefined;
}

function ReadmeTable({
  title,
  hint,
  rows,
  failIds,
  formula,
  pinnedIds,
  onTogglePin,
  extras,
  onBump,
  onResetField,
  onResetPerson,
}: {
  title: string;
  hint?: string;
  rows: ScoredRow[];
  failIds: Set<string>;
  formula: FormulaId;
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
  extras: ExtraMap;
  onBump: (id: string, stock: LabPlayer, key: BumpKey, delta: number) => void;
  onResetField: (id: string, key: BumpKey) => void;
  onResetPerson: (id: string) => void;
}) {
  const ranked = [...rows].sort(
    (left, right) => scoreOf(right, formula) - scoreOf(left, formula)
  );

  return (
    <LabExpandable title={title} hint={hint} kind="table">
        <Table size="small">
          <TableHead>
            <TableRow>
              <GroupHead colSpan={3} color="#241D14">
                Player
              </GroupHead>
              <GroupHead colSpan={5} color="#241D14">
                Inputs
              </GroupHead>
              <GroupHead colSpan={formulaChrome(formula).cols.length} color={formulaChrome(formula).color}>
                {formulaChrome(formula).label}
              </GroupHead>
            </TableRow>
            <TableRow>
              {["#", "Name", "T–G–P", "n", "ΔDW", "ΔPF", "ΔPo", "ΔZap", ...formulaChrome(formula).cols].map(
                (h, i) => (
                  <TableCell
                    key={`${h}-${i}`}
                    align={h === "Name" || h === "T–G–P" ? "left" : "right"}
                    sx={headSx}
                  >
                    {h}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {ranked.map((row, index) => {
              const fail = failIds.has(row.player.id);
              const pinned = pinnedIds.includes(row.player.id);
              return (
                <TableRow
                  key={row.player.id}
                  hover
                  onClick={() => onTogglePin(row.player.id)}
                  sx={{
                    cursor: "pointer",
                    bgcolor: rowBg(fail, pinned),
                  }}
                >
                  <TableCell align="right" sx={monoSx}>
                    {index + 1}
                  </TableCell>
                  <NameCell
                    player={row.player}
                    pinned={pinned}
                    onTogglePin={onTogglePin}
                  />
                  <RecordBumpCell
                    player={row.player}
                    stock={row.stock}
                    extra={extras[row.player.id]}
                    denom={{ formula }}
                    onBump={(key, delta) => onBump(row.player.id, row.stock, key, delta)}
                    onResetField={(key) => onResetField(row.player.id, key)}
                    onResetPerson={() => onResetPerson(row.player.id)}
                  />
                  <TableCell align="right" sx={monoSx}>
                    {signedInt(row.player.W - row.player.L)}
                  </TableCell>
                  {(["dDW", "dPF", "dPo", "dZap"] as const).map((key) => (
                    <BumpValueCell
                      key={key}
                      player={row.player}
                      stock={row.stock}
                      extra={extras[row.player.id]}
                      bumpKey={key}
                      onBump={(field, delta) =>
                        onBump(row.player.id, row.stock, field, delta)
                      }
                      onResetField={(field) => onResetField(row.player.id, field)}
                      onResetPerson={() => onResetPerson(row.player.id)}
                    />
                  ))}
                  <ResultCells formula={formula} br={breakdownOf(row, formula)} />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
    </LabExpandable>
  );
}

function TestTable({
  title,
  hint,
  rows,
  failIds,
  formula,
  pinnedIds,
  onTogglePin,
  extras,
  onBump,
  onResetField,
  onResetPerson,
}: {
  title: string;
  hint?: string;
  rows: ScoredRow[];
  failIds: Set<string>;
  formula: FormulaId;
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
  extras: ExtraMap;
  onBump: (id: string, stock: LabPlayer, key: BumpKey, delta: number) => void;
  onResetField: (id: string, key: BumpKey) => void;
  onResetPerson: (id: string) => void;
}) {
  const ranked = [...rows].sort(
    (left, right) => scoreOf(right, formula) - scoreOf(left, formula)
  );

  return (
    <LabExpandable title={title} hint={hint} kind="table">
        <Table size="small">
          <TableHead>
            <TableRow>
              <GroupHead colSpan={3} color="#241D14">
                Player
              </GroupHead>
              <GroupHead colSpan={8} color="#241D14">
                Stocks
              </GroupHead>
              <GroupHead colSpan={formulaChrome(formula).cols.length} color={formulaChrome(formula).color}>
                {formulaChrome(formula).label}
              </GroupHead>
            </TableRow>
            <TableRow>
              {[
                "#",
                "Name",
                "T–G–P",
                "HF",
                "HA",
                "PF",
                "PA",
                "PoF",
                "PoA",
                "ZapF",
                "ZapA",
                ...formulaChrome(formula).cols,
              ].map((h, i) => (
                <TableCell
                  key={`${h}-${i}`}
                  align={h === "Name" || h === "T–G–P" ? "left" : "right"}
                  sx={headSx}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {ranked.map((row, index) => {
              const fail = failIds.has(row.player.id);
              const p = row.player;
              const pinned = pinnedIds.includes(p.id);
              return (
                <TableRow
                  key={p.id}
                  hover
                  onClick={() => onTogglePin(p.id)}
                  sx={{
                    cursor: "pointer",
                    bgcolor: rowBg(fail, pinned),
                  }}
                >
                  <TableCell align="right" sx={monoSx}>
                    {index + 1}
                  </TableCell>
                  <NameCell
                    player={p}
                    pinned={pinned}
                    onTogglePin={onTogglePin}
                  />
                  <RecordBumpCell
                    player={p}
                    stock={row.stock}
                    extra={extras[p.id]}
                    denom={{ formula }}
                    onBump={(key, delta) => onBump(p.id, row.stock, key, delta)}
                    onResetField={(key) => onResetField(p.id, key)}
                    onResetPerson={() => onResetPerson(p.id)}
                  />
                  {(
                    ["HF", "HA", "PF", "PA", "PoF", "PoA", "ZapF", "ZapA"] as const
                  ).map((key) =>
                    row.stock[key] == null ? (
                      <TableCell key={key} align="right" sx={monoSx}>
                        —
                      </TableCell>
                    ) : (
                      <BumpValueCell
                        key={key}
                        player={p}
                        stock={row.stock}
                        extra={extras[p.id]}
                        bumpKey={key}
                        onBump={(field, delta) => onBump(p.id, row.stock, field, delta)}
                        onResetField={(field) => onResetField(p.id, field)}
                        onResetPerson={() => onResetPerson(p.id)}
                      />
                    )
                  )}
                  <ResultCells formula={formula} br={breakdownOf(row, formula)} />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
    </LabExpandable>
  );
}

export default function JoseLab() {
  const [formula, setFormula] = useState<FormulaId>("KJ");
  const [weightsK, setWeightsK] = useState<WeightsK>(DEFAULT_K);
  const [weightsC, setWeightsC] = useState<WeightsC>(DEFAULT_C);
  const [weightsKJ, setWeightsKJ] = useState<WeightsK>(DEFAULT_KJ);
  const [csvPins, setCsvPins] = useState<string[]>([...DEFAULT_CSV_PINS]);
  const [mockPins, setMockPins] = useState<string[]>([...DEFAULT_MOCK_PINS]);
  const [extras, setExtras] = useState<ExtraMap>({});
  const [chartsPerRow, setChartsPerRow] = useState<ChartsPerRow>(3);
  const [showMocks, setShowMocks] = useState(true);

  const deferredK = useDeferredValue(weightsK);
  const deferredC = useDeferredValue(weightsC);
  const deferredKJ = useDeferredValue(weightsKJ);
  const deferredExtras = useDeferredValue(extras);
  const liveStale =
    deferredK !== weightsK ||
    deferredC !== weightsC ||
    deferredKJ !== weightsKJ ||
    deferredExtras !== extras;

  const bump = useCallback(
    (id: string, stock: LabPlayer, key: BumpKey, delta: number) => {
      setExtras((prev) => bumpExtras(prev, id, stock, key, delta));
    },
    []
  );
  const resetOneField = useCallback((id: string, key: BumpKey) => {
    setExtras((prev) => resetField(prev, id, key));
  }, []);
  const resetOnePerson = useCallback((id: string) => {
    setExtras((prev) => resetPerson(prev, id));
  }, []);

  const toggleCsvPin = useCallback((id: string) => {
    setCsvPins((pins) =>
      pins.includes(id) ? pins.filter((pin) => pin !== id) : [...pins, id]
    );
  }, []);
  const toggleMockPin = useCallback((id: string) => {
    setMockPins((pins) =>
      pins.includes(id) ? pins.filter((pin) => pin !== id) : [...pins, id]
    );
  }, []);

  const scoredReadme = useMemo(
    () =>
      scoreRows(
        README_PLAYERS,
        deferredExtras,
        formula,
        deferredK,
        deferredC,
        deferredKJ
      ),
    [formula, deferredK, deferredC, deferredKJ, deferredExtras]
  );
  const scoredTest = useMemo(
    () =>
      scoreRows(
        TEST_PLAYERS,
        deferredExtras,
        formula,
        deferredK,
        deferredC,
        deferredKJ
      ),
    [formula, deferredK, deferredC, deferredKJ, deferredExtras]
  );

  const scoredReadmeCsv = useMemo(
    () => scoredReadme.filter((row) => row.player.kind === "csv"),
    [scoredReadme]
  );
  const scoredReadmeMock = useMemo(
    () => scoredReadme.filter((row) => row.player.kind === "mock"),
    [scoredReadme]
  );
  const scoredTestMock = useMemo(
    () => scoredTest.filter((row) => row.player.kind === "mock"),
    [scoredTest]
  );
  const scoredMockCharts = useMemo(
    () => [...scoredReadmeMock, ...scoredTestMock],
    [scoredReadmeMock, scoredTestMock]
  );
  const liveReadme = useMemo(
    () => scoredReadme.map((row) => row.player),
    [scoredReadme]
  );
  const liveTest = useMemo(
    () => scoredTest.map((row) => row.player),
    [scoredTest]
  );
  const liveMockPlayers = useMemo(
    () => [...liveReadme, ...liveTest],
    [liveReadme, liveTest]
  );
  const bumpCount = extraCount(extras);

  const sliderGroups: SliderGroup[] = (() => {
    switch (formula) {
      case "K":
      case "KJ":
        return [];
      case "C":
        return [
          {
            id: "all",
            title: null,
            specs: [
          {
            id: "kSqrt",
            label: "kSqrt",
            min: 0,
            max: 4,
            step: 0.1,
            value: weightsC.kSqrt,
            onChange: (kSqrt) => setWeightsC((w) => ({ ...w, kSqrt })),
          },
          {
            id: "kGames",
            label: "kGames (ΔG)",
            min: 0,
            max: 4,
            step: 0.1,
            value: weightsC.kGames,
            onChange: (kGames) => setWeightsC((w) => ({ ...w, kGames })),
          },
          {
            id: "dwPerGame",
            label: "datas / win",
            min: 1,
            max: 12,
            step: 0.5,
            value: weightsC.dwPerGame,
            onChange: (dwPerGame) => setWeightsC((w) => ({ ...w, dwPerGame })),
          },
          {
            id: "pfPerGame",
            label: "points / game",
            min: 40,
            max: 300,
            step: 5,
            value: weightsC.pfPerGame,
            onChange: (pfPerGame) => setWeightsC((w) => ({ ...w, pfPerGame })),
          },
          {
            id: "wPollos",
            label: "wPollos",
            min: 0,
            max: 4,
            step: 0.1,
            value: weightsC.wPollos,
            onChange: (wPollos) => setWeightsC((w) => ({ ...w, wPollos })),
          },
          {
            id: "wZapatos",
            label: "wZapatos (2/5)",
            min: 0,
            max: 2,
            step: 0.05,
            value: weightsC.wZapatos,
            onChange: (wZapatos) => setWeightsC((w) => ({ ...w, wZapatos })),
          },
        ],
          },
        ];
      default: {
        const _never: never = formula;
        return _never;
      }
    }
  })();

  const formulaCard = (
    <Card sx={{ p: 1.25 }}>
      <Box
        sx={{
          px: 1.25,
          py: 1,
          mb: 1.25,
          bgcolor: alpha("#241D14", 0.05),
          borderRadius: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, display: "block", mb: 0.5, letterSpacing: "0.04em" }}
        >
          {formulaShortName(formula)}
        </Typography>
        <Box
          sx={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace',
            fontSize: 13,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
          }}
        >
          {equationLines(formula, weightsK, weightsC, weightsKJ).join("\n")}
        </Box>
      </Box>
      {formula === "K" || formula === "KJ" ? (
        <UnitTermControls
          rail
          columns={unitTermColumns(
            formula === "K" ? weightsK : weightsKJ,
            formula === "K" ? setWeightsK : setWeightsKJ
          )}
        />
      ) : (
        <Stack gap={1.5}>
          {sliderGroups.map((group) => (
            <Box key={group.id}>
              {group.title ? (
                <Box sx={{ mb: 0.75 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, display: "block", letterSpacing: "0.04em" }}
                  >
                    {group.title}
                  </Typography>
                  {group.hint ? (
                    <Typography variant="caption" color="text.secondary">
                      {group.hint}
                    </Typography>
                  ) : null}
                </Box>
              ) : null}
              <Box
                sx={{
                  display: "grid",
                  gap: { xs: 0.5, md: 1 },
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                }}
              >
                {group.specs.map((spec) => (
                  <Box key={spec.id} sx={termPaneSx}>
                    <LabSlider spec={spec} />
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );

  return (
    <Box sx={dashboardShellSx}>
      <Box
        sx={[
          dashboardAsideSx,
          { width: { xs: "100%", md: 420, lg: 480 } },
        ]}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            F-lab
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 1.25 }}>
            Sliders live here. The bench uses the full pane — CSV seasons
            first, mocks beside them when the screen is wide enough.
          </Typography>
          <Stack
            direction="row"
            gap={1}
            alignItems="stretch"
            flexWrap="wrap"
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              value={formula}
              onChange={(_, value: FormulaId | null) => {
                if (value) setFormula(value);
              }}
            >
              <ToggleButton value="K">K(x)</ToggleButton>
              <ToggleButton value="KJ">KJ(x)</ToggleButton>
              <ToggleButton value="C">OG · F(x)</ToggleButton>
            </ToggleButtonGroup>
            <Button
              size="small"
              variant="outlined"
              sx={resetMatchToggleSx}
              onClick={() => {
                resetWeights(formula, setWeightsK, setWeightsC, setWeightsKJ);
              }}
            >
              Reset {formulaShortName(formula)}
            </Button>
          </Stack>
        </Box>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: { xs: "visible", md: "auto" },
            overscrollBehavior: { md: "contain" },
            px: 1.5,
            pb: 2,
          }}
        >
          <Stack gap={1.25}>
            {formulaCard}
            <LabAccordion title="Worth" defaultExpanded>
              <ExchangeTable
                compact
                formula={formula}
                weightsK={deferredK}
                weightsC={deferredC}
                weightsKJ={deferredKJ}
              />
            </LabAccordion>
            <RulesPanel />
            {bumpCount > 0 ? (
              <Button size="small" color="warning" onClick={() => setExtras({})}>
                Reset all bumps ({bumpCount})
              </Button>
            ) : null}
          </Stack>
        </Box>
      </Box>

      <Box sx={dashboardMainSx}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={1}
          sx={{ mb: 2 }}
        >
          <ChartsPerRowStepper
            value={chartsPerRow}
            onChange={setChartsPerRow}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={showMocks ? <VisibilityOff /> : <Visibility />}
            onClick={() => setShowMocks((open) => !open)}
            sx={resetMatchToggleSx}
          >
            {showMocks ? "Hide mocks" : "Show mocks"}
          </Button>
        </Stack>
        <Box
          sx={{
            opacity: liveStale ? 0.62 : 1,
            transition: "opacity 120ms linear",
            display: "grid",
            gap: { xs: 3, xl: 2.5 },
            alignItems: "start",
            gridTemplateColumns: "minmax(0, 1fr)",
            // Nested @media — do not mix with MUI `xs` keys or the 0px
            // query wins at every width and the split never applies.
            ...(showMocks
              ? {
                  "@media (min-width: 1920px)": {
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  },
                }
              : null),
          }}
        >
          <LabSection
            title="CSV · real seasons"
            hint="Valhalla (Kevin, Jose, Raulito, Rudelys) plus Cesar, Ariel, Eliecer, Randy, Guillermo. Pin a row to put that person on the charts."
          >
            <JoseLabCharts
              formula={formula}
              weightsK={deferredK}
              weightsC={deferredC}
              weightsKJ={deferredKJ}
              players={liveReadme}
              scored={scoredReadmeCsv}
              pinnedIds={csvPins}
              columns={chartsPerRow}
            />
            <ReadmeTable
              title="CSV seasons · T–G–P, nets, live R"
              hint="Tap G, W, L, or a delta to age that person. Wins and losses also add to G. Pin the row to plot."
              rows={scoredReadmeCsv}
              failIds={EMPTY_FAIL_IDS}
              formula={formula}
              pinnedIds={csvPins}
              onTogglePin={toggleCsvPin}
              extras={deferredExtras}
              onBump={bump}
              onResetField={resetOneField}
              onResetPerson={resetOnePerson}
            />
          </LabSection>

          {showMocks ? (
          <LabSection
            title="Mocks · invented scenarios"
            hint="Heaters, grinders, ugly +4, loud 0-net. Pin rows onto the mock charts — not real people."
          >
            <JoseLabCharts
              formula={formula}
              weightsK={deferredK}
              weightsC={deferredC}
              weightsKJ={deferredKJ}
              players={liveMockPlayers}
              scored={scoredMockCharts}
              pinnedIds={mockPins}
              columns={chartsPerRow}
            />
            <ReadmeTable
              title="Mock scenarios · T–G–P, nets, live R"
              hint="Same bumpers. Pin a row onto the graphs above."
              rows={scoredReadmeMock}
              failIds={EMPTY_FAIL_IDS}
              formula={formula}
              pinnedIds={mockPins}
              onTogglePin={toggleMockPin}
              extras={deferredExtras}
              onBump={bump}
              onResetField={resetOneField}
              onResetPerson={resetOnePerson}
            />
            <TestTable
              title="Mock fixtures · full stocks"
              hint="W/L still add to G. Stock cells bump the matching delta (HF−HA, PF−PA, …)."
              rows={scoredTestMock}
              failIds={EMPTY_FAIL_IDS}
              formula={formula}
              pinnedIds={mockPins}
              onTogglePin={toggleMockPin}
              extras={deferredExtras}
              onBump={bump}
              onResetField={resetOneField}
              onResetPerson={resetOnePerson}
            />
          </LabSection>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
