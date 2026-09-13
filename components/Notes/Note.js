"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { stripTrailingPadHandsPair } from "@/lib/analytics/hands";
import { FONT_HAND } from "@/muiTheme/typography";
import { TEAM_KEYS } from "@/utils/matchSettings";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import React, { useMemo } from "react";
import PadColumn from "./PadColumn";

function runningTotal(hands, index) {
  return hands.slice(0, index).reduce((a, b) => a + b, 0) + hands[index];
}

/**
 * A finished team's note: every hand with its running total, then the outcome.
 * "Pollo" is losing without scoring at all; "Zapato" is losing on one hand.
 */
function Outcome({ isWinner, handCount, t }) {
  if (isWinner) {
    return (
      <Chip
        label={t("winner")}
        size="small"
        sx={{
          fontSize: 11,
          color: "primary.dark",
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.14),
        }}
      />
    );
  }

  if (handCount === 0 || handCount === 1) {
    const isPollo = handCount === 0;
    return (
      <Chip
        label={isPollo ? `🐔 ${t("pollo")}` : `👟 ${t("zapato")}`}
        size="small"
        sx={{
          fontSize: 11,
          color: "secondary.dark",
          backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.14),
        }}
      />
    );
  }

  return null;
}

function Note({ hands, taken, isWinner, teamNumber, label, index = 0 }) {
  const { t, teamName } = useTranslation();
  const teamKey = TEAM_KEYS[teamNumber] ?? "team1";
  const displayLabel = label || teamName(teamNumber);
  // Drop legacy pad hands (≤0 trailing) used to force the column to target.
  const { hands: cleanedHands, taken: cleanedTaken } = useMemo(
    () => stripTrailingPadHandsPair(hands ?? [], taken ?? []),
    [hands, taken]
  );

  const header = (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={0.75}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: (theme) => theme.palette[teamKey].main,
          flexShrink: 0,
        }}
      />
      <Typography
        component="span"
        sx={{
          fontFamily: FONT_HAND,
          fontSize: 18,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "0.02em",
          textTransform: "none",
          color: "text.primary",
        }}
      >
        {displayLabel}
      </Typography>
    </Stack>
  );

  return (
    <PadColumn index={index} header={header} dense>
      {cleanedHands.map((hand, handIndex) => (
        <Stack
          key={`${teamNumber}-${handIndex}-${hand}`}
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.75}
          sx={{ py: 0.15 }}
        >
          {cleanedTaken[handIndex] > 0 ? (
            <Typography
              component="span"
              sx={{
                minWidth: 11,
                fontSize: 10,
                lineHeight: 1,
                fontWeight: 600,
                color: "text.disabled",
                textAlign: "right",
              }}
            >
              {cleanedTaken[handIndex]}
            </Typography>
          ) : null}
          <Typography
            component="span"
            sx={{
              minWidth: 30,
              textAlign: "right",
              fontFamily: FONT_HAND,
              fontSize: 18,
              fontWeight: 500,
              lineHeight: 1,
              color: hand < 0 ? "warning.dark" : "text.secondary",
            }}
          >
            {handIndex === 0 ? "x" : hand}
          </Typography>

          <Box
            component="span"
            sx={{ width: 6, height: "1px", backgroundColor: "text.disabled" }}
          />

          <Typography
            component="span"
            sx={{
              minWidth: 30,
              textAlign: "left",
              fontFamily: FONT_HAND,
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1,
              color: "text.primary",
            }}
          >
            {handIndex === 0 ? hand : runningTotal(cleanedHands, handIndex)}
          </Typography>
        </Stack>
      ))}

      <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
        <Outcome isWinner={isWinner} handCount={cleanedHands.length} t={t} />
      </Box>
    </PadColumn>
  );
}

export default Note;
