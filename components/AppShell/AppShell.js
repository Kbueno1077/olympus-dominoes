"use client";

import Header from "@/components/Header/Header";
import { Box } from "@mui/material";

export default function AppShell({ children }) {
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
      <Box
        component="section"
        sx={{
          flex: 1,
          pt: 8,
          pb: { xs: 14, sm: 10 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
