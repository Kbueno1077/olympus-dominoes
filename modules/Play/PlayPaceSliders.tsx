"use client";

import { useTranslation } from "@/i18n/useTranslation";
import {
  animLevelFromMs,
  animMsFromLevel,
  botLevelFromMs,
  botMsFromLevel,
  PACE_LEVEL_MAX,
  PACE_LEVEL_MIN,
  PACE_LEVEL_NORMAL,
} from "@/modules/Play/paceLevels";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import { Box, Slider, Stack, Typography } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { useMemo, type ReactNode } from "react";

export type PlayPaceSlidersProps = {
  botDelayMs: number;
  onBotDelay: (ms: number) => void;
  animMs: number;
  onAnimMs: (ms: number) => void;
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
      <circle cx="12" cy="5.2" r="2.6" />
      <path d="M8.2 9.2c0-.7.6-1.2 1.3-1.2h5c.7 0 1.3.5 1.3 1.2v.9H8.2v-.9z" />
      <path d="M9.1 11.1h5.8l1.7 8.2H7.4l1.7-8.2z" />
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

/** Bot think + tile animation pace — shared by setup and the in-match drawer. */
export default function PlayPaceSliders({
  botDelayMs,
  onBotDelay,
  animMs,
  onAnimMs,
}: PlayPaceSlidersProps) {
  const { t } = useTranslation();

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

  return (
    <Stack spacing={1.5}>
      <PaceSliderCard
        label={t("playBotSpeed")}
        valueLabel={String(botLevelFromMs(botDelayMs))}
        accent="primary"
      >
        <Slider
          value={botLevelFromMs(botDelayMs)}
          min={PACE_LEVEL_MIN}
          max={PACE_LEVEL_MAX}
          step={1}
          marks={paceMarks}
          valueLabelDisplay="off"
          aria-label={t("playBotSpeed")}
          onChange={(_e, value) => onBotDelay(botMsFromLevel(value as number))}
          sx={paceSliderSx("primary")}
        />
      </PaceSliderCard>
      <PaceSliderCard
        label={t("playAnimSpeed")}
        valueLabel={String(animLevelFromMs(animMs))}
        accent="secondary"
      >
        <Slider
          value={animLevelFromMs(animMs)}
          min={PACE_LEVEL_MIN}
          max={PACE_LEVEL_MAX}
          step={1}
          marks={paceMarks}
          valueLabelDisplay="off"
          aria-label={t("playAnimSpeed")}
          onChange={(_e, value) => onAnimMs(animMsFromLevel(value as number))}
          sx={paceSliderSx("secondary")}
        />
      </PaceSliderCard>
    </Stack>
  );
}
