"use client";

import { LANGUAGES } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import { useHasMounted } from "@/hooks/useHasMounted";
import type { BotBrainId } from "@/lib/play/botBrain";
import type { GameLogEntry } from "@/lib/play/types";
import PlayLog from "@/modules/Play/PlayLog";
import {
  animLevelFromMs,
  animMsFromLevel,
  botLevelFromMs,
  botMsFromLevel,
  PACE_LEVEL_MAX,
  PACE_LEVEL_MIN,
  PACE_LEVEL_NORMAL,
} from "@/modules/Play/paceLevels";
import { pressableRowSx, pressableSx, tapFeedback } from "@/modules/Play/pressFeedback";
import { isGameStartedRecoil } from "@/recoil/recoilState";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import CallMergeOutlined from "@mui/icons-material/CallMergeOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CompareArrowsOutlined from "@mui/icons-material/CompareArrowsOutlined";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import EmojiEventsOutlined from "@mui/icons-material/EmojiEventsOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import LeaderboardOutlined from "@mui/icons-material/LeaderboardOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import SmartToyOutlined from "@mui/icons-material/SmartToyOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { useRecoilValue } from "recoil";

export type PlayPaceControls = {
  botDelayMs: number;
  onBotDelay: (ms: number) => void;
  animMs: number;
  onAnimMs: (ms: number) => void;
};

export type PlayBotBrainControls = {
  id: BotBrainId;
  onChange: (id: BotBrainId) => void;
  /** True once a match has started — brain locked until setup again. */
  locked?: boolean;
};

export type PlayDebugLogControls = {
  logs: GameLogEntry[];
  open: boolean;
  onToggle: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Bot think + animation. */
  pace?: PlayPaceControls | null;
  /** Bot difficulty — locked once a match is underway. */
  botBrain?: PlayBotBrainControls | null;
  /** Hand event log — only while a match is in progress. */
  debugLog?: PlayDebugLogControls | null;
};

type ConfigSection = "pace" | "difficulty" | "debug" | "nav" | "language";

type PaceAccent = "primary" | "secondary";

function paceSliderSx(accent: PaceAccent) {
  return {
    color: `${accent}.main`,
    height: 8,
    py: 1.25,
    px: 0.5,
    "& .MuiSlider-rail": {
      opacity: 1,
      bgcolor: (theme: Theme) => alpha(theme.palette.grey[600], 0.18),
      height: 8,
      borderRadius: 4,
    },
    "& .MuiSlider-track": {
      border: "none",
      height: 8,
      borderRadius: 4,
    },
    "& .MuiSlider-thumb": {
      width: 20,
      height: 20,
      bgcolor: "#fff",
      border: "2px solid currentColor",
      boxShadow: "0 1px 4px rgba(40, 30, 16, 0.22)",
      "&:hover, &.Mui-focusVisible": {
        boxShadow: (theme: Theme) =>
          `0 0 0 8px ${alpha(theme.palette[accent].main, 0.16)}`,
      },
      "&.Mui-active": {
        boxShadow: (theme: Theme) =>
          `0 0 0 10px ${alpha(theme.palette[accent].main, 0.2)}`,
      },
    },
    "& .MuiSlider-mark": {
      width: 4,
      height: 4,
      borderRadius: "50%",
      bgcolor: (theme: Theme) => alpha(theme.palette.grey[700], 0.35),
      "&.MuiSlider-markActive": {
        bgcolor: "currentColor",
        opacity: 0.85,
      },
    },
    "& .MuiSlider-markLabel": {
      top: 28,
      color: "text.secondary",
      lineHeight: 0,
    },
  };
}

/** Compact chess pawn — slow end of the pace slider. */
function ChessPawnIcon({ fontSize = 18 }: { fontSize?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden
      sx={{
        width: fontSize,
        height: fontSize,
        display: "block",
        fill: "currentColor",
      }}
    >
      {/* Head */}
      <circle cx="12" cy="5.2" r="2.6" />
      {/* Collar */}
      <path d="M8.2 9.2c0-.7.6-1.2 1.3-1.2h5c.7 0 1.3.5 1.3 1.2v.9H8.2v-.9z" />
      {/* Body */}
      <path d="M9.1 11.1h5.8l1.7 8.2H7.4l1.7-8.2z" />
      {/* Base */}
      <path d="M6.2 20.4h11.6c.5 0 .9.4.9.9v.5H5.3v-.5c0-.5.4-.9.9-.9z" />
    </Box>
  );
}

function PaceMarkIcon({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box
      component="span"
      title={title}
      aria-label={title}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "inherit",
        "& .MuiSvgIcon-root": { fontSize: 18 },
      }}
    >
      {children}
    </Box>
  );
}

function PaceSliderCard({
  label,
  valueLabel,
  accent,
  children,
}: {
  label: string;
  valueLabel: string;
  accent: PaceAccent;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        pl: 2.25,
        pr: 3,
        pt: 1.5,
        pb: 3.25,
        borderRadius: 2,
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.grey[600], 0.18),
        background: (theme) =>
          `linear-gradient(165deg, ${alpha(theme.palette.grey[50], 0.95)} 0%, ${alpha(
            theme.palette[accent].main,
            0.06
          )} 100%)`,
      }}
    >
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 0.75 }}
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: "text.primary", minWidth: 0 }}
        >
          {label}
        </Typography>
        <Typography
          component="span"
          variant="caption"
          sx={{
            flexShrink: 0,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            px: 0.85,
            py: 0.3,
            borderRadius: 1,
            color: `${accent}.dark`,
            backgroundColor: (theme) =>
              alpha(theme.palette[accent].main, 0.14),
            border: "1px solid",
            borderColor: (theme) => alpha(theme.palette[accent].main, 0.28),
          }}
        >
          {valueLabel}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

const accordionSx = {
  before: {
    boxShadow: "none",
    border: "1px solid",
    borderColor: "divider",
    borderRadius: "12px !important",
    overflow: "hidden",
    bgcolor: "background.paper",
    "&:before": { display: "none" },
    "&.Mui-expanded": { margin: 0 },
  },
  summary: {
    minHeight: 48,
    px: 1.5,
    "&.Mui-expanded": { minHeight: 48 },
    "& .MuiAccordionSummary-content": {
      my: 1,
      "&.Mui-expanded": { my: 1 },
    },
  },
  details: {
    px: 1.5,
    pt: 0,
    pb: 1.75,
  },
} as const;

/**
 * Play table settings: pace, difficulty, site nav, and language.
 */
export default function PlayConfigDrawer({
  open,
  onClose,
  pace = null,
  botBrain = null,
  debugLog = null,
}: Props) {
  const { t, language, setLanguage } = useTranslation() as {
    t: (key: string, values?: Record<string, string | number>) => string;
    language: string;
    setLanguage: (code: string) => void;
  };
  const pathname = usePathname();
  const hasMounted = useHasMounted();
  const isGameStarted = useRecoilValue(isGameStartedRecoil);
  const matchInProgress = hasMounted && isGameStarted;

  const defaultSection: ConfigSection = pace
    ? "pace"
    : botBrain
      ? "difficulty"
      : "nav";
  const [expanded, setExpanded] = useState<ConfigSection | false>(defaultSection);

  useEffect(() => {
    if (!open) return;
    setExpanded(defaultSection);
  }, [open, defaultSection]);

  const paceMarks = useMemo(
    () => [
      {
        value: PACE_LEVEL_MIN,
        label: (
          <PaceMarkIcon title={t("playSpeedSlow")}>
            <ChessPawnIcon />
          </PaceMarkIcon>
        ),
      },
      {
        value: PACE_LEVEL_NORMAL,
        label: (
          <PaceMarkIcon title={t("playSpeedNormal")}>
            <PersonOutlined />
          </PaceMarkIcon>
        ),
      },
      {
        value: PACE_LEVEL_MAX,
        label: (
          <PaceMarkIcon title={t("playSpeedFast")}>
            <DirectionsCarOutlined />
          </PaceMarkIcon>
        ),
      },
    ],
    [t]
  );

  const difficultyOptions = useMemo(
    () =>
      [
        {
          id: "classic" as const,
          label: t("playBotBrainClassic"),
        },
        {
          id: "table_sense" as const,
          label: t("playBotBrainTableSense"),
        },
        {
          id: "pimc" as const,
          label: t("playBotBrainPimc"),
        },
      ] satisfies { id: BotBrainId; label: string }[],
    [t]
  );

  const selectedDifficulty = difficultyOptions.find(
    (option) => option.id === botBrain?.id
  );

  const navItems = useMemo(
    () => [
      {
        href: "/",
        label: t("dashboard"),
        match: (p: string) => p === "/",
        Icon: HomeOutlined,
      },
      {
        href: "/play",
        label: t("navPlay"),
        match: (p: string) => p.startsWith("/play"),
        Icon: SmartToyOutlined,
      },
      {
        href: "/match",
        label: t("navMatch"),
        match: (p: string) => p.startsWith("/match"),
        inProgress: matchInProgress,
        Icon: EditNoteOutlined,
      },
      {
        href: "/history",
        label: t("historyNav"),
        match: (p: string) => p.startsWith("/history"),
        Icon: HistoryOutlined,
      },
      {
        href: "/leaderboard",
        label: t("leaderboardNav"),
        match: (p: string) => p === "/leaderboard" || p.startsWith("/leaderboard/"),
        Icon: LeaderboardOutlined,
      },
      {
        href: "/stats",
        label: t("statsNav"),
        match: (p: string) => p === "/stats" || p.startsWith("/stats/"),
        Icon: BarChartOutlined,
      },
      {
        href: "/compare",
        label: t("compareNav"),
        match: (p: string) => p.startsWith("/compare"),
        Icon: CompareArrowsOutlined,
      },
      {
        href: "/podium",
        label: t("podiumNav"),
        match: (p: string) => p === "/podium" || p.startsWith("/podium/"),
        Icon: EmojiEventsOutlined,
      },
      ...(process.env.NODE_ENV === "development"
        ? [
            {
              href: "/merge",
              label: t("mergeNav"),
              match: (p: string) => p === "/merge" || p.startsWith("/merge/"),
              Icon: CallMergeOutlined,
            },
          ]
        : []),
    ],
    [t, matchInProgress]
  );

  const handleSection =
    (section: ConfigSection) =>
    (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? section : false);
    };

  const languageName =
    LANGUAGES.find((entry) => entry.code === language)?.name ?? language;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          maxWidth: "100%",
          height: "100dvh",
          maxHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "background.paper",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1}
        sx={{
          flexShrink: 0,
          px: { xs: 2, sm: 2.5 },
          pt: { xs: 1.5, sm: 2.5 },
          pb: 1.25,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{ mb: 0.25, fontSize: { xs: 18, sm: undefined } }}
          >
            {t("playConfigTitle")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("playConfigSubtitle")}
          </Typography>
        </Box>
        <IconButton
          onPointerDown={tapFeedback}
          onClick={onClose}
          aria-label={t("playCloseConfig")}
          sx={{ ...pressableSx, flexShrink: 0 }}
        >
          <CloseIcon />
        </IconButton>
      </Stack>

      <Box
        sx={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowX: "hidden",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
          px: { xs: 2, sm: 2.5 },
          py: 1.75,
          pb: { xs: "max(24px, env(safe-area-inset-bottom))", sm: 2.5 },
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
        }}
      >
        {pace && (
          <Accordion
            disableGutters
            expanded={expanded === "pace"}
            onChange={handleSection("pace")}
            sx={accordionSx.before}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={accordionSx.summary}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t("playConfigPace")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("playBotSpeed")} · {botLevelFromMs(pace.botDelayMs)}
                  {" · "}
                  {t("playAnimSpeed")} · {animLevelFromMs(pace.animMs)}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={accordionSx.details}>
              <Stack spacing={1.5}>
                <PaceSliderCard
                  label={t("playBotSpeed")}
                  valueLabel={String(botLevelFromMs(pace.botDelayMs))}
                  accent="primary"
                >
                  <Slider
                    value={botLevelFromMs(pace.botDelayMs)}
                    min={PACE_LEVEL_MIN}
                    max={PACE_LEVEL_MAX}
                    step={1}
                    marks={paceMarks}
                    valueLabelDisplay="off"
                    aria-label={t("playBotSpeed")}
                    onChange={(_e, value) =>
                      pace.onBotDelay(botMsFromLevel(value as number))
                    }
                    sx={paceSliderSx("primary")}
                  />
                </PaceSliderCard>
                <PaceSliderCard
                  label={t("playAnimSpeed")}
                  valueLabel={String(animLevelFromMs(pace.animMs))}
                  accent="secondary"
                >
                  <Slider
                    value={animLevelFromMs(pace.animMs)}
                    min={PACE_LEVEL_MIN}
                    max={PACE_LEVEL_MAX}
                    step={1}
                    marks={paceMarks}
                    valueLabelDisplay="off"
                    aria-label={t("playAnimSpeed")}
                    onChange={(_e, value) =>
                      pace.onAnimMs(animMsFromLevel(value as number))
                    }
                    sx={paceSliderSx("secondary")}
                  />
                </PaceSliderCard>
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        {botBrain && (
          <Accordion
            disableGutters
            expanded={expanded === "difficulty"}
            onChange={handleSection("difficulty")}
            sx={accordionSx.before}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={accordionSx.summary}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t("playConfigBotBrain")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {selectedDifficulty?.label ?? t("playBotBrainClassic")}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={accordionSx.details}>
              <Stack spacing={1}>
                {difficultyOptions.map((option) => {
                  const selected = botBrain.id === option.id;
                  const locked = !!botBrain.locked;
                  return (
                    <Box
                      key={option.id}
                      component="button"
                      type="button"
                      disabled={locked}
                      onPointerDown={locked ? undefined : tapFeedback}
                      onClick={() => {
                        if (locked) return;
                        botBrain.onChange(option.id);
                      }}
                      sx={{
                        ...pressableSx,
                        appearance: "none",
                        WebkitAppearance: "none",
                        font: "inherit",
                        textAlign: "left",
                        color: "inherit",
                        m: 0,
                        boxSizing: "border-box",
                        display: "block",
                        width: "100%",
                        cursor: locked ? "default" : "pointer",
                        opacity: locked && !selected ? 0.55 : 1,
                        px: 1.25,
                        py: 1.1,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: selected
                          ? "primary.main"
                          : (theme) => alpha(theme.palette.grey[600], 0.2),
                        backgroundColor: selected
                          ? (theme) => alpha(theme.palette.primary.main, 0.08)
                          : "transparent",
                        "&:disabled": { cursor: "default" },
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: selected ? 700 : 600,
                            color: "text.primary",
                          }}
                        >
                          {option.label}
                        </Typography>
                        {selected ? (
                          <CheckOutlined
                            sx={{
                              fontSize: 20,
                              color: "primary.main",
                              flexShrink: 0,
                            }}
                          />
                        ) : null}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>

              {botBrain.locked ? (
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 1.25 }}
                >
                  {t("playBotBrainLocked")}
                </Typography>
              ) : null}
            </AccordionDetails>
          </Accordion>
        )}

        {debugLog && (
          <Accordion
            disableGutters
            expanded={expanded === "debug"}
            onChange={handleSection("debug")}
            sx={accordionSx.before}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={accordionSx.summary}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t("playConfigDebug")}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={accordionSx.details}>
              <PlayLog
                logs={debugLog.logs}
                open={debugLog.open}
                onToggle={debugLog.onToggle}
              />
            </AccordionDetails>
          </Accordion>
        )}

        <Accordion
          disableGutters
          expanded={expanded === "nav"}
          onChange={handleSection("nav")}
          sx={accordionSx.before}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={accordionSx.summary}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t("playConfigNav")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ ...accordionSx.details, px: 0.75 }}>
            <List disablePadding dense>
              {navItems.map((item) => {
                const active = item.match(pathname);
                const Icon = item.Icon;
                return (
                  <ListItemButton
                    key={item.href}
                    component={Link}
                    href={item.href}
                    onPointerDown={tapFeedback}
                    onClick={onClose}
                    sx={{
                      ...pressableRowSx,
                      borderRadius: 1,
                      py: 1,
                      borderLeft: "3px solid",
                      borderColor: active
                        ? "primary.main"
                        : item.inProgress
                          ? (theme) => alpha(theme.palette.secondary.main, 0.55)
                          : "transparent",
                      backgroundColor: active
                        ? (theme) => alpha(theme.palette.primary.main, 0.07)
                        : "transparent",
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: active ? "primary.main" : "text.secondary",
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={
                        item.inProgress && !active
                          ? t("navMatchInProgress")
                          : null
                      }
                      primaryTypographyProps={{
                        fontWeight: active ? 700 : 500,
                        fontSize: 14,
                      }}
                      secondaryTypographyProps={{
                        fontSize: 11,
                        color: "text.secondary",
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          expanded={expanded === "language"}
          onChange={handleSection("language")}
          sx={accordionSx.before}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={accordionSx.summary}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t("language")}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {languageName}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ ...accordionSx.details, px: 0.75 }}>
            <List disablePadding dense>
              {LANGUAGES.map((entry) => {
                const selected = entry.code === language;
                return (
                  <ListItemButton
                    key={entry.code}
                    selected={selected}
                    onPointerDown={tapFeedback}
                    onClick={() => setLanguage(entry.code)}
                    sx={{ ...pressableRowSx, borderRadius: 1, py: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, fontSize: 18 }}>
                      <Box component="span" aria-hidden>
                        {entry.flag}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.name}
                      secondary={entry.region}
                      primaryTypographyProps={{
                        fontWeight: selected ? 700 : 500,
                        fontSize: 14,
                      }}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Drawer>
  );
}
