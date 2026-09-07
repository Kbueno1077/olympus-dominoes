"use client";

import type { BotBrainId } from "@/lib/play/botBrain";
import type { DominoSetId, DrawRuleId, PlayModeId } from "@/lib/play/types";
import {
  formatIcon,
  formatLabelFromPlayModeId,
  tileSetFromDominoSetId,
  tileSetIcon,
} from "@/lib/analytics/modeFormat";
import {
  FORMAT_SECTION_ICON,
  MODE_SECTION_ICON,
  ModeFormatIcon,
  ModeFormatToggleLabel,
  TARGET_SECTION_ICON,
} from "@/modules/Analytics/ModeFormatMark";
import { useTranslation } from "@/i18n/useTranslation";
import PlayPaceSliders from "@/modules/Play/PlayPaceSliders";
import { pressableSx, tapFeedback } from "@/modules/Play/pressFeedback";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type Props = {
  modeId: PlayModeId;
  setId: DominoSetId;
  maxPoints: number;
  drawRule: DrawRuleId;
  botBrain: BotBrainId;
  botDelayMs: number;
  animMs: number;
  onMode: (mode: PlayModeId) => void;
  onSet: (set: DominoSetId) => void;
  onMaxPoints: (n: number) => void;
  onDrawRule: (id: DrawRuleId) => void;
  onBotBrain: (id: BotBrainId) => void;
  onBotDelay: (ms: number) => void;
  onAnimMs: (ms: number) => void;
  onStart: () => void;
};

const MODE_IDS: PlayModeId[] = ["1v1", "2v2", "ffa4"];
const DRAW_RULE_IDS: DrawRuleId[] = [
  "classic",
  "wash",
  "gambler",
  "reversed",
];
const TARGETS = [100, 150, 200] as const;
const FIRST_TO_MIN = 1;

function modeTitleKey(id: PlayModeId): string {
  switch (id) {
    case "1v1":
      return "playMode1v1Title";
    case "2v2":
      return "playMode2v2Title";
    case "ffa4":
      return "playModeFfaShort";
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function drawRuleCopy(
  id: DrawRuleId
): { titleKey: string; bodyKey: string } {
  switch (id) {
    case "classic":
      return {
        titleKey: "playDrawRuleClassicTitle",
        bodyKey: "playDrawRuleClassicBody",
      };
    case "wash":
      return {
        titleKey: "playDrawRuleWashTitle",
        bodyKey: "playDrawRuleWashBody",
      };
    case "gambler":
      return {
        titleKey: "playDrawRuleGamblerTitle",
        bodyKey: "playDrawRuleGamblerBody",
      };
    case "reversed":
      return {
        titleKey: "playDrawRuleReversedTitle",
        bodyKey: "playDrawRuleReversedBody",
      };
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

const BOT_SECTION_ICON = "mdi:robot-outline";
const DRAW_SECTION_ICON = "mdi:shuffle-variant";
const PACE_SECTION_ICON = "mdi:timer-outline";

const setupChoiceGroupSx = {
  display: "flex",
  flexWrap: "nowrap",
  gap: 1,
  width: "100%",
  "& .MuiToggleButton-root": {
    flex: "1 1 0",
    minWidth: 0,
    minHeight: 40,
    gap: 0.75,
    px: 1.25,
    py: 0.875,
    border: "1px solid",
    borderColor: (theme: Theme) => alpha(theme.palette.text.secondary, 0.16),
    borderRadius: "10px !important",
    color: "text.secondary",
    backgroundColor: "background.default",
    "&:not(:first-of-type)": {
      borderLeft: "1px solid",
      borderLeftColor: (theme: Theme) =>
        alpha(theme.palette.text.secondary, 0.16),
      ml: 0,
    },
    "&:hover": {
      backgroundColor: (theme: Theme) =>
        alpha(theme.palette.primary.main, 0.07),
    },
    "&.Mui-selected": {
      color: "primary.dark",
      borderColor: "primary.main",
      backgroundColor: (theme: Theme) =>
        alpha(theme.palette.primary.main, 0.12),
      fontWeight: 700,
      "&:hover": {
        backgroundColor: (theme: Theme) =>
          alpha(theme.palette.primary.main, 0.16),
      },
    },
  },
};

function SetupSection({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
        <Box sx={{ color: "primary.main", display: "inline-flex" }}>
          <ModeFormatIcon icon={icon} />
        </Box>
        <Typography
          variant="overline"
          component="p"
          sx={{ color: "primary.dark", lineHeight: 1.2 }}
        >
          {label}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

function setRuleKeys(setId: DominoSetId): string[] {
  switch (setId) {
    case "double_six":
      return [
        "playRulesSixDeal",
        "playRulesSixDraw",
        "playRulesPlayEnds",
        "playRulesPass",
        "playRulesOut",
        "playRulesBlocked",
        "playRulesDrawTie",
        "playRulesMatch",
        "playTrainBody",
      ];
    case "double_nine":
      return [
        "playRulesNineDeal",
        "playRulesNineBlock",
        "playRulesPlayEnds",
        "playRulesPass",
        "playRulesOut",
        "playRulesBlocked",
        "playRulesDrawTie",
        "playRulesMatch",
        "playTrainBody",
      ];
    default: {
      const _exhaustive: never = setId;
      return _exhaustive;
    }
  }
}

export default function PlaySetup({
  modeId,
  setId,
  maxPoints,
  drawRule,
  botBrain,
  botDelayMs,
  animMs,
  onMode,
  onSet,
  onMaxPoints,
  onDrawRule,
  onBotBrain,
  onBotDelay,
  onAnimMs,
  onStart,
}: Props) {
  const { t } = useTranslation();
  const isPresetTarget = (TARGETS as readonly number[]).includes(maxPoints);
  const [firstToDraft, setFirstToDraft] = useState(
    isPresetTarget ? "" : String(maxPoints)
  );

  useEffect(() => {
    setFirstToDraft(isPresetTarget ? "" : String(maxPoints));
  }, [maxPoints, isPresetTarget]);

  const difficultyOptions = useMemo(
    () =>
      [
        { id: "table_sense" as const, label: t("playBotBrainTableSense") },
        { id: "pimc" as const, label: t("playBotBrainPimc") },
      ] satisfies { id: BotBrainId; label: string }[],
    [t]
  );

  const ruleKeys = useMemo(() => setRuleKeys(setId), [setId]);
  const rulesSummary = (() => {
    switch (setId) {
      case "double_six":
        return t("playRulesSummarySix");
      case "double_nine":
        return t("playRulesSummaryNine");
      default: {
        const _exhaustive: never = setId;
        return _exhaustive;
      }
    }
  })();

  const selectedDraw = drawRuleCopy(drawRule);

  const commitFirstTo = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setFirstToDraft(isPresetTarget ? "" : String(maxPoints));
      return;
    }
    const next = Math.max(FIRST_TO_MIN, parsed);
    onMaxPoints(next);
  };

  return (
    <Card
      sx={{
        p: { xs: 2.25, sm: 3.25, md: 4 },
        width: "100%",
        maxWidth: { xs: "100%", sm: 720, md: 960, lg: 1040 },
        mx: "auto",
        background: `linear-gradient(165deg, ${alpha("#FDF8EE", 0.98)} 0%, ${alpha("#F0E4CF", 0.95)} 100%)`,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[600], 0.18)}`,
      }}
    >
      <Stack spacing={{ xs: 2.25, md: 2.75 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: (theme) => theme.typography.h2.fontFamily,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "primary.dark",
              fontSize: { xs: "1.65rem", sm: "1.85rem", md: "2.1rem" },
            }}
          >
            {t("playSetupTitle")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mt: 0.75,
              maxWidth: { xs: 42 * 8, md: 56 * 8 },
            }}
          >
            {t("playSetupBody")}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 2.25, md: 2.5 },
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            alignItems: "start",
          }}
        >
          <SetupSection icon={MODE_SECTION_ICON} label={t("mode")}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={setId}
              onChange={(_e, next) => next && onSet(next)}
              sx={setupChoiceGroupSx}
            >
              <ToggleButton
                value="double_nine"
                aria-label={t("tileSetOption", { n: "55" })}
              >
                <ModeFormatToggleLabel
                  icon={tileSetIcon(tileSetFromDominoSetId("double_nine"))}
                >
                  {t("tileSetOption", { n: "55" })}
                </ModeFormatToggleLabel>
              </ToggleButton>
              <ToggleButton
                value="double_six"
                aria-label={t("tileSetOption", { n: "28" })}
              >
                <ModeFormatToggleLabel
                  icon={tileSetIcon(tileSetFromDominoSetId("double_six"))}
                >
                  {t("tileSetOption", { n: "28" })}
                </ModeFormatToggleLabel>
              </ToggleButton>
            </ToggleButtonGroup>

            <Accordion
              disableGutters
              elevation={0}
              sx={{
                mt: 1,
                bgcolor: "transparent",
                boxShadow: "none",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                sx={{
                  minHeight: 36,
                  px: 0.25,
                  "&.Mui-expanded": { minHeight: 36 },
                  "& .MuiAccordionSummary-content": {
                    my: 0.5,
                    "&.Mui-expanded": { my: 0.5 },
                  },
                }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("playRulesTitle")} · {rulesSummary}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0.25, pt: 0, pb: 0.5 }}>
                <Stack spacing={0.85}>
                  {ruleKeys.map((key) => (
                    <Stack
                      key={key}
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                    >
                      <CheckOutlined
                        sx={{
                          fontSize: 15,
                          mt: "2px",
                          color: "primary.main",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", lineHeight: 1.45 }}
                      >
                        {t(key)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </SetupSection>

          <SetupSection icon={FORMAT_SECTION_ICON} label={t("format")}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={modeId}
              onChange={(_e, next) => next && onMode(next)}
              sx={setupChoiceGroupSx}
            >
              {MODE_IDS.map((id) => (
                <ToggleButton
                  key={id}
                  value={id}
                  aria-label={t(modeTitleKey(id))}
                >
                  <ModeFormatToggleLabel
                    icon={formatIcon(formatLabelFromPlayModeId(id))}
                  >
                    {t(modeTitleKey(id))}
                  </ModeFormatToggleLabel>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </SetupSection>

          <SetupSection icon={TARGET_SECTION_ICON} label={t("playFirstToLabel")}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="stretch"
              sx={{ minWidth: 0 }}
            >
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={isPresetTarget ? maxPoints : null}
                onChange={(_e, next) => {
                  if (next !== null) onMaxPoints(next);
                }}
                aria-label={t("playFirstToLabel")}
                sx={{ ...setupChoiceGroupSx, flex: 3, minWidth: 0 }}
              >
                {TARGETS.map((preset) => (
                  <ToggleButton key={preset} value={preset}>
                    {preset}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <TextField
                size="small"
                type="number"
                placeholder={t("playFirstToCustom")}
                value={firstToDraft}
                inputProps={{
                  min: FIRST_TO_MIN,
                  inputMode: "numeric",
                  "aria-label": t("playFirstToCustom"),
                }}
                onChange={(event) => setFirstToDraft(event.target.value)}
                onBlur={() => commitFirstTo(firstToDraft)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitFirstTo(firstToDraft);
                    (event.target as HTMLInputElement).blur();
                  }
                }}
                sx={{
                  flex: 1.1,
                  minWidth: 72,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 40,
                    backgroundColor: (theme: Theme) =>
                      isPresetTarget
                        ? theme.palette.background.default
                        : alpha(theme.palette.primary.main, 0.08),
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: (theme: Theme) =>
                      isPresetTarget
                        ? alpha(theme.palette.text.secondary, 0.16)
                        : theme.palette.primary.main,
                  },
                }}
              />
            </Stack>
          </SetupSection>

          <SetupSection icon={BOT_SECTION_ICON} label={t("playConfigBotBrain")}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={botBrain}
              onChange={(_e, next) => next && onBotBrain(next)}
              sx={setupChoiceGroupSx}
            >
              {difficultyOptions.map((option) => (
                <ToggleButton key={option.id} value={option.id}>
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </SetupSection>
        </Box>

        <SetupSection icon={DRAW_SECTION_ICON} label={t("playDrawRule")}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={drawRule}
            onChange={(_e, next) => next && onDrawRule(next)}
            sx={{ ...setupChoiceGroupSx, flexWrap: "wrap" }}
          >
            {DRAW_RULE_IDS.map((id) => {
              const { titleKey } = drawRuleCopy(id);
              return (
                <ToggleButton key={id} value={id}>
                  {t(titleKey)}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mt: 1 }}
          >
            {t(selectedDraw.titleKey)} — {t(selectedDraw.bodyKey)}
          </Typography>
        </SetupSection>

        <SetupSection icon={PACE_SECTION_ICON} label={t("playConfigPace")}>
          <PlayPaceSliders
            botDelayMs={botDelayMs}
            onBotDelay={onBotDelay}
            animMs={animMs}
            onAnimMs={onAnimMs}
          />
        </SetupSection>

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
            alignSelf: { md: "stretch" },
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
