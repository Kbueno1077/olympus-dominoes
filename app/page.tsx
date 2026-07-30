"use client";

import Dashboard from "@/components/Dashboard/Dashboard";
import Header from "@/components/Header/Header";
import NewMatch from "@/modules/NewMatch/newMatch";
import { isGameStartedRecoil } from "@/recoil/recoilState";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";

type ViewType = "dashboard" | "game";

export default function Index() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const isGameStarted = useRecoilValue(isGameStartedRecoil);

  // Restore the game view when a match is still in progress from a past visit.
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <Header />

      {/* Generous bottom padding keeps the last card clear of a phone's
          home indicator and leaves room to scroll past the end. */}
      <Box
        component="section"
        sx={{
          flex: 1,
          pt: 8,
          pb: { xs: 14, sm: 10 },
        }}
      >
        {currentView === "dashboard" && (
          <Dashboard onStartNewGame={handleStartNewGame} />
        )}

        {currentView === "game" && (
          <Box sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}>
            <NewMatch onBackToDashboard={handleBackToDashboard} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
