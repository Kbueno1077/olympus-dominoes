"use client";

import { FONT_DISPLAY } from "@/muiTheme/typography";
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
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: alpha("#1F6B58", 0.18),
        bgcolor: alpha("#FDF8EE", 0.92),
        px: { xs: 1.75, sm: 2.25 },
        py: { xs: 1.6, sm: 2 },
        mb: 0.5,
        boxShadow: `0 10px 28px ${alpha("#3A2A18", 0.05)}`,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        justifyContent="space-between"
        gap={{ xs: 1.25, sm: 1.5 }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {overline ? (
            <Typography
              variant="overline"
              component="p"
              sx={{
                color: "#1F6B58",
                letterSpacing: "0.14em",
                fontWeight: 700,
                mb: 0.35,
              }}
            >
              {overline}
            </Typography>
          ) : null}
          <Typography
            component="h1"
            sx={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: { xs: 26, sm: 30 },
              lineHeight: 1.15,
              color: "#2C2118",
            }}
          >
            {title}
          </Typography>
          {hint ? (
            <Typography
              sx={{
                mt: 0.85,
                maxWidth: "46ch",
                color: "text.secondary",
                fontSize: { xs: 13.5, sm: 14 },
                lineHeight: 1.5,
              }}
            >
              {hint}
            </Typography>
          ) : null}
          {extra}
        </Box>
        {trailing ? (
          <Box
            sx={{
              flexShrink: 0,
              alignSelf: { xs: "stretch", sm: "flex-start" },
              "& > *": { width: { xs: "100%", sm: "auto" } },
            }}
          >
            {trailing}
          </Box>
        ) : null}
      </Stack>
    </Box>
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
