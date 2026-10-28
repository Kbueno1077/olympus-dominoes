"use client";

import {
  ALL_FORMAT_LABELS,
  TILE_SET_OPTIONS,
  formatIcon,
  tileSetIcon,
} from "@/lib/analytics/modeFormat";
import {
  FORMAT_SECTION_ICON,
  MODE_SECTION_ICON,
  ModeFormatSectionTitle,
  ModeFormatToggleLabel,
  modeFormatToggleGroupSx,
  useModeFormatCopy,
} from "@/modules/Analytics/ModeFormatMark";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";

const compactToggleGroupSx = {
  flexWrap: "wrap",
  gap: 0.5,
  "& .MuiToggleButtonGroup-grouped": {
    borderRadius: "8px !important",
    border: "1px solid",
    borderColor: "divider",
    mx: 0,
  },
  "& .MuiToggleButton-root": {
    flex: "0 0 auto",
    gap: 0.4,
    px: 0.75,
    py: 0.15,
    minHeight: 28,
    fontSize: 12,
    lineHeight: 1.2,
    textTransform: "none" as const,
  },
};

type Props = {
  tileSet: string;
  onTileSet: (next: string) => void;
  modeLabel: string;
  onModeLabel: (next: string) => void;
  /** History: All + every mode / format. Stats-style screens omit All. */
  includeAll?: boolean;
  /** Tighter buttons for a sidebar. */
  compact?: boolean;
};

export default function ModeFormatFilters({
  tileSet,
  onTileSet,
  modeLabel,
  onModeLabel,
  includeAll = false,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const { formatLabel, tileLabel } = useModeFormatCopy();

  const tileOptions = includeAll
    ? (["all", ...TILE_SET_OPTIONS] as const)
    : TILE_SET_OPTIONS;
  const formatOptions = includeAll
    ? (["all", ...ALL_FORMAT_LABELS] as const)
    : ALL_FORMAT_LABELS;

  const groupSx = compact ? compactToggleGroupSx : modeFormatToggleGroupSx;
  const iconSize = compact ? 14 : 16;

  return (
    <Stack spacing={compact ? 1 : 1.5}>
      <Box>
        <ModeFormatSectionTitle icon={MODE_SECTION_ICON} label={t("mode")} />
        <ToggleButtonGroup
          exclusive
          size="small"
          fullWidth={!compact}
          value={tileSet}
          onChange={(_, value: string | null) => {
            if (value) onTileSet(value);
          }}
          sx={groupSx}
        >
          {tileOptions.map((option) => (
            <ToggleButton
              key={option}
              value={option}
              aria-label={tileLabel(option)}
            >
              <ModeFormatToggleLabel icon={tileSetIcon(option)} iconSize={iconSize}>
                {tileLabel(option)}
              </ModeFormatToggleLabel>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box>
        <ModeFormatSectionTitle icon={FORMAT_SECTION_ICON} label={t("format")} />
        <ToggleButtonGroup
          exclusive
          size="small"
          fullWidth={!compact}
          value={modeLabel}
          onChange={(_, value: string | null) => {
            if (value) onModeLabel(value);
          }}
          sx={groupSx}
        >
          {formatOptions.map((mode) => (
            <ToggleButton
              key={mode}
              value={mode}
              aria-label={formatLabel(mode)}
            >
              <ModeFormatToggleLabel icon={formatIcon(mode)} iconSize={iconSize}>
                {formatLabel(mode)}
              </ModeFormatToggleLabel>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Stack>
  );
}
