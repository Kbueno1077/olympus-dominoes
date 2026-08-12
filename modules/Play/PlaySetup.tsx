"use client";

import type { BotBrainId } from "@/lib/play/botBrain";
import type { DominoSetId, PlayModeId } from "@/lib/play/types";
import { useTranslation } from "@/i18n/useTranslation";
import { pressableSx, tapFeedback } from "@/modules/Play/pressFeedback";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import TouchAppOutlined from "@mui/icons-material/TouchAppOutlined";
import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";

type Props = {
  modeId: PlayModeId;
  setId: DominoSetId;
  maxPoints: number;
  botBrain: BotBrainId;
  onMode: (mode: PlayModeId) => void;
  onSet: (set: DominoSetId) => void;
  onMaxPoints: (n: number) => void;
  onBotBrain: (id: BotBrainId) => void;
  onStart: () => void;
};

const MODE_IDS: PlayModeId[] = ["1v1", "2v2", "ffa4"];
const TARGETS = [100, 150, 200] as const;
const FIRST_TO_MIN = 1;

function modeCopy(
  id: PlayModeId
): { titleKey: string; bodyKey: string } {
  switch (id) {
    case "1v1":
      return { titleKey: "playMode1v1Title", bodyKey: "playMode1v1Body" };
    case "2v2":
      return { titleKey: "playMode2v2Title", bodyKey: "playMode2v2Body" };
    case "ffa4":
      return { titleKey: "playModeFfaTitle", bodyKey: "playModeFfaBody" };
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export default function PlaySetup({
  modeId,
  setId,
  maxPoints,
  botBrain,
  onMode,
  onSet,
  onMaxPoints,
  onBotBrain,
  onStart,
}: Props) {
  const { t } = useTranslation();
  const [firstToDraft, setFirstToDraft] = useState(String(maxPoints));

  useEffect(() => {
    setFirstToDraft(String(maxPoints));
  }, [maxPoints]);

  const difficultyOptions = useMemo(
    () =>
      [
        {
          id: "classic" as const,
          label: t("playBotBrainClassic"),
          blurb: t("playBotBrainClassicBlurb"),
        },
        {
          id: "table_sense" as const,
          label: t("playBotBrainTableSense"),
          blurb: t("playBotBrainTableSenseBlurb"),
        },
        {
          id: "pimc" as const,
          label: t("playBotBrainPimc"),
          blurb: t("playBotBrainPimcBlurb"),
        },
      ] satisfies { id: BotBrainId; label: string; blurb: string }[],
    [t]
  );

  const commitFirstTo = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setFirstToDraft(String(maxPoints));
      return;
    }
    const next = Math.max(FIRST_TO_MIN, parsed);
    onMaxPoints(next);
    setFirstToDraft(String(next));
  };

  return (
    <Card
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        maxWidth: { xs: "100%", sm: 720, md: 880 },
        mx: "auto",
        background: `linear-gradient(165deg, ${alpha("#FDF8EE", 0.98)} 0%, ${alpha("#F0E4CF", 0.95)} 100%)`,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[600], 0.2)}`,
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="overline"
            sx={{ color: "secondary.main", letterSpacing: "0.14em" }}
          >
            {t("playSetupOverline")}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontFamily: (theme) => theme.typography.h2.fontFamily,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "primary.dark",
              mt: 0.5,
            }}
          >
            {t("playSetupTitle")}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mt: 1, maxWidth: 48 * 8 }}
          >
            {t("playSetupBody")}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.25,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha("#8A6440", 0.1),
            border: `1px solid ${alpha("#8A6440", 0.28)}`,
          }}
        >
          <TouchAppOutlined
            sx={{ color: "secondary.main", fontSize: 22, mt: 0.15, flexShrink: 0 }}
          />
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 13,
                color: "primary.dark",
                lineHeight: 1.25,
              }}
            >
              {t("playTrainTitle")}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: "block",
                mt: 0.35,
                lineHeight: 1.4,
              }}
            >
              {t("playTrainBody")}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", mb: 1, display: "block" }}
          >
            {t("playMode")}
          </Typography>
          <Stack spacing={1.25}>
            {MODE_IDS.map((id) => {
              const { titleKey, bodyKey } = modeCopy(id);
              const active = modeId === id;
              return (
                <Box
                  key={id}
                  component="button"
                  type="button"
                  onClick={() => onMode(id)}
                  sx={{
                    textAlign: "left",
                    p: 1.5,
                    borderRadius: 2,
                    border: "1.5px solid",
                    borderColor: active
                      ? "primary.main"
                      : alpha("#241D14", 0.12),
                    backgroundColor: active
                      ? alpha("#1F6B58", 0.1)
                      : alpha("#fff", 0.4),
                    cursor: "pointer",
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                    {t(titleKey)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {t(bodyKey)}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Box>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", mb: 1, display: "block" }}
          >
            {t("playSet")}
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={setId}
            onChange={(_e, next) => next && onSet(next)}
          >
            <ToggleButton value="double_six">
              {t("playSetDoubleSix")}
            </ToggleButton>
            <ToggleButton value="double_nine">
              {t("playSetDoubleNine")}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", mb: 1, display: "block" }}
          >
            {t("playFirstToLabel")}
          </Typography>
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {TARGETS.map((preset) => (
                <Chip
                  key={preset}
                  label={preset}
                  clickable
                  onPointerDown={tapFeedback}
                  variant={maxPoints === preset ? "filled" : "outlined"}
                  color={maxPoints === preset ? "primary" : "default"}
                  onClick={() => onMaxPoints(preset)}
                  sx={pressableSx}
                />
              ))}
            </Stack>
            <TextField
              size="small"
              type="number"
              label={t("playFirstToCustom")}
              value={firstToDraft}
              inputProps={{
                min: FIRST_TO_MIN,
                inputMode: "numeric",
              }}
              onChange={(event) => setFirstToDraft(event.target.value)}
              onBlur={() => commitFirstTo(firstToDraft)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commitFirstTo(firstToDraft);
                  (event.target as HTMLInputElement).blur();
                }
              }}
              helperText={t("playFirstToCustomHint", {
                min: FIRST_TO_MIN,
              })}
              fullWidth
              sx={{ maxWidth: 280 }}
            />
          </Stack>
        </Box>

        <Box>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", mb: 1, display: "block" }}
          >
            {t("playConfigBotBrain")}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 1.25, maxWidth: 52 * 8 }}
          >
            {t("playConfigBotBrainBody")}
          </Typography>
          <Stack spacing={1.25}>
            {difficultyOptions.map((option) => {
              const active = botBrain === option.id;
              return (
                <Box
                  key={option.id}
                  component="button"
                  type="button"
                  onPointerDown={tapFeedback}
                  onClick={() => onBotBrain(option.id)}
                  sx={{
                    ...pressableSx,
                    textAlign: "left",
                    p: 1.5,
                    borderRadius: 2,
                    border: "1.5px solid",
                    borderColor: active
                      ? "primary.main"
                      : alpha("#241D14", 0.12),
                    backgroundColor: active
                      ? alpha("#1F6B58", 0.1)
                      : alpha("#fff", 0.4),
                    cursor: "pointer",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                        {option.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {option.blurb}
                      </Typography>
                    </Box>
                    {active ? (
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
        </Box>

        <Button
          variant="contained"
          size="large"
          onPointerDown={tapFeedback}
          onClick={onStart}
          sx={{
            ...pressableSx,
            py: 1.35,
            fontWeight: 700,
            letterSpacing: "0.02em",
            boxShadow: (theme) =>
              `0 10px 24px -12px ${alpha(theme.palette.primary.main, 0.8)}`,
          }}
        >
          {t("playDealMatch")}
        </Button>
      </Stack>
    </Card>
  );
}
