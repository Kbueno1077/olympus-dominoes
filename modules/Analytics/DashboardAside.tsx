"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { dashboardAsideSx } from "@/modules/Analytics/dashboardChrome";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  Collapse,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Chips / actions that stay visible when filters are collapsed on mobile. */
  toolbar?: ReactNode;
  children?: ReactNode;
  /** Label for the mobile expand/collapse control. Defaults to Filters. */
  filtersLabel?: ReactNode;
  /** Extra aside sx (e.g. `{ p: 0 }`). */
  sx?: object;
};

/**
 * Dashboard left chrome. On mobile, filter body is collapsed by default so the
 * main content leads; desktop always shows the full aside.
 */
export default function DashboardAside({
  title,
  subtitle = null,
  toolbar = null,
  children = null,
  filtersLabel = null,
  sx = {},
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"), {
    // Avoid SSR flash open→closed on phone.
    defaultMatches: false,
    noSsr: true,
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) setOpen(true);
  }, [isDesktop]);

  const filtersOpen = isDesktop || open;
  const hasFilters = children != null;

  return (
    <Box
      component="aside"
      sx={{
        ...dashboardAsideSx,
        ...sx,
      }}
    >
      <Box sx={{ px: 2, pt: { xs: 1.75, md: 3 }, pb: 1.5 }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h5" sx={{ mb: subtitle ? 0.25 : 0 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block" }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {hasFilters && !isDesktop ? (
            <Button
              size="small"
              variant={open ? "contained" : "outlined"}
              color="inherit"
              onClick={() => setOpen((value) => !value)}
              endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              aria-expanded={open}
              sx={{
                flexShrink: 0,
                color: open ? "primary.contrastText" : "text.secondary",
                backgroundColor: open ? "primary.main" : "transparent",
                borderColor: "divider",
                "&:hover": {
                  backgroundColor: open ? "primary.dark" : "action.hover",
                  borderColor: "divider",
                },
              }}
            >
              {filtersLabel ?? t("dashboardFilters")}
            </Button>
          ) : null}
        </Stack>

        {toolbar ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 1.5 }}
            flexWrap="wrap"
            useFlexGap
          >
            {toolbar}
          </Stack>
        ) : null}
      </Box>

      {hasFilters ? (
        <Collapse in={filtersOpen} timeout="auto" unmountOnExit={!isDesktop}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              // Mobile: flow with page. Desktop: fill aside and scroll inside.
              overflow: { xs: "visible", md: "hidden" },
            }}
          >
            {children}
          </Box>
        </Collapse>
      ) : null}
    </Box>
  );
}
