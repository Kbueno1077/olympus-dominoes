"use client";

import { LANGUAGES } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import { useHasMounted } from "@/hooks/useHasMounted";
import type { BotBrainId } from "@/lib/play/botBrain";
import type { GameLogEntry } from "@/lib/play/types";
import PlayLog from "@/modules/Play/PlayLog";
import PlayPaceSliders from "@/modules/Play/PlayPaceSliders";
import {
  animLevelFromMs,
  botLevelFromMs,
} from "@/modules/Play/paceLevels";
import { pressableRowSx, pressableSx, tapFeedback } from "@/modules/Play/pressFeedback";
import { isGameStartedRecoil } from "@/recoil/recoilState";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import CallMergeOutlined from "@mui/icons-material/CallMergeOutlined";
import ScienceOutlined from "@mui/icons-material/ScienceOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CompareArrowsOutlined from "@mui/icons-material/CompareArrowsOutlined";
import EmojiEventsOutlined from "@mui/icons-material/EmojiEventsOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import LeaderboardOutlined from "@mui/icons-material/LeaderboardOutlined";
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
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
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

  const difficultyOptions = useMemo(
    () =>
      [
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
      {
        href: "/tools",
        label: t("mergeNav"),
        match: (p: string) => p === "/tools" || p.startsWith("/tools/"),
        Icon: CallMergeOutlined,
        gated: true,
      },
      {
        href: "/f-lab",
        label: t("fLabNav"),
        match: (p: string) => p === "/f-lab" || p.startsWith("/f-lab/"),
        Icon: ScienceOutlined,
        gated: true,
      },
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
              <PlayPaceSliders
                botDelayMs={pace.botDelayMs}
                onBotDelay={pace.onBotDelay}
                animMs={pace.animMs}
                onAnimMs={pace.onAnimMs}
              />
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
                  {selectedDifficulty?.label ?? t("playBotBrainPimc")}
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
                    {"gated" in item && item.gated ? (
                      <LockOutlined
                        sx={{ fontSize: 16, color: "text.secondary", ml: 0.5 }}
                      />
                    ) : null}
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
