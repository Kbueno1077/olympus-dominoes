"use client";

import LanguageProvider from "@/i18n/LanguageProvider";
import { AnalyticsProvider } from "@/lib/analytics/AnalyticsProvider";
import { useMatchStore } from "@/lib/matchStore";
import { MuiEmotionCacheProvider } from "@/lib/muiEmotionCache";
import { SnackbarProvider } from "notistack";
import { useEffect } from "react";
import ThemeConfig from "../muiTheme";

export function Providers({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: string;
}) {
  useEffect(() => {
    void useMatchStore.persist.rehydrate();
  }, []);
  return (
    <MuiEmotionCacheProvider>
      <LanguageProvider initialLanguage={initialLanguage}>
        <ThemeConfig>
          <SnackbarProvider
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            maxSnack={3}
          >
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </SnackbarProvider>
        </ThemeConfig>
      </LanguageProvider>
    </MuiEmotionCacheProvider>
  );
}
