"use client";

import { Box, Card, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

/** Viewport under the fixed 64px header. */
export const DASHBOARD_VIEWPORT_HEIGHT = "calc(100vh - 64px)";

/**
 * Chart tiles keep the original 1 / 2 / 3-up packing.
 * Extra columns only kick in on very wide panes (≈ 2560px+).
 */
export const chartGridDenseColumns = {
  xs: "minmax(0, 1fr)",
  sm: "repeat(2, minmax(0, 1fr))",
  xl: "repeat(3, minmax(0, 1fr))",
  "@media (min-width:2560px)": "repeat(4, minmax(0, 1fr))",
};

export const chartGridDenseSx = {
  display: "grid",
  gap: 2,
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  gridTemplateColumns: chartGridDenseColumns,
};

export const chartGridCompareColumns = {
  xs: "minmax(0, 1fr)",
  md: "repeat(2, minmax(0, 1fr))",
  "@media (min-width:2560px)": "repeat(3, minmax(0, 1fr))",
};

/** Outer Stats / History / Compare row — fills parent; panes scroll alone on md+. */
export const dashboardShellSx = {
  display: "flex",
  flexDirection: { xs: "column", md: "row" },
  // Mobile: size to content (never force a full viewport) so page scroll
  // matches real height. Desktop: fill the AppShell pane.
  flex: { xs: "0 0 auto", md: 1 },
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  minHeight: { xs: 0, md: 0 },
  height: { xs: "auto", md: "100%" },
  maxHeight: { xs: "none", md: "100%" },
  backgroundColor: "background.default",
  alignItems: "stretch",
  overflowX: "hidden",
  overflowY: { xs: "visible", md: "hidden" },
};

/** Page route wrapper under AppShell for full-bleed dashboards. */
export const dashboardPageSx = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  flex: { xs: "0 0 auto", md: 1 },
  display: "flex",
  flexDirection: "column",
  minHeight: { xs: 0, md: 0 },
  height: { xs: "auto", md: "100%" },
};

/** Accent for Jose's Coefficient — distinct from forest green diffs. */
export const JOSES_ACCENT = "#6B4F8A";

/** Left chrome — content-sized on mobile; height-locked on desktop. */
export const dashboardAsideSx = {
  width: { xs: "100%", md: 360 },
  maxWidth: "100%",
  flexShrink: 0,
  borderRight: { xs: "none", md: "1px solid #C0C0C0" },
  borderBottom: { xs: "1px solid #C0C0C0", md: "none" },
  backgroundColor: (theme) => alpha(theme.palette.grey[100], 0.75),
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  display: "flex",
  flexDirection: "column",
  alignSelf: "stretch",
  height: { xs: "auto", md: "100%" },
  maxHeight: { xs: "none", md: "100%" },
  minHeight: 0,
  minWidth: 0,
  overflowX: "hidden",
  // Mobile: flow with page scroll. Desktop: this column scrolls when
  // filters + lists are taller than the pane (Collapse does not pass a height).
  overflowY: { xs: "visible", md: "auto" },
  overscrollBehavior: { md: "contain" },
};

/** Main pane — flows under sidebar on mobile; scrolls alone on desktop. */
export const dashboardMainSx = {
  // Mobile: content-sized only (avoid flex-grow phantom height / overscroll).
  flex: { xs: "0 0 auto", md: 1 },
  minWidth: 0,
  maxWidth: "100%",
  width: "100%",
  minHeight: 0,
  height: { xs: "auto", md: "100%" },
  maxHeight: { xs: "none", md: "100%" },
  overflowX: "hidden",
  overflowY: { xs: "visible", md: "auto" },
  overscrollBehavior: { md: "contain" },
  px: { xs: 1.5, sm: 2.5, lg: 3 },
  pt: { xs: 2, md: 3 },
  pb: { xs: 3, sm: 3, md: 4 },
};

/**
 * @param {{
 *   title: import("react").ReactNode,
 *   subtitle?: import("react").ReactNode,
 *   actions?: import("react").ReactNode,
 * }} props
 */
export function DashboardHeader({ title, subtitle, actions = null }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={1.5}
      sx={{ mb: 0.5 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" sx={{ mb: 0.35 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions}
    </Stack>
  );
}

/**
 * @param {{
 *   title?: import("react").ReactNode,
 *   children?: import("react").ReactNode,
 * }} props
 */
export function ControlCenter({ title, children }) {
  return (
    <Card
      sx={{
        p: { xs: 2, sm: 2.25 },
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.grey[700], 0.14),
      }}
    >
      {title ? (
        <Typography
          variant="overline"
          component="p"
          sx={{ color: "text.secondary", mb: 1.5 }}
        >
          {title}
        </Typography>
      ) : null}
      <Stack
        spacing={0}
        divider={
          <Divider
            sx={{
              my: 2,
              borderColor: (theme) => alpha(theme.palette.grey[700], 0.12),
            }}
          />
        }
      >
        {children}
      </Stack>
    </Card>
  );
}

/**
 * @param {{
 *   label?: import("react").ReactNode,
 *   hint?: import("react").ReactNode,
 *   children?: import("react").ReactNode,
 *   trailing?: import("react").ReactNode,
 * }} props
 */
export function ControlSection({
  label,
  hint = null,
  children,
  trailing = null,
}) {
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: hint || children ? 1 : 0 }}
      >
        <Box sx={{ minWidth: 0 }}>
          {label ? (
            <Typography
              variant="overline"
              component="p"
              sx={{ color: "text.secondary", mb: hint ? 0.35 : 0 }}
            >
              {label}
            </Typography>
          ) : null}
          {hint ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {hint}
            </Typography>
          ) : null}
        </Box>
        {trailing}
      </Stack>
      {children}
    </Box>
  );
}

/**
 * @param {{
 *   label: import("react").ReactNode,
 *   value: import("react").ReactNode,
 *   valueColor?: string,
 * }} props
 */
export function MetricTile({ label, value, valueColor }) {
  return (
    <Box
      sx={{
        px: 1.25,
        py: 1.1,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: (theme) =>
          alpha(theme.palette.background.default, 0.55),
        minWidth: 0,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: "text.secondary",
          mb: 0.35,
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: 18,
          lineHeight: 1.15,
          fontVariantNumeric: "tabular-nums",
          color: valueColor || "text.primary",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

/**
 * @param {{
 *   title?: import("react").ReactNode,
 *   hint?: import("react").ReactNode,
 *   children?: import("react").ReactNode,
 *   sx?: object,
 * }} props
 */
export function DashboardPanel({ title, hint = null, children, sx = {} }) {
  return (
    <Card sx={{ p: 2, height: "100%", ...sx }}>
      {title ? (
        <Typography
          variant="overline"
          component="p"
          sx={{ color: "text.secondary", mb: hint ? 0.35 : 1 }}
        >
          {title}
        </Typography>
      ) : null}
      {hint ? (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mb: 1.25 }}
        >
          {hint}
        </Typography>
      ) : null}
      {children}
    </Card>
  );
}
