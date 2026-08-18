"use client";

import ConfirmDeleteHand from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteHand";
import { FONT_HAND } from "@/muiTheme/typography";
import { Box, Stack, Typography } from "@mui/material";
import React from "react";

/** Running total after this hand. The first hand has nothing before it. */
function runningTotal(teamDatas, index) {
  return (
    teamDatas.slice(0, index).reduce((a, b) => a + b, 0) + teamDatas[index]
  );
}

export default function NoteHand({
  gameEditionMode,
  handleRemoveDataFromGame,
  index,
  teamDatas,
  takenOrder,
  teamNumber,
}) {
  const isFirst = index === 0;

  if (gameEditionMode) {
    return (
      <ConfirmDeleteHand
        onCofirm={() => handleRemoveDataFromGame(teamNumber, index)}
        teamDatas={teamDatas}
        index={index}
        isFirst={isFirst}
      />
    );
  }

  const scored = isFirst ? "x" : teamDatas[index];
  const total = isFirst ? teamDatas[0] : runningTotal(teamDatas, index);

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{
        py: 0.4,
        fontVariantNumeric: "tabular-nums",
        borderBottom: "1px dashed",
        borderColor: (t) => t.palette.divider,
      }}
    >
      {takenOrder > 0 ? (
        <Typography
          component="span"
          sx={{
            minWidth: 12,
            fontSize: 10,
            lineHeight: 1,
            fontWeight: 600,
            color: "text.disabled",
            textAlign: "right",
          }}
        >
          {takenOrder}
        </Typography>
      ) : null}
      <Typography
        component="span"
        sx={{
          minWidth: 34,
          textAlign: "right",
          fontFamily: FONT_HAND,
          fontSize: 21,
          fontWeight: 500,
          lineHeight: 1,
          color: "text.secondary",
        }}
      >
        {scored}
      </Typography>

      <Box
        component="span"
        sx={{ width: 8, height: "1px", backgroundColor: "text.disabled" }}
      />

      <Typography
        component="span"
        sx={{
          minWidth: 34,
          textAlign: "left",
          fontFamily: FONT_HAND,
          fontSize: 21,
          fontWeight: 700,
          lineHeight: 1,
          color: "text.primary",
        }}
      >
        {total}
      </Typography>
    </Stack>
  );
}
