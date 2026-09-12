"use client";

import { Box, Typography } from "@mui/material";
import { useCallback } from "react";
import { useSnackbar } from "notistack";

/**
 * Site toasts. Pass `detail` on errors so the snackbar says what happened
 * and what to try next, not only a one-word failure.
 */
export default function useToast() {
  const { enqueueSnackbar } = useSnackbar();

  return useCallback((message, type, options) => {
    const detail = options?.detail;
    enqueueSnackbar(
      detail ? (
        <Box sx={{ py: 0.15, pr: 0.5, maxWidth: 360 }}>
          <Typography
            sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}
          >
            {message}
          </Typography>
          <Typography
            sx={{ mt: 0.45, fontSize: 13, lineHeight: 1.4, opacity: 0.92 }}
          >
            {detail}
          </Typography>
        </Box>
      ) : (
        message
      ),
      { variant: type }
    );
  }, [enqueueSnackbar]);
}
