"use client";

import { useState, useEffect } from "react";
import { Box, CssBaseline } from "@mui/material";
import Header from "@/components/Header/Header";
import Dashboard from "@/components/Dashboard/Dashboard";
import NewMatch from "@/modules/NewMatch/newMatch";
import { useRecoilValue } from "recoil";
import { isGameStartedRecoil } from "@/recoil/recoilState";

type ViewType = "dashboard" | "game";

export default function Index() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const isGameStarted = useRecoilValue(isGameStartedRecoil);

  // Check if game is in progress on page load
  useEffect(() => {
    if (isGameStarted) {
      setCurrentView("game");
    }
  }, [isGameStarted]);

  const handleStartNewGame = () => {
    setCurrentView("game");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <CssBaseline />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          pt: 8, // Account for fixed header
          background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
          minHeight: "100vh",
        }}
      >
        {currentView === "dashboard" && (
          <Dashboard onStartNewGame={handleStartNewGame} />
        )}

        {currentView === "game" && (
          <Box sx={{ py: 4 }}>
            <NewMatch onBackToDashboard={handleBackToDashboard} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
