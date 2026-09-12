"use client";

import { dashboardAsideSx } from "@/modules/Analytics/dashboardChrome";
import {
  AsideDrawerProvider,
  SidebarDrawer,
  SidebarOpenButton,
  useAsideDesktop,
  type AsideDesktopAt,
} from "@/modules/Analytics/SidebarSheet";
import { Box, Stack, Typography } from "@mui/material";
import { useCallback, useState, type ReactNode } from "react";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Chips / actions that stay visible in the drawer header stack. */
  toolbar?: ReactNode;
  children?: ReactNode;
  /** Mobile button label. Defaults to the aside title. */
  filtersLabel?: ReactNode;
  /** Extra aside sx (e.g. `{ p: 0 }`). */
  sx?: object;
  /** Full rail from this breakpoint; drawers below. Default md (900). */
  desktopAt?: AsideDesktopAt;
};

/**
 * Dashboard left chrome. Desktop keeps the full aside. Mobile is a single
 * button that opens the same content in a drawer.
 */
export default function DashboardAside({
  title,
  subtitle = null,
  toolbar = null,
  children = null,
  filtersLabel = null,
  sx = {},
  desktopAt = "md",
}: Props) {
  const isDesktop = useAsideDesktop(desktopAt);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const openDrawer = useCallback(() => setOpen(true), []);
  const hasBody = children != null || toolbar != null;

  const body = hasBody ? (
    <>
      {toolbar ? (
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 2, pb: 1.5 }}
          flexWrap="wrap"
          useFlexGap
        >
          {toolbar}
        </Stack>
      ) : null}
      {children}
    </>
  ) : null;

  return (
    <AsideDrawerProvider close={close} isMobileDrawer={!isDesktop}>
      {isDesktop ? (
        <Box
          component="aside"
          sx={{
            ...dashboardAsideSx,
            ...sx,
          }}
        >
          <Box sx={{ px: 2, pt: 3, pb: 1.5 }}>
            <Typography variant="h5" sx={{ mb: subtitle ? 0.25 : 0 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block" }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {body}
        </Box>
      ) : hasBody ? (
        <Box sx={{ flexShrink: 0 }}>
          <SidebarOpenButton
            label={filtersLabel ?? title}
            onClick={openDrawer}
            desktopAt={desktopAt}
          />
          <SidebarDrawer
            open={open}
            onOpen={openDrawer}
            onClose={close}
            title={title}
            subtitle={subtitle}
          >
            {body}
          </SidebarDrawer>
        </Box>
      ) : null}
    </AsideDrawerProvider>
  );
}
