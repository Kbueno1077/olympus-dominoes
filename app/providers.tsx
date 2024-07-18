"use client";

import { SnackbarProvider } from "notistack";
import ThemeConfig from "../muiTheme";
import { RecoilRoot } from "recoil";

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
