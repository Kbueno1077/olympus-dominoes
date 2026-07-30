"use client";

import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

// Cells of a 3x3 grid, numbered in reading order:
//   1 2 3
//   4 5 6
//   7 8 9
// A Cuban set is double-nine, so faces run all the way to 9.
const PIP_LAYOUTS = {
  0: [],
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 4, 7, 3, 6, 9],
  7: [1, 4, 7, 3, 6, 9, 5],
  8: [1, 4, 7, 3, 6, 9, 2, 8],
  9: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

function Face({ value, pipColor }) {
  const pips = PIP_LAYOUTS[value] ?? [];

  return (
    <Box
      sx={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(3, 1fr)",
        placeItems: "center",
        p: "14%",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => (
        <Box
          key={cell}
          sx={{
            width: "70%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            backgroundColor: pips.includes(cell) ? pipColor : "transparent",
          }}
        />
      ))}
    </Box>
  );
}

/**
 * A single domino tile rendered as a physical object: bone face, carved
 * divider and drilled pips. Used for the wordmark, the hero and the table.
 */
export default function DominoTile({
  top = 6,
  bottom = 6,
  size = 40,
  orientation = "vertical",
  sx = {},
}) {
  const isVertical = orientation === "vertical";
  const pipColor = "#241D14";
  const face = "#FBF5E9";
  const edge = alpha("#241D14", 0.22);

  return (
    <Box
      aria-hidden
      sx={{
        width: isVertical ? size : size * 2,
        height: isVertical ? size * 2 : size,
        flexShrink: 0,
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        borderRadius: `${Math.max(4, size * 0.16)}px`,
        // A warm top light and a darker lower edge give the tile thickness
        // without resorting to a drop shadow.
        background: `linear-gradient(160deg, #FFFDF8 0%, ${face} 55%, #EFE3CD 100%)`,
        border: `1px solid ${edge}`,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.9), 0 2px 4px -1px ${alpha(
          "#241D14",
          0.25
        )}`,
        overflow: "hidden",
        ...sx,
      }}
    >
      <Face value={top} pipColor={pipColor} />
      <Box
        sx={{
          flexShrink: 0,
          [isVertical ? "height" : "width"]: "2px",
          [isVertical ? "width" : "height"]: "76%",
          alignSelf: "center",
          borderRadius: 1,
          backgroundColor: alpha(pipColor, 0.42),
        }}
      />
      <Face value={bottom} pipColor={pipColor} />
    </Box>
  );
}
