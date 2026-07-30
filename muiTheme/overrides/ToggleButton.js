import { alpha } from "@mui/material/styles";

export default function ToggleButton(theme) {
  return {
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          gap: theme.spacing(1),
        },
        grouped: {
          border: `1px solid ${alpha(theme.palette.grey[600], 0.32)}`,
          borderRadius: 10,
          "&:not(:first-of-type)": {
            borderRadius: 10,
            borderLeft: `1px solid ${alpha(theme.palette.grey[600], 0.32)}`,
            marginLeft: 0,
          },
          "&:first-of-type": {
            borderRadius: 10,
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: 14,
          color: theme.palette.text.secondary,
          backgroundColor: alpha(theme.palette.grey[0], 0.6),
          paddingTop: theme.spacing(0.9),
          paddingBottom: theme.spacing(0.9),
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.07),
          },
          // Selected state is carried by a solid green fill, which is the one
          // place in the setup screen that earns a saturated colour.
          "&.Mui-selected": {
            color: theme.palette.primary.contrastText,
            backgroundColor: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          },
        },
      },
    },
  };
}
