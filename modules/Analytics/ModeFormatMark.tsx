"use client";

import Iconify from "@/components/Iconify";
import {
  FREE_FOR_ALL,
  formatIcon,
  tileSetIcon,
} from "@/lib/analytics/modeFormat";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

export const MODE_SECTION_ICON = "mdi:cards-outline";
export const FORMAT_SECTION_ICON = "mdi:sword-cross";
export const PLAYERS_SECTION_ICON = "mdi:account-group-outline";
export const TARGET_SECTION_ICON = "mdi:flag-outline";

export const modeFormatToggleGroupSx = {
  flexWrap: "wrap",
  gap: 0.75,
  "& .MuiToggleButton-root": {
    flex: "1 1 auto",
    gap: 0.75,
    px: 1,
    textTransform: "none" as const,
  },
};

export function useModeFormatCopy() {
  const { t, modeName } = useTranslation();

  const formatLabel = (mode: string) => {
    if (mode === "all") return t("historyFilterFormatAll");
    if (mode === FREE_FOR_ALL) return t("playModeFfaShort");
    return modeName(mode);
  };

  const tileLabel = (option: string) => {
    if (option === "all") return t("historyFilterFormatAll");
    return t("tileSetOption", { n: option });
  };

  return { formatLabel, tileLabel };
}

export function ModeFormatIcon({
  icon,
  size = 16,
}: {
  icon: string;
  size?: number;
}) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        color: "inherit",
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <Iconify icon={icon} sx={{ width: size, height: size }} />
    </Box>
  );
}

export function ModeFormatSectionTitle({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{ mb: 0.75, minWidth: 0 }}
    >
      <Box sx={{ color: "primary.main", display: "inline-flex", flexShrink: 0 }}>
        <ModeFormatIcon icon={icon} />
      </Box>
      <Typography
        variant="overline"
        component="p"
        sx={{ color: "text.secondary", lineHeight: 1.2 }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

export function ModeFormatToggleLabel({
  icon,
  children,
}: {
  icon: string;
  children: ReactNode;
}) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        minWidth: 0,
      }}
    >
      <ModeFormatIcon icon={icon} />
      {children}
    </Box>
  );
}

/**
 * Inline Mode / Format marks for cards, summaries, and scorepads.
 */
export function ModeFormatMeta({
  modeLabel,
  tileSet,
}: {
  modeLabel?: string | null;
  tileSet?: string | null;
}) {
  const { formatLabel, tileLabel } = useModeFormatCopy();

  const parts: { key: string; icon: string; label: string }[] = [];
  if (tileSet) {
    parts.push({
      key: `tile-${tileSet}`,
      icon: tileSetIcon(tileSet),
      label: tileLabel(tileSet),
    });
  }
  if (modeLabel) {
    parts.push({
      key: `format-${modeLabel}`,
      icon: formatIcon(modeLabel),
      label: formatLabel(modeLabel),
    });
  }

  if (parts.length === 0) return null;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        flexWrap: "wrap",
        columnGap: 1,
        rowGap: 0.25,
        verticalAlign: "middle",
      }}
    >
      {parts.map((part, index) => (
        <Box
          key={part.key}
          component="span"
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}
        >
          {index > 0 ? (
            <Box component="span" sx={{ color: "text.disabled", mx: 0.15 }}>
              ·
            </Box>
          ) : null}
          <ModeFormatIcon icon={part.icon} size={14} />
          {part.label}
        </Box>
      ))}
    </Box>
  );
}
