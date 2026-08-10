"use client";

import { LANGUAGES } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import { useHasMounted } from "@/hooks/useHasMounted";
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
import CloseIcon from "@mui/icons-material/Close";
import CompareArrowsOutlined from "@mui/icons-material/CompareArrowsOutlined";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import EmojiEventsOutlined from "@mui/icons-material/EmojiEventsOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import LeaderboardOutlined from "@mui/icons-material/LeaderboardOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import SportsEsportsOutlined from "@mui/icons-material/SportsEsportsOutlined";
import {
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
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { useRecoilValue } from "recoil";

export type PlayPaceControls = {
  botDelayMs: number;
  onBotDelay: (ms: number) => void;
  animMs: number;
  onAnimMs: (ms: number) => void;
};

export type PlayDebugLogControls = {
  logs: GameLogEntry[];
  open: boolean;
  onToggle: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Bot think + animation — omitted on the password gate. */
  pace?: PlayPaceControls | null;
  /** Hand event log — only while a match is in progress. */
  debugLog?: PlayDebugLogControls | null;
};

type PaceAccent = "primary" | "secondary";

function paceSliderSx(accent: PaceAccent) {
  return {
    color: `${accent}.main`,
    height: 8,
    py: 1.25,
    px: 0.5,
    "& .MuiSlider-rail": {
      opacity: 1,
      bgcolor: (theme) => alpha(theme.palette.grey[600], 0.18),
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
        boxShadow: (theme) =>
          `0 0 0 8px ${alpha(theme.palette[accent].main, 0.16)}`,
      },
      "&.Mui-active": {
        boxShadow: (theme) =>
          `0 0 0 10px ${alpha(theme.palette[accent].main, 0.2)}`,
      },
    },
    "& .MuiSlider-mark": {
      width: 4,
      height: 4,
      borderRadius: "50%",
      bgcolor: (theme) => alpha(theme.palette.grey[700], 0.35),
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

/** Compact turtle mark — MUI has no turtle icon. */
function TurtleIcon({ fontSize = 18 }: { fontSize?: number }) {
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
      {/* Shell */}
      <ellipse cx="12" cy="12.5" rx="7.5" ry="5.2" />
      {/* Head */}
      <circle cx="19.2" cy="11.2" r="2.1" />
      {/* Legs */}
      <circle cx="7.2" cy="16.6" r="1.55" />
      <circle cx="16.8" cy="16.6" r="1.55" />
      <circle cx="7.2" cy="8.6" r="1.55" />
      <circle cx="16.2" cy="8.2" r="1.45" />
      {/* Tail */}
      <circle cx="4.6" cy="12.5" r="1.2" />
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

/**
 * Play table settings: pace, site nav, and language (replaces the site header).
 */
export default function PlayConfigDrawer({
  open,
  onClose,
  pace = null,
  debugLog = null,
}: Props) {
  const { t, language, setLanguage } = useTranslation();
  const pathname = usePathname();
  const hasMounted = useHasMounted();
  const isGameStarted = useRecoilValue(isGameStartedRecoil);
  const matchInProgress = hasMounted && isGameStarted;

  const paceMarks = useMemo(
    () => [
      {
        value: PACE_LEVEL_MIN,
        label: (
          <PaceMarkIcon title={t("playSpeedSlow")}>
            <TurtleIcon />
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

  const navItems = useMemo(
    () => [
      {
        href: "/",
        label: t("dashboard"),
        match: (p: string) => p === "/",
        Icon: HomeOutlined,
      },
      {
        href: "/match",
        label: t("navMatch"),
        match: (p: string) => p.startsWith("/match"),
        inProgress: matchInProgress,
        Icon: SportsEsportsOutlined,
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
          overflowY: "scroll",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
          px: { xs: 2, sm: 2.5 },
          py: 2,
          pb: { xs: "max(24px, env(safe-area-inset-bottom))", sm: 2.5 },
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        {pace && (
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                letterSpacing: "0.1em",
                mb: 1.25,
                display: "block",
              }}
            >
              {t("playConfigPace")}
            </Typography>
            <Stack spacing={1.75}>
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
          </Box>
        )}

        {debugLog && (
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                letterSpacing: "0.1em",
                mb: 1.25,
                display: "block",
              }}
            >
              {t("playConfigDebug")}
            </Typography>
            <PlayLog
              logs={debugLog.logs}
              open={debugLog.open}
              onToggle={debugLog.onToggle}
            />
          </Box>
        )}

        <Box>
          <Typography
            variant="overline"
            sx={{
              color: "text.secondary",
              letterSpacing: "0.1em",
              mb: 0.5,
              display: "block",
            }}
          >
            {t("playConfigNav")}
          </Typography>
          <List disablePadding dense sx={{ mx: -1 }}>
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
        </Box>

        <Box>
          <Typography
            variant="overline"
            sx={{
              color: "text.secondary",
              letterSpacing: "0.1em",
              mb: 0.5,
              display: "block",
            }}
          >
            {t("language")}
          </Typography>
          <List disablePadding dense sx={{ mx: -1 }}>
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
        </Box>
      </Box>
    </Drawer>
  );
}
