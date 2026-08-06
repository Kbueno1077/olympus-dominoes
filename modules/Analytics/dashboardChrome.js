"use client";

import { Box, Card, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

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
