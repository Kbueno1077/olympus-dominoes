import { alpha } from "@mui/material/styles";

export default function Card(theme) {
  return {
    MuiCard: {
      styleOverrides: {
        root: {
          // Cards are sheets of bone paper: a warm hairline edge does the
          // separating work that a coloured border used to do.
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.grey[600], 0.2)}`,
          boxShadow: theme.customShadows.z1,
          borderRadius: 14,
          position: "relative",
          zIndex: 0, // Fix Safari overflow: hidden with border radius
          backgroundImage: "none",
        },
      },
    },
    MuiCardHeader: {
      defaultProps: {
        titleTypographyProps: { variant: "h6" },
        subheaderTypographyProps: { variant: "body2" },
      },
      styleOverrides: {
        root: {
          padding: theme.spacing(2.5, 2.5, 0),
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: theme.spacing(2.5),
        },
      },
    },
  };
}
