"use client";

import StatsDataDrawer from "@/modules/Analytics/StatsDataDrawer";
import {
  dashboardAsideSx,
  dashboardMainSx,
  dashboardShellSx,
} from "@/modules/Analytics/dashboardChrome";
import { useTranslation } from "@/i18n/useTranslation";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState, type ReactNode } from "react";

export function DashboardChromeShell({
  sidebar,
  children,
  centerMain = false,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  /** Vertically/horizontally center main content (empty states). */
  centerMain?: boolean;
}) {
  return (
    <Box sx={dashboardShellSx}>
      <Box component="aside" sx={dashboardAsideSx}>
        {sidebar}
      </Box>
      <Box
        component="main"
        sx={{
          ...dashboardMainSx,
          ...(centerMain
            ? {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }
            : null),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

type EmptyPage = "stats" | "compare" | "history" | "podium";

type Props = {
  page: EmptyPage;
  errorMessage?: string | null;
};

/**
 * Empty analytics chrome when no export is loaded.
 * One action: open Manage data (drawer) — same on Stats, Compare, History, Podium.
 */
export default function DashboardEmptyState({
  page,
  errorMessage = null,
}: Props) {
  const { t } = useTranslation();
  const [dataDrawerOpen, setDataDrawerOpen] = useState(false);

  const title = (() => {
    switch (page) {
      case "stats":
        return t("statsTitle");
      case "compare":
        return t("statsCompare");
      case "podium":
        return t("podiumTitle");
      case "history":
        return t("historyTitle");
      default: {
        const _exhaustive: never = page;
        return _exhaustive;
      }
    }
  })();

  const subtitle = (() => {
    switch (page) {
      case "stats":
        return t("analyticsSubtitle");
      case "compare":
        return t("compareNeedImport");
      case "podium":
        return t("podiumNeedImport");
      case "history":
        return t("historyNeedImport");
      default: {
        const _exhaustive: never = page;
        return _exhaustive;
      }
    }
  })();

  return (
    <>
      <DashboardChromeShell
        centerMain
        sidebar={
          <Box sx={{ px: 2, pt: { xs: 2.5, md: 3 }, pb: 2.5 }}>
            <Typography variant="h5" sx={{ mb: 0.35 }}>
              {title}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block" }}
            >
              {t("dashboardEmptyNoData")}
            </Typography>
          </Box>
        }
      >
        <Stack
          spacing={2.5}
          alignItems="center"
          textAlign="center"
          sx={{ maxWidth: 420, width: "100%", px: 1 }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              backgroundColor: (theme) =>
                alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
            }}
          >
            <FolderOpenIcon sx={{ fontSize: 30 }} />
          </Box>

          <Box>
            <Typography variant="h5" sx={{ mb: 0.75 }}>
              {t("dashboardEmptyTitle")}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", lineHeight: 1.5 }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<FolderOpenIcon />}
            onClick={() => setDataDrawerOpen(true)}
            sx={{ px: 2.5, py: 1.1 }}
          >
            {t("statsManageData")}
          </Button>

          <Typography
            variant="caption"
            sx={{ color: "text.disabled", maxWidth: 320 }}
          >
            {t("dashboardEmptyManageHint")}
          </Typography>

          {errorMessage ? (
            <Typography variant="body2" sx={{ color: "error.main" }}>
              {errorMessage}
            </Typography>
          ) : null}
        </Stack>
      </DashboardChromeShell>

      <StatsDataDrawer
        open={dataDrawerOpen}
        onClose={() => setDataDrawerOpen(false)}
      />
    </>
  );
}
