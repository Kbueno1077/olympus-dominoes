import { alpha } from "@mui/material/styles";

export default function Chip(theme) {
  return {
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          letterSpacing: "0.02em",
        },
        // Outlined chips carry a faint wash of their own colour so they stay
        // legible against the bone background without needing a solid fill.
        outlined: {
          borderWidth: 1,
        },
        outlinedPrimary: {
          backgroundColor: alpha(theme.palette.primary.main, 0.07),
          borderColor: alpha(theme.palette.primary.main, 0.35),
        },
        outlinedSecondary: {
          backgroundColor: alpha(theme.palette.secondary.main, 0.07),
          borderColor: alpha(theme.palette.secondary.main, 0.35),
        },
        icon: {
          marginLeft: 8,
        },
      },
    },
  };
}
