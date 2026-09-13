"use client";

import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

const INK_DARK = (theme) => alpha(theme.palette.grey[800], 0.48);
const INK_LIGHT = (theme) => alpha(theme.palette.grey[800], 0.36);

/**
 * Two graphite pencil strokes. Used as the pad fold between teams and the
 * rule under the names — same ink, drawn so the marks actually meet.
 */
export default function PadRule({ axis = "horizontal", sx }) {
  const vertical = axis === "vertical";

  return (
    <Box
      aria-hidden
      sx={{
        pointerEvents: "none",
        lineHeight: 0,
        color: (theme) => INK_DARK(theme),
        ...(vertical
          ? { width: 11, height: "100%" }
          : { width: "100%", height: 11 }),
        ...sx,
      }}
    >
      <Box
        component="svg"
        viewBox={vertical ? "0 0 11 200" : "0 0 400 11"}
        preserveAspectRatio="none"
        sx={{ display: "block", width: "100%", height: "100%" }}
      >
        <Box
          component="path"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.35"
          vectorEffect="non-scaling-stroke"
          d={
            vertical
              ? "M2.1 0C1.4 50 2.8 100 1.8 150S2.5 200 2.2 200"
              : "M0 2.1C90 1.4 190 2.8 290 2.0 345 1.6 400 2.4 400 2.2"
          }
        />
        <Box
          component="path"
          fill="none"
          strokeLinecap="round"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
          d={
            vertical
              ? "M8.8 0C9.5 44 7.9 108 8.9 154S8.4 200 8.6 200"
              : "M0 8.8C110 9.4 210 8.1 305 8.9 352 9.2 400 8.4 400 8.6"
          }
          sx={{ stroke: (theme) => INK_LIGHT(theme) }}
        />
      </Box>
    </Box>
  );
}
