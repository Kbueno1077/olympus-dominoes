import { alpha } from "@mui/material/styles";

/**
 * Optional haptic tick on supported phones.
 * Call from pointer-down on play chrome controls.
 */
export function tapFeedback() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
  } catch {
    /* ignore */
  }
}

/** Scale + snappy transition for IconButton / Button / Chip. */
export const pressableSx = {
  WebkitTapHighlightColor: "transparent",
  userSelect: "none",
  transition:
    "transform 90ms ease, background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, opacity 90ms ease, filter 90ms ease",
  "@media (hover: hover)": {
    "&:hover:not(.Mui-disabled)": {
      filter: "brightness(1.06)",
    },
  },
  "&:active:not(.Mui-disabled)": {
    transform: "scale(0.93)",
    filter: "brightness(0.94)",
  },
} as const;

/** Softer press for dense list rows (nav / language). */
export const pressableRowSx = {
  WebkitTapHighlightColor: "transparent",
  userSelect: "none",
  transition: "transform 90ms ease, background-color 120ms ease",
  "&:active": {
    transform: "scale(0.985)",
    backgroundColor: (theme) => alpha(theme.palette.grey[700], 0.12),
  },
};
