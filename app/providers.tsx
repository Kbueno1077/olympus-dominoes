"use client";

import { SnackbarProvider } from "notistack";
import { RecoilRoot } from "recoil";
import ThemeConfig from "../muiTheme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeConfig>
      <SnackbarProvider
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        maxSnack={3}
      >
        <RecoilRoot>{children}</RecoilRoot>
      </SnackbarProvider>
    </ThemeConfig>
  );
}
