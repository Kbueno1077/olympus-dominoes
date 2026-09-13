"use client";

import { Box } from "@mui/material";
import PadRule from "./PadRule";

/**
 * One team on the notepad: name, a graphite fold (two pencil strokes
 * across under the names, two down from the top), then the hands.
 * Adjacent columns share the same ink so the marks meet.
 */
export default function PadColumn({ index, header, children, dense = false }) {
  const leftFoldDisplay = {
    xs: index % 2 === 1 ? "block" : "none",
    md: index > 0 ? "block" : "none",
  };
  const px = dense ? 1 : { xs: 1.25, sm: 2 };

  return (
    <Box
      sx={{
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
        position: "relative",
      }}
    >
      <PadRule
        axis="vertical"
        sx={{
          display: leftFoldDisplay,
          position: "absolute",
          left: 0,
          top: -14,
          bottom: 0,
          transform: "translateX(-50%)",
          zIndex: 1,
        }}
      />
      <Box sx={{ px }}>{header}</Box>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <PadRule axis="horizontal" />
        <Box sx={{ px, pt: dense ? 0.75 : 1.25, flex: 1, minWidth: 0, textAlign: "center" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
