import { alpha } from "@mui/material/styles";

export default function Slider(theme) {
  return {
    MuiSlider: {
      styleOverrides: {
        root: {
          color: theme.palette.primary.main,
        },
        rail: {
          opacity: 1,
          backgroundColor: alpha(theme.palette.grey[600], 0.24),
        },
        track: {
          border: "none",
        },
        thumb: {
          width: 20,
          height: 20,
          backgroundColor: theme.palette.grey[100],
          border: `2px solid ${theme.palette.primary.main}`,
          boxShadow: theme.customShadows.tile,
          "&:hover, &.Mui-focusVisible": {
            boxShadow: `0 0 0 6px ${alpha(theme.palette.primary.main, 0.14)}`,
          },
          "&.Mui-active": {
            boxShadow: `0 0 0 10px ${alpha(theme.palette.primary.main, 0.16)}`,
          },
        },
        mark: {
          backgroundColor: alpha(theme.palette.grey[700], 0.4),
          height: 4,
        },
        markActive: {
          backgroundColor: alpha(theme.palette.primary.contrastText, 0.6),
        },
        markLabel: {
          fontSize: 12,
          color: theme.palette.text.secondary,
        },
        valueLabel: {
          backgroundColor: theme.palette.grey[900],
          borderRadius: 6,
        },
      },
    },
  };
}
