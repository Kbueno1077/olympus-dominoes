import { alpha } from "@mui/material/styles";

export default function Button(theme) {
  return {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
          transition: theme.transitions.create(
            ["background-color", "border-color", "box-shadow", "color"],
            { duration: 150 }
          ),
        },
        sizeLarge: {
          height: 48,
          paddingLeft: theme.spacing(3),
          paddingRight: theme.spacing(3),
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        containedPrimary: {
          backgroundColor: theme.palette.primary.main,
          "&:hover": {
            backgroundColor: theme.palette.primary.dark,
          },
        },
        containedSecondary: {
          backgroundColor: theme.palette.secondary.main,
          "&:hover": {
            backgroundColor: theme.palette.secondary.dark,
          },
        },
        containedInherit: {
          color: theme.palette.grey[800],
          backgroundColor: theme.palette.grey[300],
          "&:hover": {
            backgroundColor: theme.palette.grey[400],
          },
        },
        outlined: {
          borderColor: alpha(theme.palette.grey[700], 0.28),
          "&:hover": {
            borderColor: "currentColor",
            backgroundColor: alpha(theme.palette.grey[700], 0.05),
          },
        },
        outlinedInherit: {
          border: `1px solid ${alpha(theme.palette.grey[700], 0.28)}`,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        },
        textInherit: {
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  };
}
