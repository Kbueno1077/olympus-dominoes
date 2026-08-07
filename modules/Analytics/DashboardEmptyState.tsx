"use client";

import DashboardAside from "@/modules/Analytics/DashboardAside";
import StatsDataDrawer from "@/modules/Analytics/StatsDataDrawer";
import {
  dashboardMainSx,
  dashboardShellSx,
} from "@/modules/Analytics/dashboardChrome";
import { useTranslation } from "@/i18n/useTranslation";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState, type ReactNode } from "react";

export function DashboardChromeShell({
  title,
  subtitle = null,
  toolbar = null,
  children,
  centerMain = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  /** Vertically/horizontally center main content (empty states). */
  centerMain?: boolean;
}) {
  return (
    <Box
      sx={{
        ...dashboardShellSx,
        ...(centerMain
          ? {
              // Fill the AppShell section so empty content can center, without
              // inventing extra scroll past the viewport.
              flex: 1,
              height: "100%",
              minHeight: 0,
            }
          : null),
      }}
    >
      <DashboardAside title={title} subtitle={subtitle} toolbar={toolbar} />
      <Box
        component="main"
        sx={{
          ...dashboardMainSx,
          ...(centerMain
            ? {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                minHeight: 0,
              }
            : null),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

type EmptyPage = "stats" | "compare" | "history" | "podium" | "leaderboard";

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
      case "leaderboard":
        return t("leaderboardTitle");
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
      case "leaderboard":
        return t("leaderboardNeedImport");
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
        title={title}
        subtitle={t("dashboardEmptyNoData")}
        toolbar={
          <Chip
            size="small"
            icon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
            label={t("statsManageData")}
            onClick={() => setDataDrawerOpen(true)}
            variant="outlined"
            clickable
          />
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
