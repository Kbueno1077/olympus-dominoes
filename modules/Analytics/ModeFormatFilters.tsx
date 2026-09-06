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

type Props = {
  tileSet: string;
  onTileSet: (next: string) => void;
  modeLabel: string;
  onModeLabel: (next: string) => void;
  /** History: All + every mode / format. Stats-style screens omit All. */
  includeAll?: boolean;
};

export default function ModeFormatFilters({
  tileSet,
  onTileSet,
  modeLabel,
  onModeLabel,
  includeAll = false,
}: Props) {
  const { t } = useTranslation();
  const { formatLabel, tileLabel } = useModeFormatCopy();

  const tileOptions = includeAll
    ? (["all", ...TILE_SET_OPTIONS] as const)
    : TILE_SET_OPTIONS;
  const formatOptions = includeAll
    ? (["all", ...ALL_FORMAT_LABELS] as const)
    : ALL_FORMAT_LABELS;

  return (
    <Stack spacing={1.5}>
      <Box>
        <ModeFormatSectionTitle icon={MODE_SECTION_ICON} label={t("mode")} />
        <ToggleButtonGroup
          exclusive
          size="small"
          fullWidth
          value={tileSet}
          onChange={(_, value: string | null) => {
            if (value) onTileSet(value);
          }}
          sx={modeFormatToggleGroupSx}
        >
          {tileOptions.map((option) => (
            <ToggleButton
              key={option}
              value={option}
              aria-label={tileLabel(option)}
            >
              <ModeFormatToggleLabel icon={tileSetIcon(option)}>
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
          fullWidth
          value={modeLabel}
          onChange={(_, value: string | null) => {
            if (value) onModeLabel(value);
          }}
          sx={modeFormatToggleGroupSx}
        >
          {formatOptions.map((mode) => (
            <ToggleButton
              key={mode}
              value={mode}
              aria-label={formatLabel(mode)}
            >
              <ModeFormatToggleLabel icon={formatIcon(mode)}>
                {formatLabel(mode)}
              </ModeFormatToggleLabel>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Stack>
  );
}
