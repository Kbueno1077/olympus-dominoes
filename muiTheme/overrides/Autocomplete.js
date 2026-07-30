import { alpha } from "@mui/material/styles";

export default function Autocomplete(theme) {
  return {
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${alpha(theme.palette.grey[600], 0.2)}`,
          boxShadow: theme.customShadows.z20,
          backgroundColor: theme.palette.background.paper,
        },
        option: {
          borderRadius: 8,
          margin: theme.spacing(0, 0.5),
          '&[aria-selected="true"]': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          },
        },
      },
    },
  };
}
