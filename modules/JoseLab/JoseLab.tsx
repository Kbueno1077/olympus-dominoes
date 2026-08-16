"use client";

import {
  DEFAULT_A,
  DEFAULT_B,
  DEFAULT_C,
  computePlayer,
  equationLines,
  failingPlayerIds,
  checkPlayerIds,
  DEFAULT_RULE_TARGETS_B,
  runChecksA,
  runChecksB,
  runChecksC,
  type Breakdown,
  type CheckResult,
  type FormulaId,
  type RuleTargetsB,
  type WeightsA,
  type WeightsB,
  type WeightsC,
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
  TextField,
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
  br: Breakdown | null;
};

function scoreRows(
  stocks: LabPlayer[],
  extras: ExtraMap,
  formula: FormulaId,
  weightsA: WeightsA,
  weightsB: WeightsB,
  weightsC: WeightsC,
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
      denomCap
    );
    return {
      player,
      stock,
      a: formula === "A" ? br : null,
      b: formula === "B" ? br : null,
      c: formula === "C" ? br : null,
      br,
    };
  });
}

function floorOf(
  formula: FormulaId,
  a: WeightsA,
  b: WeightsB
): number | null {
  switch (formula) {
    case "A":
      return a.floor;
    case "B":
      return b.floor;
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
    case "C":
      return row.c?.r ?? Number.NEGATIVE_INFINITY;
    default: {
      const _never: never = formula;
      return _never;
    }
  }
}

function resetWeights(formula: FormulaId, setA: (w: WeightsA) => void, setB: (w: WeightsB) => void, setC: (w: WeightsC) => void) {
  switch (formula) {
    case "A":
      setA(DEFAULT_A);
      return;
    case "B":
      setB(DEFAULT_B);
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

function RulesPanel({
  checks,
  targetsB,
  onTargetsB,
  onFocus,
}: {
  checks: CheckResult[];
  targetsB: RuleTargetsB;
  onTargetsB: (next: RuleTargetsB) => void;
  onFocus: (id: string) => void;
}) {
  const warnings = checks.filter((check) => !check.pass).length;
  return (
    <Accordion
      disableGutters
      sx={{
        boxShadow: "none",
        border: "1px solid",
        borderColor: warnings ? "warning.main" : "divider",
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
          Rules
        </Typography>
        {warnings > 0 ? (
          <Chip
            size="small"
            color="warning"
            label={warnings}
            sx={{ height: 22, minWidth: 22, fontWeight: 800 }}
          />
        ) : null}
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Most of these are ranking tests, not a target score. Named people are
          stand-ins for a shape of season — a heater, a grinder, an ugly +4 —
          and the formula has to pick a winner between those shapes. Tap a rule
          to pin the people in it.
        </Typography>
        <Stack gap={0.75}>
          {checks.map((check) => {
            const broken = !check.pass;
            return (
              <Box
                key={check.id}
                onClick={() => onFocus(check.id)}
                sx={{
                  cursor: "pointer",
                  borderRadius: 1,
                  px: 1,
                  py: 0.75,
                  border: "1px solid",
                  borderColor: broken ? "warning.main" : "divider",
                  bgcolor: (theme) =>
                    broken ? alpha(theme.palette.warning.main, 0.12) : "transparent",
                  borderLeftWidth: 4,
                  borderLeftColor: broken ? "warning.main" : "success.light",
                }}
              >
                <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {broken ? "Warning · " : "Holding · "}
                    {check.title}
                  </Typography>
                  {check.id === "cesar-anchor" ? (
                    <TextField
                      size="small"
                      type="number"
                      label="target R"
                      value={targetsB.cesarR}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        const cesarR = Number(event.target.value);
                        if (Number.isFinite(cesarR)) onTargetsB({ ...targetsB, cesarR });
                      }}
                      inputProps={{ step: 0.1 }}
                      sx={{ width: 108, "& .MuiInputBase-input": { py: 0.5, fontSize: 12 } }}
                    />
                  ) : null}
                  {check.id === "cesar-weights" ? (
                    <TextField
                      size="small"
                      type="number"
                      label="datasMix"
                      value={targetsB.datasMix}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        const datasMix = Number(event.target.value);
                        if (Number.isFinite(datasMix)) onTargetsB({ ...targetsB, datasMix });
                      }}
                      inputProps={{ step: 0.1, min: 0 }}
                      sx={{ width: 108, "& .MuiInputBase-input": { py: 0.5, fontSize: 12 } }}
                    />
                  ) : null}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {check.rule}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 0.25,
                    fontWeight: 700,
                    fontFamily: "ui-monospace, Menlo, monospace",
                    color: broken ? "warning.dark" : "text.primary",
                  }}
                >
                  {check.live}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </AccordionDetails>
    </Accordion>
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
    case "C":
      return {
        color: JOSE_C,
        label: "Adds to R",
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
      return (
        <>
          {contribCell(br?.games)}
          {parts}
        </>
      );
    case "B":
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
  const [csvPins, setCsvPins] = useState<string[]>([...DEFAULT_CSV_PINS]);
  const [mockPins, setMockPins] = useState<string[]>([...DEFAULT_MOCK_PINS]);
  const [capOn, setCapOn] = useState(false);
  const [denomCapValue, setDenomCapValue] = useState(DENOM_CAP_DEMO);
  const [extras, setExtras] = useState<ExtraMap>({});
  const [targetsB, setTargetsB] = useState<RuleTargetsB>(DEFAULT_RULE_TARGETS_B);

  const denomCap = capOn ? denomCapValue : null;
  const deferredA = useDeferredValue(weightsA);
  const deferredB = useDeferredValue(weightsB);
  const deferredC = useDeferredValue(weightsC);
  const deferredCap = useDeferredValue(denomCap);
  const deferredExtras = useDeferredValue(extras);
  const liveStale =
    deferredA !== weightsA ||
    deferredB !== weightsB ||
    deferredC !== weightsC ||
    deferredCap !== denomCap ||
    deferredExtras !== extras;
  const floor = floorOf(formula, deferredA, deferredB);

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
        deferredCap
      ),
    [formula, deferredA, deferredB, deferredC, deferredCap, deferredExtras]
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
        deferredCap
      ),
    [formula, deferredA, deferredB, deferredC, deferredCap, deferredExtras]
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

  const checks = useMemo(() => {
    switch (formula) {
      case "A":
        return runChecksA(liveReadme, liveTest, deferredA, deferredCap);
      case "B":
        return runChecksB(liveReadme, liveTest, deferredB, deferredCap, targetsB);
      case "C":
        return runChecksC(liveReadme, liveTest, deferredC);
      default: {
        const _never: never = formula;
        return _never;
      }
    }
  }, [formula, deferredA, deferredB, deferredC, deferredCap, liveReadme, liveTest, targetsB]);
  const failIds = useMemo(() => failingPlayerIds(checks), [checks]);

  const focusRule = useCallback((id: string) => {
    const ids = checkPlayerIds(id);
    if (ids.length === 0) return;
    const csv = ids.filter((playerId) => {
      const player = README_PLAYERS.find((row) => row.id === playerId);
      return player ? isCsvPlayer(player) : false;
    });
    const mock = ids.filter((playerId) => !csv.includes(playerId));
    if (csv.length > 0) {
      setCsvPins((pins) => pins.concat(csv.filter((id) => !pins.includes(id))));
    }
    if (mock.length > 0) {
      setMockPins((pins) => pins.concat(mock.filter((id) => !pins.includes(id))));
    }
  }, []);

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
        return [
          {
            id: "kGames",
            label: "kGames",
            min: 0,
            max: 8,
            step: 0.1,
            value: weightsB.kGames,
            onChange: (kGames) => setWeightsB((w) => ({ ...w, kGames })),
          },
          {
            id: "wDatas",
            label: "wDatas",
            min: 0,
            max: 15,
            step: 0.1,
            value: weightsB.wDatas,
            onChange: (wDatas) => setWeightsB((w) => ({ ...w, wDatas })),
          },
          {
            id: "wPoints",
            label: "wPoints",
            min: 0,
            max: 0.5,
            step: 0.01,
            value: weightsB.wPoints,
            onChange: (wPoints) => setWeightsB((w) => ({ ...w, wPoints })),
          },
          {
            id: "wPollos",
            label: "wPollos",
            min: 0,
            max: 20,
            step: 0.5,
            value: weightsB.wPollos,
            onChange: (wPollos) => setWeightsB((w) => ({ ...w, wPollos })),
          },
          {
            id: "wZapatos",
            label: "wZapatos",
            min: 0,
            max: 12,
            step: 0.5,
            value: weightsB.wZapatos,
            onChange: (wZapatos) => setWeightsB((w) => ({ ...w, wZapatos })),
          },
          {
            id: "floor",
            label: "floor",
            min: 1,
            max: 80,
            step: 1,
            value: weightsB.floor,
            onChange: (floor) => setWeightsB((w) => ({ ...w, floor })),
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
            id: "wDatas",
            label: "wDatas",
            min: 0,
            max: 4,
            step: 0.1,
            value: weightsC.wDatas,
            onChange: (wDatas) => setWeightsC((w) => ({ ...w, wDatas })),
          },
          {
            id: "wPoints",
            label: "wPoints",
            min: 0,
            max: 2,
            step: 0.05,
            value: weightsC.wPoints,
            onChange: (wPoints) => setWeightsC((w) => ({ ...w, wPoints })),
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
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Jose’s Coefficient lab
            </Typography>
            <Chip size="small" label="local only" color="warning" />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Move sliders and watch the CSV seasons first (Cesar, Eliecer, Randy,
            Guillermo). Mocks are below — heaters and ugly +4, not real people.
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
            <ToggleButton value="B">B · linear kn shipped</ToggleButton>
            <ToggleButton value="A">A · tanh previous</ToggleButton>
            <ToggleButton value="C">C · √(G/2) example</ToggleButton>
          </ToggleButtonGroup>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              resetWeights(formula, setWeightsA, setWeightsB, setWeightsC);
            }}
          >
            Reset {formula}
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
          {equationLines(formula, weightsA, weightsB, weightsC, denomCap).map((line) => (
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
        {formula === "C" ? null : (
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
        <RulesPanel
          checks={checks}
          targetsB={targetsB}
          onTargetsB={setTargetsB}
          onFocus={focusRule}
        />
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
        hint="Cesar, Ariel, Eliecer, Randy, Guillermo. Pin a row to put that person on the charts."
      >
        <JoseLabCharts
          formula={formula}
          weightsA={deferredA}
          weightsB={deferredB}
          weightsC={deferredC}
          denomCap={deferredCap}
          players={liveReadme}
          scored={scoredReadmeCsv}
          pinnedIds={csvPins}
        />
        <ReadmeTable
          title="CSV seasons · T–G–P, nets, live A and B"
          hint="Tap G, W, L, or a delta to age that person. Wins and losses also add to G. Pin the row to plot."
          rows={scoredReadmeCsv}
          failIds={failIds}
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
          denomCap={deferredCap}
          players={liveMockPlayers}
          scored={scoredMockCharts}
          pinnedIds={mockPins}
        />
        <ReadmeTable
          title="Mock scenarios · T–G–P, nets, live A and B"
          hint="Same bumpers. Pin a row onto the graphs above."
          rows={scoredReadmeMock}
          failIds={failIds}
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
          failIds={failIds}
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
