"use client";

import { useHasMounted } from "@/hooks/useHasMounted";
import { useTranslation } from "@/i18n/useTranslation";
import { isGameStartedRecoil } from "@/recoil/recoilState";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import CompareArrowsOutlined from "@mui/icons-material/CompareArrowsOutlined";
import EmojiEventsOutlined from "@mui/icons-material/EmojiEventsOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import LeaderboardOutlined from "@mui/icons-material/LeaderboardOutlined";
import CallMergeOutlined from "@mui/icons-material/CallMergeOutlined";
import SportsEsportsOutlined from "@mui/icons-material/SportsEsportsOutlined";
import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useRecoilValue } from "recoil";

/**
 * Standard nav dropdown — closed trigger shows the current section.
 */
export default function NavMenu() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const hasMounted = useHasMounted();
  const isGameStarted = useRecoilValue(isGameStartedRecoil);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const matchInProgress = hasMounted && isGameStarted;

  const items = useMemo(
    () => [
      {
        href: "/",
        label: t("dashboard"),
        match: (p) => p === "/",
        Icon: HomeOutlined,
      },
      {
        href: "/match",
        label: t("navMatch"),
        match: (p) => p.startsWith("/match"),
        inProgress: matchInProgress,
        Icon: SportsEsportsOutlined,
      },
      {
        href: "/history",
        label: t("historyNav"),
        match: (p) => p.startsWith("/history"),
        Icon: HistoryOutlined,
      },
      {
        href: "/leaderboard",
        label: t("leaderboardNav"),
        match: (p) => p === "/leaderboard" || p.startsWith("/leaderboard/"),
        Icon: LeaderboardOutlined,
      },
      {
        href: "/stats",
        label: t("statsNav"),
        match: (p) => p === "/stats" || p.startsWith("/stats/"),
        Icon: BarChartOutlined,
      },
      {
        href: "/compare",
        label: t("compareNav"),
        match: (p) => p.startsWith("/compare"),
        Icon: CompareArrowsOutlined,
      },
      {
        href: "/podium",
        label: t("podiumNav"),
        match: (p) => p === "/podium" || p.startsWith("/podium/"),
        Icon: EmojiEventsOutlined,
      },
      {
        href: "/merge",
        label: t("mergeNav"),
        match: (p) => p === "/merge" || p.startsWith("/merge/"),
        Icon: CallMergeOutlined,
      },
    ],
    [t, matchInProgress]
  );

  const activeItem = items.find((item) => item.match(pathname)) ?? items[0];
  const ActiveIcon = activeItem.Icon;

  return (
    <>
      <Button
        size="small"
        color="inherit"
        aria-label={t("navMenuAria")}
        aria-haspopup="menu"
        aria-expanded={open ? "true" : undefined}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        startIcon={<ActiveIcon sx={{ fontSize: 18 }} />}
        endIcon={
          <ExpandMore
            sx={{
              fontSize: 18,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 160ms ease",
            }}
          />
        }
        sx={{
          color: "text.primary",
          fontWeight: 600,
          px: { xs: 0.75, sm: 1.25 },
          minWidth: 0,
          flexShrink: 0,
          textTransform: "none",
          border: "1px solid",
          borderColor: open ? "divider" : "transparent",
          backgroundColor: open
            ? (theme) => alpha(theme.palette.grey[700], 0.06)
            : "transparent",
          "&:hover": {
            backgroundColor: (theme) => alpha(theme.palette.grey[700], 0.08),
            borderColor: "divider",
          },
          "& .MuiButton-startIcon": {
            mr: { xs: 0, sm: 0.75 },
            ml: 0,
          },
          "& .MuiButton-endIcon": {
            ml: { xs: 0.25, sm: 0.5 },
          },
        }}
      >
        <Box
          component="span"
          sx={{ display: { xs: "none", sm: "inline" } }}
        >
          {activeItem.label}
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              minWidth: 200,
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: (theme) => theme.customShadows.z8,
            },
          },
        }}
      >
        {items.map((item) => {
          const active = item.href === activeItem.href;
          const Icon = item.Icon;
          return (
            <MenuItem
              key={item.href}
              component={Link}
              href={item.href}
              onClick={() => setAnchorEl(null)}
              sx={{
                py: 1.1,
                px: 1.75,
                gap: 0.5,
                borderLeft: "3px solid",
                borderColor: active
                  ? "primary.main"
                  : item.inProgress
                    ? (theme) => alpha(theme.palette.secondary.main, 0.55)
                    : "transparent",
                backgroundColor: active
                  ? (theme) => alpha(theme.palette.primary.main, 0.07)
                  : "transparent",
                color: active ? "primary.dark" : "text.primary",
                "&:hover": {
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.06),
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 34,
                  color: active ? "primary.main" : "text.secondary",
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={
                  item.inProgress && !active ? t("navMatchInProgress") : null
                }
                primaryTypographyProps={{
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                }}
                secondaryTypographyProps={{
                  fontSize: 11,
                  color: "text.secondary",
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
