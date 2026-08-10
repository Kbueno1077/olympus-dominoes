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

/** 90° CW so patterns stay tile-relative when the bone lies horizontal. */
const ROTATE_CW = {
  1: 3,
  2: 6,
  3: 9,
  4: 2,
  5: 5,
  6: 8,
  7: 1,
  8: 4,
  9: 7,
};

function cellsForOrientation(value, horizontal) {
  const base = PIP_LAYOUTS[value] ?? [];
  if (!horizontal) return base;
  return base.map((cell) => ROTATE_CW[cell]);
}

function Face({ value, pipColor, facePx, horizontal }) {
  const pips = cellsForOrientation(value, horizontal);
  // Pixel inset/pip from the face unit — never % of the half-box — so
  // horizontal and vertical tiles keep the same pip diameter.
  const inset = Math.max(2, Math.round(facePx * 0.12));
  const pip = Math.max(3, Math.round(facePx * 0.18));

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        alignSelf: "stretch",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(3, 1fr)",
        placeItems: "center",
        p: `${inset}px`,
        boxSizing: "border-box",
      }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => (
        <Box
          key={cell}
          sx={{
            width: pip,
            height: pip,
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
  highContrast = false,
}) {
  const isVertical = orientation === "vertical";
  // Integer pixels keep pips sharp when the train is dense.
  const face = Math.max(12, Math.round(size));
  const pipColor = highContrast ? "#1A140E" : "#241D14";
  const bone = highContrast ? "#FFFDF8" : "#FBF5E9";
  const edge = alpha("#241D14", highContrast ? 0.4 : 0.22);
  const divider = Math.max(1, Math.round(face * 0.06));

  return (
    <Box
      aria-hidden
      sx={{
        width: isVertical ? face : face * 2,
        height: isVertical ? face * 2 : face,
        flexShrink: 0,
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        borderRadius: `${Math.max(3, Math.round(face * 0.14))}px`,
        background: `linear-gradient(160deg, #FFFDF8 0%, ${bone} 55%, #EFE3CD 100%)`,
        border: `1px solid ${edge}`,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.9), 0 1px 3px -1px ${alpha(
          "#241D14",
          0.28
        )}`,
        overflow: "hidden",
        // Promote to its own layer so scaled/absolute tiles stay crisp.
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        ...sx,
      }}
    >
      <Face
        value={top}
        pipColor={pipColor}
        facePx={face}
        horizontal={!isVertical}
      />
      <Box
        sx={{
          flexShrink: 0,
          [isVertical ? "height" : "width"]: `${divider}px`,
          [isVertical ? "width" : "height"]: "72%",
          alignSelf: "center",
          borderRadius: 1,
          backgroundColor: alpha(pipColor, 0.5),
        }}
      />
      <Face
        value={bottom}
        pipColor={pipColor}
        facePx={face}
        horizontal={!isVertical}
      />
    </Box>
  );
}
