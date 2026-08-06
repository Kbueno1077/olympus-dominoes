"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { FONT_HAND } from "@/muiTheme/typography";
import { TEAM_KEYS } from "@/utils/matchSettings";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import React from "react";

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

function Note({ hands, isWinner, teamNumber, label }) {
  const { t, teamName } = useTranslation();
  const teamKey = TEAM_KEYS[teamNumber] ?? "team1";
  const displayLabel = label || teamName(teamNumber);

  return (
    <Box sx={{ minWidth: 0, textAlign: "center" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={0.75}
        sx={{ mb: 0.75 }}
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
          variant="overline"
          sx={{ color: "text.secondary", lineHeight: 1, fontSize: 10 }}
        >
          {displayLabel}
        </Typography>
      </Stack>

      {hands.map((hand, index) => (
        <Stack
          key={`${teamNumber}-${index}-${hand}`}
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.75}
          sx={{ py: 0.15 }}
        >
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
            {index === 0 ? "x" : hand}
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
            {index === 0 ? hand : runningTotal(hands, index)}
          </Typography>
        </Stack>
      ))}

      <Box sx={{ mt: 1 }}>
        <Outcome isWinner={isWinner} handCount={hands.length} t={t} />
      </Box>
    </Box>
  );
}

export default Note;
