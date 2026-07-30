import { alpha } from "@mui/material/styles";

export default function Dialog(theme) {
  return {
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${alpha(theme.palette.grey[600], 0.2)}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.customShadows.z24,
          backgroundImage: "none",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 18,
          fontWeight: 700,
          padding: theme.spacing(2.5, 3, 1),
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: theme.spacing(1, 3),
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: theme.spacing(2, 3, 2.5),
          gap: theme.spacing(1),
          "& > :not(style) ~ :not(style)": {
            marginLeft: 0,
          },
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(theme.palette.grey[900], 0.45),
        },
      },
    },
  };
}
