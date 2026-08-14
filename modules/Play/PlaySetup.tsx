"use client";

import type { BotBrainId } from "@/lib/play/botBrain";
import type { DominoSetId, DrawRuleId, PlayModeId } from "@/lib/play/types";
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
  Chip,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="body2"
      sx={{
        color: "text.secondary",
        mb: 0.75,
        display: "block",
        fontWeight: 600,
      }}
    >
      {children}
    </Typography>
  );
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
        { id: "classic" as const, label: t("playBotBrainClassic") },
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
          <Box>
            <SectionLabel>{t("playSet")}</SectionLabel>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={setId}
              onChange={(_e, next) => next && onSet(next)}
            >
              <ToggleButton value="double_six">
                {t("playSetDoubleSixShort")}
              </ToggleButton>
              <ToggleButton value="double_nine">
                {t("playSetDoubleNineShort")}
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
          </Box>

          <Box>
            <SectionLabel>{t("playMode")}</SectionLabel>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={modeId}
              onChange={(_e, next) => next && onMode(next)}
            >
              {MODE_IDS.map((id) => (
                <ToggleButton key={id} value={id}>
                  {t(modeTitleKey(id))}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Box>
            <SectionLabel>{t("playFirstToLabel")}</SectionLabel>
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              alignItems="center"
            >
              {TARGETS.map((preset) => (
                <Chip
                  key={preset}
                  label={preset}
                  clickable
                  onPointerDown={tapFeedback}
                  variant={maxPoints === preset ? "filled" : "outlined"}
                  color={maxPoints === preset ? "primary" : "default"}
                  onClick={() => onMaxPoints(preset)}
                  sx={{ ...pressableSx, flex: 1 }}
                />
              ))}
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
                sx={{ width: 96, flexShrink: 0 }}
              />
            </Stack>
          </Box>

          <Box>
            <SectionLabel>{t("playConfigBotBrain")}</SectionLabel>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={botBrain}
              onChange={(_e, next) => next && onBotBrain(next)}
            >
              {difficultyOptions.map((option) => (
                <ToggleButton key={option.id} value={option.id}>
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Accordion
          disableGutters
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: alpha("#241D14", 0.1),
            borderRadius: "12px !important",
            overflow: "hidden",
            bgcolor: alpha("#fff", 0.35),
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              minHeight: 48,
              px: 1.5,
              "&.Mui-expanded": { minHeight: 48 },
              "& .MuiAccordionSummary-content": {
                my: 1,
                "&.Mui-expanded": { my: 1 },
              },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("playDrawRule")}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block" }}
              >
                {t(selectedDraw.titleKey)} — {t(selectedDraw.bodyKey)}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              flexWrap="wrap"
              sx={{ mb: 1 }}
            >
              {DRAW_RULE_IDS.map((id) => {
                const { titleKey } = drawRuleCopy(id);
                const active = drawRule === id;
                return (
                  <Chip
                    key={id}
                    label={t(titleKey)}
                    clickable
                    onPointerDown={tapFeedback}
                    variant={active ? "filled" : "outlined"}
                    color={active ? "primary" : "default"}
                    onClick={() => onDrawRule(id)}
                    sx={pressableSx}
                  />
                );
              })}
            </Stack>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {t(selectedDraw.bodyKey)}
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Box>
          <SectionLabel>{t("playConfigPace")}</SectionLabel>
          <PlayPaceSliders
            botDelayMs={botDelayMs}
            onBotDelay={onBotDelay}
            animMs={animMs}
            onAnimMs={onAnimMs}
          />
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
