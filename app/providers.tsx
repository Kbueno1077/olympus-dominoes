"use client";

import LanguageProvider from "@/i18n/LanguageProvider";
import { AnalyticsProvider } from "@/lib/analytics/AnalyticsProvider";
import { SnackbarProvider } from "notistack";
import { RecoilRoot } from "recoil";
import ThemeConfig from "../muiTheme";

export function Providers({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: string;
}) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <ThemeConfig>
        <SnackbarProvider
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          maxSnack={3}
        >
          <RecoilRoot>
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </RecoilRoot>
        </SnackbarProvider>
      </ThemeConfig>
    </LanguageProvider>
  );
}
