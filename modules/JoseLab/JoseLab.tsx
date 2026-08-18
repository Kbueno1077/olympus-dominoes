"use client";

import {
  DEFAULT_A,
  DEFAULT_B,
  DEFAULT_C,
  DEFAULT_K2,
  computePlayer,
  equationLines,
  extraExchange,
  gameExchange,
  k2ExtraWeights,
  ogExtraWeights,
  type Breakdown,
  type FormulaId,
  type WeightsA,
  type WeightsB,
  type WeightsC,
  type WeightsK2,
} from "@/lib/joseLab/compute";
import {
  DEFAULT_CSV_PINS,
  DEFAULT_MOCK_PINS,
  README_PLAYERS,
  TEST_PLAYERS,
  isCsvPlayer,
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
import JoseLabCharts from "@/modules/JoseLab/JoseLabCharts";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PushPin from "@mui/icons-material/PushPin";
import PushPinOutlined from "@mui/icons-material/PushPinOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  Chip,
  FormControlLabel,
  IconButton,
  Slider,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
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

const JOSE_A = "#6B4F8A";
const JOSE_B = "rgb(31, 107, 88)";
const JOSE_C = "rgb(61, 108, 140)";
const JOSE_K2 = "rgb(180, 110, 30)";

const DENOM_CAP_DEMO = 40;

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

type ScoredRow = {
  player: LabPlayer;
  stock: LabPlayer;
  a: Breakdown | null;
  b: Breakdown | null;
  c: Breakdown | null;
  k2: Breakdown | null;
  br: Breakdown | null;
};

function scoreRows(
  stocks: LabPlayer[],
  extras: ExtraMap,
  formula: FormulaId,
  weightsA: WeightsA,
  weightsB: WeightsB,
  weightsC: WeightsC,
  weightsK2: WeightsK2,
  denomCap: number | null
): ScoredRow[] {
  return stocks.map((stock) => {
    const player = applyExtras(stock, extras[stock.id]);
    const br = computePlayer(
      player,
      formula,
      weightsA,
      weightsB,
      weightsC,
      weightsK2,
      denomCap
    );
    return {
      player,
      stock,
      a: formula === "A" ? br : null,
      b: formula === "B" ? br : null,
      c: formula === "C" ? br : null,
      k2: formula === "K2" ? br : null,
      br,
    };
  });
}

function floorOf(
  formula: FormulaId,
  a: WeightsA,
  b: WeightsB,
  _k2: WeightsK2
): number | null {
  switch (formula) {
    case "A":
      return a.floor;
    case "B":
      return b.floor;
    case "K2":
      return null;
    case "C":
      return null;
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function scoreOf(row: ScoredRow, formula: FormulaId): number {
  switch (formula) {
    case "A":
      return row.a?.r ?? Number.NEGATIVE_INFINITY;
    case "B":
      return row.b?.r ?? Number.NEGATIVE_INFINITY;
    case "K2":
      return row.k2?.r ?? Number.NEGATIVE_INFINITY;
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
  setA: (w: WeightsA) => void,
  setB: (w: WeightsB) => void,
  setC: (w: WeightsC) => void,
  setK2: (w: WeightsK2) => void
) {
  switch (formula) {
    case "A":
      setA(DEFAULT_A);
      return;
    case "B":
      setB(DEFAULT_B);
      return;
    case "K2":
      setK2(DEFAULT_K2);
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
    case "A":
      return "Tangent (x)";
    case "B":
      return "K(x)";
    case "K2":
      return "K2(x)";
    case "C":
      return "OG";
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function knSliderSpecs<W extends WeightsB>(
  weights: W,
  setWeights: (updater: (w: W) => W) => void
): SliderSpec[] {
  return [
    {
      id: "kGames",
      label: "kGames",
      min: 0,
      max: 8,
      step: 0.1,
      value: weights.kGames,
      onChange: (kGames) => setWeights((w) => ({ ...w, kGames })),
    },
    {
      id: "wDatas",
      label: "wDatas",
      min: 0,
      max: 15,
      step: 0.05,
      value: weights.wDatas,
      onChange: (wDatas) => setWeights((w) => ({ ...w, wDatas })),
    },
    {
      id: "wPoints",
      label: "wPoints",
      min: 0,
      max: 0.5,
      step: 0.01,
      value: weights.wPoints,
      onChange: (wPoints) => setWeights((w) => ({ ...w, wPoints })),
    },
    {
      id: "wPollos",
      label: "wPollos",
      min: 0,
      max: 30,
      step: 0.25,
      value: weights.wPollos,
      onChange: (wPollos) => setWeights((w) => ({ ...w, wPollos })),
    },
    {
      id: "wZapatos",
      label: "wZapatos",
      min: 0,
      max: 12,
      step: 0.25,
      value: weights.wZapatos,
      onChange: (wZapatos) => setWeights((w) => ({ ...w, wZapatos })),
    },
    {
      id: "floor",
      label: "floor",
      min: 1,
      max: 80,
      step: 1,
      value: weights.floor,
      onChange: (floor) => setWeights((w) => ({ ...w, floor })),
    },
  ];
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, ...sx }}>
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
  const rounded = Math.round(n * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < 0.049) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(digits);
}

function ExchangeTable({
  formula,
  weightsA,
  weightsB,
  weightsC,
  weightsK2,
  denomCap,
}: {
  formula: FormulaId;
  weightsA: WeightsA;
  weightsB: WeightsB;
  weightsC: WeightsC;
  weightsK2: WeightsK2;
  denomCap: number | null;
}) {
  const extras = (() => {
    switch (formula) {
      case "A":
        return extraExchange(weightsA);
      case "B":
        return extraExchange(weightsB);
      case "K2":
        return extraExchange(k2ExtraWeights(weightsK2));
      case "C":
        return extraExchange(ogExtraWeights(weightsC));
      default: {
        const _never: never = formula;
        return _never;
      }
    }
  })();
  const vsGame = gameExchange(
    formula,
    weightsA,
    weightsB,
    weightsC,
    weightsK2,
    denomCap
  );
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

  return (
    <Stack gap={1.5}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {formula === "C"
          ? `OG F(x) has no G floor. Datas and points are typical-game units (ΔDW / ${weightsC.dwPerGame}, ΔPF / ${weightsC.pfPerGame}). Pollos and zapatos still add as raw weights. √(G/2) is unsigned, so it is not in this table.`
          : formula === "K2"
            ? `K2 has no /G. 1 win and ${weightsK2.pollosPerGame} pollos are both ${fmtQty(vsGame.gameR, 2)} on R. Datas and points stay raw (ΔDW / ${weightsK2.dwPerGame}, ΔPF / ${weightsK2.pfPerGame}). A zapato is ${weightsK2.zapPerPollo} of a pollo.`
            : `Live from the sliders. Extras share a denom, so pollos vs zapatos vs datas never depends on G. Matching a game does: 1 ΔG is worth ${fmtQty(vsGame.gameR, 2)} on R at denom ${fmtQty(vsGame.denom)} (the floor). Past that, you need more extras per win.`}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 800, display: "block", mb: 0.5 }}>
            1 ΔG equals
          </Typography>
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
        </Box>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 800, display: "block", mb: 0.5 }}>
            Among extras
          </Typography>
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
        </Box>
      </Box>
    </Stack>
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
    case "A":
      return {
        color: JOSE_A,
        label: "Adds to R",
        cols: ["Lead", "ΔDW", "ΔPF", "ΔPo", "ΔZap", "R"],
      };
    case "B":
      return {
        color: JOSE_B,
        label: "Adds to R",
        cols: ["ΔG", "ΔDW", "ΔPF", "ΔPo", "ΔZap", "R"],
      };
    case "K2":
      return {
        color: JOSE_K2,
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
    case "A":
      return row.a;
    case "B":
      return row.b;
    case "K2":
      return row.k2;
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
    case "A":
    case "B":
    case "K2":
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
  floor,
  denomCap,
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
  floor: number | null;
  denomCap: number | null;
  onBump: (id: string, stock: LabPlayer, key: BumpKey, delta: number) => void;
  onResetField: (id: string, key: BumpKey) => void;
  onResetPerson: (id: string) => void;
}) {
  const ranked = [...rows].sort(
    (left, right) => scoreOf(right, formula) - scoreOf(left, formula)
  );

  return (
    <Card sx={{ p: 1.25, overflow: "hidden" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
        {title}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
          {hint}
        </Typography>
      ) : (
        <Box sx={{ mb: 0.75 }} />
      )}
      <Box sx={{ overflowX: "auto" }}>
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
                    denom={{ formula, floor, denomCap }}
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
      </Box>
    </Card>
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
  floor,
  denomCap,
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
  floor: number | null;
  denomCap: number | null;
  onBump: (id: string, stock: LabPlayer, key: BumpKey, delta: number) => void;
  onResetField: (id: string, key: BumpKey) => void;
  onResetPerson: (id: string) => void;
}) {
  const ranked = [...rows].sort(
    (left, right) => scoreOf(right, formula) - scoreOf(left, formula)
  );

  return (
    <Card sx={{ p: 1.25, overflow: "hidden" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
        {title}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
          {hint}
        </Typography>
      ) : (
        <Box sx={{ mb: 0.75 }} />
      )}
      <Box sx={{ overflowX: "auto" }}>
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
                    denom={{ formula, floor, denomCap }}
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
      </Box>
    </Card>
  );
}

export default function JoseLab() {
  const [formula, setFormula] = useState<FormulaId>("B");
  const [weightsA, setWeightsA] = useState<WeightsA>(DEFAULT_A);
  const [weightsB, setWeightsB] = useState<WeightsB>(DEFAULT_B);
  const [weightsC, setWeightsC] = useState<WeightsC>(DEFAULT_C);
  const [weightsK2, setWeightsK2] = useState<WeightsK2>(DEFAULT_K2);
  const [csvPins, setCsvPins] = useState<string[]>([...DEFAULT_CSV_PINS]);
  const [mockPins, setMockPins] = useState<string[]>([...DEFAULT_MOCK_PINS]);
  const [capOn, setCapOn] = useState(false);
  const [denomCapValue, setDenomCapValue] = useState(DENOM_CAP_DEMO);
  const [extras, setExtras] = useState<ExtraMap>({});

  const denomCap = capOn ? denomCapValue : null;
  const deferredA = useDeferredValue(weightsA);
  const deferredB = useDeferredValue(weightsB);
  const deferredC = useDeferredValue(weightsC);
  const deferredK2 = useDeferredValue(weightsK2);
  const deferredCap = useDeferredValue(denomCap);
  const deferredExtras = useDeferredValue(extras);
  const liveStale =
    deferredA !== weightsA ||
    deferredB !== weightsB ||
    deferredC !== weightsC ||
    deferredK2 !== weightsK2 ||
    deferredCap !== denomCap ||
    deferredExtras !== extras;
  const floor = floorOf(formula, deferredA, deferredB, deferredK2);

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
        deferredA,
        deferredB,
        deferredC,
        deferredK2,
        deferredCap
      ),
    [formula, deferredA, deferredB, deferredC, deferredK2, deferredCap, deferredExtras]
  );
  const scoredTest = useMemo(
    () =>
      scoreRows(
        TEST_PLAYERS,
        deferredExtras,
        formula,
        deferredA,
        deferredB,
        deferredC,
        deferredK2,
        deferredCap
      ),
    [formula, deferredA, deferredB, deferredC, deferredK2, deferredCap, deferredExtras]
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

  const sliders: SliderSpec[] = (() => {
    switch (formula) {
      case "A":
        return [
          {
            id: "leadCap",
            label: "leadCap",
            min: 5,
            max: 40,
            step: 1,
            value: weightsA.leadCap,
            onChange: (leadCap) => setWeightsA((w) => ({ ...w, leadCap })),
          },
          {
            id: "leadScale",
            label: "leadScale",
            min: 2,
            max: 20,
            step: 0.5,
            value: weightsA.leadScale,
            onChange: (leadScale) => setWeightsA((w) => ({ ...w, leadScale })),
          },
          {
            id: "leadMix",
            label: "leadMix",
            min: 0,
            max: 4,
            step: 0.1,
            value: weightsA.leadMix,
            onChange: (leadMix) => setWeightsA((w) => ({ ...w, leadMix })),
          },
          {
            id: "wDatas",
            label: "wDatas",
            min: 0,
            max: 15,
            step: 0.1,
            value: weightsA.wDatas,
            onChange: (wDatas) => setWeightsA((w) => ({ ...w, wDatas })),
          },
          {
            id: "wPoints",
            label: "wPoints",
            min: 0,
            max: 0.5,
            step: 0.01,
            value: weightsA.wPoints,
            onChange: (wPoints) => setWeightsA((w) => ({ ...w, wPoints })),
          },
          {
            id: "wPollos",
            label: "wPollos",
            min: 0,
            max: 20,
            step: 0.5,
            value: weightsA.wPollos,
            onChange: (wPollos) => setWeightsA((w) => ({ ...w, wPollos })),
          },
          {
            id: "wZapatos",
            label: "wZapatos",
            min: 0,
            max: 12,
            step: 0.5,
            value: weightsA.wZapatos,
            onChange: (wZapatos) => setWeightsA((w) => ({ ...w, wZapatos })),
          },
          {
            id: "floor",
            label: "floor",
            min: 1,
            max: 80,
            step: 1,
            value: weightsA.floor,
            onChange: (floor) => setWeightsA((w) => ({ ...w, floor })),
          },
        ];
      case "B":
        return knSliderSpecs(weightsB, setWeightsB);
      case "K2":
        return [
          {
            id: "kGames",
            label: "kGames (ΔG)",
            min: 0,
            max: 8,
            step: 0.1,
            value: weightsK2.kGames,
            onChange: (kGames) => setWeightsK2((w) => ({ ...w, kGames })),
          },
          {
            id: "dwPerGame",
            label: "datas / win",
            min: 1,
            max: 12,
            step: 0.1,
            value: weightsK2.dwPerGame,
            onChange: (dwPerGame) => setWeightsK2((w) => ({ ...w, dwPerGame })),
          },
          {
            id: "pfPerGame",
            label: "points / game",
            min: 40,
            max: 300,
            step: 5,
            value: weightsK2.pfPerGame,
            onChange: (pfPerGame) => setWeightsK2((w) => ({ ...w, pfPerGame })),
          },
          {
            id: "pollosPerGame",
            label: "pollos / win",
            min: 1,
            max: 12,
            step: 0.5,
            value: weightsK2.pollosPerGame,
            onChange: (pollosPerGame) =>
              setWeightsK2((w) => ({ ...w, pollosPerGame })),
          },
          {
            id: "zapPerPollo",
            label: "zapatos / pollo",
            min: 0,
            max: 1,
            step: 0.05,
            value: weightsK2.zapPerPollo,
            onChange: (zapPerPollo) =>
              setWeightsK2((w) => ({ ...w, zapPerPollo })),
          },
        ];
      case "C":
        return [
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
        ];
      default: {
        const _never: never = formula;
        return _never;
      }
    }
  })();

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
        px: { xs: 1.5, sm: 2 },
        py: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        flex: "0 0 auto",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        gap={1}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            F-lab
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Move sliders and watch the CSV seasons first (Valhalla, Cesar,
            Eliecer, Randy, Guillermo). Mocks are below — heaters and ugly +4,
            not real people.
          </Typography>
        </Box>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={formula}
            onChange={(_, value: FormulaId | null) => {
              if (value) setFormula(value);
            }}
          >
            <ToggleButton value="B">K(x)</ToggleButton>
            <ToggleButton value="K2">K2(x)</ToggleButton>
            <ToggleButton value="C">OG · F(x)</ToggleButton>
            <ToggleButton value="A">Tangent (x)</ToggleButton>
          </ToggleButtonGroup>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              resetWeights(
                formula,
                setWeightsA,
                setWeightsB,
                setWeightsC,
                setWeightsK2
              );
            }}
          >
            Reset {formulaShortName(formula)}
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ p: 1.25 }}>
        <Box
          sx={{
            px: 1,
            py: 0.75,
            mb: 1,
            bgcolor: alpha("#241D14", 0.05),
            borderRadius: 1,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace',
            fontSize: 13,
            lineHeight: 1.35,
          }}
        >
          {equationLines(
            formula,
            weightsA,
            weightsB,
            weightsC,
            weightsK2,
            denomCap
          ).map((line) => (
            <Box key={line} component="div">
              {line}
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 0.5, md: 1 },
            gridTemplateColumns: {
              xs: "1fr 1fr",
              md: "repeat(4, 1fr)",
            },
          }}
        >
          {sliders.map((spec) => (
            <LabSlider key={spec.id} spec={spec} />
          ))}
        </Box>
        {formula === "C" || formula === "K2" ? null : (
          <>
            <FormControlLabel
              sx={{ mt: 0.5, ml: 0 }}
              control={
                <Switch
                  checked={capOn}
                  color="warning"
                  size="small"
                  onChange={(_, checked) => setCapOn(checked)}
                />
              }
              label="Dangerous: cap denom (demo only)"
            />
            {capOn ? (
              <Box sx={{ maxWidth: 360, mt: 0.5 }}>
                <LabSlider
                  spec={{
                    id: "denomCap",
                    label: "denomCap",
                    min: 10,
                    max: 80,
                    step: 1,
                    value: denomCapValue,
                    onChange: setDenomCapValue,
                  }}
                />
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Point stocks will eat n. A top cap on denom is the wrong
                  reliability knob — extras stop dying as G grows.
                </Alert>
              </Box>
            ) : null}
          </>
        )}
      </Card>

      <Box
        sx={{
          opacity: liveStale ? 0.62 : 1,
          transition: "opacity 120ms linear",
        }}
      >
      <Stack gap={1}>
        <LabAccordion title="Worth" defaultExpanded>
          <ExchangeTable
            formula={formula}
            weightsA={deferredA}
            weightsB={deferredB}
            weightsC={deferredC}
            weightsK2={deferredK2}
            denomCap={deferredCap}
          />
        </LabAccordion>
        <RulesPanel />
        {bumpCount > 0 ? (
          <Box>
            <Button size="small" color="warning" onClick={() => setExtras({})}>
              Reset all bumps ({bumpCount})
            </Button>
          </Box>
        ) : null}
      </Stack>

      <LabSection
        title="CSV · real seasons"
        hint="Valhalla (Kevin, Jose, Raulito, Rudelys) plus Cesar, Ariel, Eliecer, Randy, Guillermo. Pin a row to put that person on the charts."
        sx={{ mt: 4 }}
      >
        <JoseLabCharts
          formula={formula}
          weightsA={deferredA}
          weightsB={deferredB}
          weightsC={deferredC}
          weightsK2={deferredK2}
          denomCap={deferredCap}
          players={liveReadme}
          scored={scoredReadmeCsv}
          pinnedIds={csvPins}
        />
        <ReadmeTable
          title="CSV seasons · T–G–P, nets, live A and B"
          hint="Tap G, W, L, or a delta to age that person. Wins and losses also add to G. Pin the row to plot."
          rows={scoredReadmeCsv}
          failIds={EMPTY_FAIL_IDS}
          formula={formula}
          pinnedIds={csvPins}
          onTogglePin={toggleCsvPin}
          extras={deferredExtras}
          floor={floor}
          denomCap={deferredCap}
          onBump={bump}
          onResetField={resetOneField}
          onResetPerson={resetOnePerson}
        />
      </LabSection>

      <LabSection
        title="Mocks · invented scenarios"
        hint="Heaters, grinders, ugly +4, loud 0-net. Pin rows onto the mock charts — not real people."
        sx={{
          mt: 4,
          pt: 3,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <JoseLabCharts
          formula={formula}
          weightsA={deferredA}
          weightsB={deferredB}
          weightsC={deferredC}
          weightsK2={deferredK2}
          denomCap={deferredCap}
          players={liveMockPlayers}
          scored={scoredMockCharts}
          pinnedIds={mockPins}
        />
        <ReadmeTable
          title="Mock scenarios · T–G–P, nets, live A and B"
          hint="Same bumpers. Pin a row onto the graphs above."
          rows={scoredReadmeMock}
          failIds={EMPTY_FAIL_IDS}
          formula={formula}
          pinnedIds={mockPins}
          onTogglePin={toggleMockPin}
          extras={deferredExtras}
          floor={floor}
          denomCap={deferredCap}
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
          floor={floor}
          denomCap={deferredCap}
          onBump={bump}
          onResetField={resetOneField}
          onResetPerson={resetOnePerson}
        />
      </LabSection>
      </Box>
    </Box>
  );
}
