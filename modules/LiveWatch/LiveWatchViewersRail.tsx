"use client";

import type { LiveWatchPublicViewer } from "@/lib/liveWatch/types";
import { dashboardAsideSx } from "@/modules/Analytics/dashboardChrome";
import {
  SidebarDrawer,
  SidebarOpenButton,
  useMdUp,
} from "@/modules/Analytics/SidebarSheet";
import { useTranslation } from "@/i18n/useTranslation";
import { FONT_DISPLAY } from "@/muiTheme/typography";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useState } from "react";

export default function LiveWatchViewersRail({
  viewers,
  selfId,
}: {
  viewers: LiveWatchPublicViewer[];
  selfId: string | null;
}) {
  const { t } = useTranslation();
  const isDesktop = useMdUp();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const openDrawer = useCallback(() => setOpen(true), []);
  const sorted = viewers
    .slice()
    .sort(
      (a, b) =>
        (a.joinOrder || 0) - (b.joinOrder || 0) ||
        a.displayName.localeCompare(b.displayName)
    );
  const title = t("liveWatchRailTitle", { n: sorted.length });
  const list = <ViewersList viewers={sorted} selfId={selfId} />;

  if (!isDesktop) {
    return (
      <Box sx={{ flexShrink: 0 }}>
        <SidebarOpenButton label={title} onClick={openDrawer} />
        <SidebarDrawer
          open={open}
          onOpen={openDrawer}
          onClose={close}
          title={title}
          subtitle={t("liveWatchRailOverline")}
        >
          <Box sx={{ px: 1.75, py: 1.75 }}>{list}</Box>
        </SidebarDrawer>
      </Box>
    );
  }

  return (
    <Box
      component="aside"
      sx={{
        ...dashboardAsideSx,
        width: { xs: "100%", md: 232 },
        px: 1.75,
        py: 1.75,
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: "text.secondary", letterSpacing: "0.12em" }}
      >
        {t("liveWatchRailOverline")}
      </Typography>
      <Typography
        sx={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 22,
          lineHeight: 1.15,
          color: "#2C2118",
          mb: 1.25,
        }}
      >
        {title}
      </Typography>
      {list}
    </Box>
  );
}

function ViewersList({
  viewers,
  selfId,
}: {
  viewers: LiveWatchPublicViewer[];
  selfId: string | null;
}) {
  const { t } = useTranslation();
  if (viewers.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t("liveWatchRailEmpty")}
      </Typography>
    );
  }
  return (
    <Stack spacing={0.75}>
      {viewers.map((viewer) => {
        const mine = selfId != null && viewer.id === selfId;
        return (
          <Stack
            key={viewer.id}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: mine
                ? alpha("#1F6B58", 0.32)
                : alpha("#3A2A18", 0.1),
              bgcolor: mine ? alpha("#1F6B58", 0.1) : alpha("#FDF8EE", 0.8),
              px: 1,
              py: 0.7,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                minWidth: 28,
                height: 28,
                borderRadius: 1,
                bgcolor: alpha("#1F6B58", mine ? 0.22 : 0.12),
                color: "#1F6B58",
                fontWeight: 800,
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {viewer.joinOrder || "–"}
            </Box>
            <Typography
              variant="body2"
              fontWeight={mine ? 700 : 600}
              noWrap
              sx={{ flex: 1, minWidth: 0, color: "#2C2118" }}
            >
              {viewer.displayName}
            </Typography>
            {mine ? (
              <Chip
                size="small"
                label={t("liveWatchRailYou")}
                sx={{
                  height: 20,
                  fontWeight: 700,
                  fontSize: 10,
                  bgcolor: alpha("#1F6B58", 0.16),
                  color: "#1F6B58",
                }}
              />
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
}
