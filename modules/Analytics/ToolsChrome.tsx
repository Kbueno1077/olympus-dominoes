"use client";

import { Box, Stack, Typography } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export function toolsPaperSx(options?: {
  dashed?: boolean;
  selected?: boolean;
}) {
  return {
    px: 1.25,
    py: 0.9,
    borderRadius: 1.5,
    border: options?.dashed ? "1px dashed" : "1px solid",
    borderColor: (theme: Theme) =>
      options?.selected
        ? alpha(theme.palette.primary.main, 0.32)
        : theme.palette.divider,
    backgroundColor: (theme: Theme) =>
      options?.selected
        ? alpha(theme.palette.primary.main, 0.08)
        : alpha(theme.palette.background.paper, 0.72),
  };
}

export function ToolsPanelHeader({
  overline,
  title,
  hint,
  extra,
  trailing,
}: {
  overline?: ReactNode;
  title: ReactNode;
  hint?: ReactNode;
  extra?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      gap={1}
      flexWrap="wrap"
      sx={{
        pb: 1.5,
        mb: 0.5,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {overline ? (
          <Typography
            variant="overline"
            component="p"
            sx={{ color: "text.secondary", mb: 0.15 }}
          >
            {overline}
          </Typography>
        ) : null}
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {hint ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            {hint}
          </Typography>
        ) : null}
        {extra}
      </Box>
      {trailing}
    </Stack>
  );
}

export function ToolsQuietCard({
  overline,
  children,
  action = null,
}: {
  overline?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={[
        toolsPaperSx({ dashed: true }),
        {
          px: 2.25,
          py: 2.5,
          textAlign: "center",
        },
      ]}
    >
      {overline ? (
        <Typography
          variant="overline"
          component="p"
          sx={{ color: "text.secondary", mb: 0.5 }}
        >
          {overline}
        </Typography>
      ) : null}
      <Typography color="text.secondary">{children}</Typography>
      {action}
    </Box>
  );
}
