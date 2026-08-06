"use client";

import Dashboard from "@/components/Dashboard/Dashboard";
import Header from "@/components/Header/Header";
import Analytics from "@/modules/Analytics/Analytics";
import History from "@/modules/History/History";
import NewMatch from "@/modules/NewMatch/newMatch";
import { useHasMounted } from "@/hooks/useHasMounted";
import { isGameStartedRecoil } from "@/recoil/recoilState";
import { useTranslation } from "@/i18n/useTranslation";
import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { useRecoilValue } from "recoil";

type ViewType = "dashboard" | "game" | "analytics" | "history";

export default function Index() {
  const { t } = useTranslation();
  const hasMounted = useHasMounted();
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const isGameStarted = useRecoilValue(isGameStartedRecoil);

  const handleStartNewGame = () => {
    setCurrentView("game");
  };

  const handleOpenAnalytics = () => {
    setCurrentView("analytics");
  };

  // Do not force Match on load — a live match shows as Continue on the mesa home.
  // Users open Match from the nav or the Continue CTA.

  const navItems = useMemo(() => {
    const items = [
      {
        id: "dashboard",
        label: t("dashboard"),
        active: currentView === "dashboard",
        onClick: () => setCurrentView("dashboard"),
      },
      {
        id: "history",
        label: t("historyNav"),
        active: currentView === "history",
        onClick: () => setCurrentView("history"),
      },
      {
        id: "analytics",
        label: t("analyticsNav"),
        active: currentView === "analytics",
        onClick: () => setCurrentView("analytics"),
      },
    ];

    // Only after mount — Match comes from persisted recoil and would mismatch SSR.
    if (hasMounted && (isGameStarted || currentView === "game")) {
      items.splice(1, 0, {
        id: "match",
        label: t("navMatch"),
        active: currentView === "game",
        onClick: () => setCurrentView("game"),
      });
    }

    return items;
  }, [t, currentView, isGameStarted, hasMounted]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <Header
        navItems={navItems}
        tone={currentView === "dashboard" ? "mesa" : "default"}
      />

      {/* Dashboard fills the viewport under the bar; other views keep room to scroll. */}
      <Box
        component="section"
        sx={{
          flex: 1,
          pt: 8,
          pb:
            currentView === "dashboard"
              ? 0
              : { xs: 14, sm: 10 },
        }}
      >
        {currentView === "dashboard" && (
          <Dashboard
            onStartNewGame={handleStartNewGame}
            onOpenAnalytics={handleOpenAnalytics}
          />
        )}

        {currentView === "game" && (
          <Box
            sx={{
              py: { xs: 2, sm: 3 },
              px: { xs: 1.5, sm: 3, md: 4, lg: 5 },
            }}
          >
            <NewMatch onOpenAnalytics={handleOpenAnalytics} />
          </Box>
        )}

        {currentView === "history" && (
          <Box
            sx={{
              py: { xs: 2, sm: 3 },
              px: { xs: 1.5, sm: 3, md: 4, lg: 5 },
            }}
          >
            <History onOpenAnalytics={handleOpenAnalytics} />
          </Box>
        )}

        {currentView === "analytics" && (
          <Box
            sx={{
              py: { xs: 2, sm: 3 },
              px: { xs: 1.5, sm: 3, md: 4, lg: 5 },
            }}
          >
            <Analytics />
          </Box>
        )}
      </Box>
    </Box>
  );
}
