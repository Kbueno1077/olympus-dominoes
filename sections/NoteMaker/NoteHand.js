"use client";

import ConfirmDeleteHand from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteHand";
import { FONT_HAND } from "@/muiTheme/typography";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { Stack, Typography } from "@mui/material";

/** Running total after this hand. The first hand has nothing before it. */
function runningTotal(teamDatas, index) {
  return (
    teamDatas.slice(0, index).reduce((a, b) => a + b, 0) + teamDatas[index]
  );
}

function HandFigures({
  takenOrder,
  scored,
  total,
  isLast,
  overflowed,
  ruled,
  showDeleteHint,
}) {
  return (
    <Stack
      direction="row"
      alignItems="baseline"
      justifyContent="center"
      spacing={0.75}
      sx={{
        py: 0.45,
        fontVariantNumeric: "tabular-nums",
        borderBottom: "1px dashed",
        borderBottomStyle: isLast && !ruled ? "solid" : "dashed",
        borderColor: "divider",
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
          minWidth: 32,
          textAlign: "right",
          fontFamily: FONT_HAND,
          fontSize: 22,
          fontWeight: 500,
          lineHeight: 1,
          color: "text.secondary",
        }}
      >
        {scored}
      </Typography>

      <Typography
        component="span"
        sx={{
          fontFamily: FONT_HAND,
          fontSize: 18,
          lineHeight: 1,
          color: "text.disabled",
          px: 0.15,
        }}
      >
        –
      </Typography>

      <Typography
        component="span"
        sx={{
          minWidth: 32,
          textAlign: "left",
          fontFamily: FONT_HAND,
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1,
          color: overflowed && isLast ? "warning.dark" : "text.primary",
        }}
      >
        {total}
      </Typography>

      {showDeleteHint ? (
        <DeleteOutline
          sx={{
            fontSize: 15,
            color: "error.light",
            alignSelf: "center",
            ml: 0.25,
          }}
        />
      ) : null}
    </Stack>
  );
}

export default function NoteHand({
  gameEditionMode,
  handleRemoveDataFromGame,
  index,
  teamDatas,
  takenOrder,
  teamNumber,
  isLast = false,
  overflowed = false,
  ruled = true,
}) {
  const isFirst = index === 0;
  const scored = isFirst ? "x" : teamDatas[index];
  const total = isFirst ? teamDatas[0] : runningTotal(teamDatas, index);
  const summary = `${scored} — ${total}`;

  const figures = (
    <HandFigures
      takenOrder={takenOrder}
      scored={scored}
      total={total}
      isLast={isLast}
      overflowed={overflowed}
      ruled={ruled}
      showDeleteHint={gameEditionMode}
    />
  );

  if (gameEditionMode) {
    return (
      <ConfirmDeleteHand
        onCofirm={() => handleRemoveDataFromGame(teamNumber, index)}
        summary={summary}
        scored={scored}
      >
        {figures}
      </ConfirmDeleteHand>
    );
  }

  return figures;
}
