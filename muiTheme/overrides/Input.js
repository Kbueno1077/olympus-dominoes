import { alpha } from "@mui/material/styles";

export default function Input(theme) {
  return {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: alpha(theme.palette.grey[0], 0.7),
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(theme.palette.grey[600], 0.32),
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(theme.palette.grey[600], 0.55),
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 1.5,
            borderColor: theme.palette.primary.main,
          },
          "&.Mui-disabled": {
            backgroundColor: alpha(theme.palette.grey[400], 0.18),
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(theme.palette.grey[600], 0.18),
            },
          },
        },
        input: {
          "&::placeholder": {
            opacity: 1,
            color: theme.palette.text.disabled,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: theme.palette.text.secondary,
          "&.Mui-focused": {
            color: theme.palette.primary.dark,
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  };
}
