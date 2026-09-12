"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { FONT_DISPLAY } from "@/muiTheme/typography";
import CloseIcon from "@mui/icons-material/Close";
import MenuOpenOutlinedIcon from "@mui/icons-material/MenuOpenOutlined";
import {
  Box,
  Button,
  IconButton,
  Stack,
  SwipeableDrawer,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

const AsideDrawerContext = createContext<{
  close: () => void;
  isMobileDrawer: boolean;
}>({ close: () => {}, isMobileDrawer: false });

export function useAsideDrawer() {
  return useContext(AsideDrawerContext);
}

export function AsideDrawerProvider({
  close,
  isMobileDrawer,
  children,
}: {
  close: () => void;
  isMobileDrawer: boolean;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ close, isMobileDrawer }),
    [close, isMobileDrawer]
  );
  return (
    <AsideDrawerContext.Provider value={value}>
      {children}
    </AsideDrawerContext.Provider>
  );
}

/** When the full aside (not the drawer button) should mount. */
export type AsideDesktopAt = "md" | "lg";

export function useAsideDesktop(at: AsideDesktopAt = "md") {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up(at), {
    defaultMatches: false,
    noSsr: true,
  });
}

export function useMdUp() {
  return useAsideDesktop("md");
}

const paperBg = alpha("#F7F0E4", 0.98);

export function SidebarOpenButton({
  label,
  onClick,
  desktopAt = "md",
}: {
  label: ReactNode;
  onClick: () => void;
  /** Must match the JS `useAsideDesktop` cutoff or the button hides with no rail. */
  desktopAt?: AsideDesktopAt;
}) {
  return (
    <Box
      sx={{
        display: { xs: "block", [desktopAt]: "none" },
        flexShrink: 0,
        px: 1.5,
        py: 1.15,
        borderBottom: "1px solid #C0C0C0",
        backgroundColor: (theme) => alpha(theme.palette.grey[100], 0.75),
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <Button
        fullWidth
        variant="outlined"
        onClick={onClick}
        startIcon={<MenuOpenOutlinedIcon />}
        sx={{
          justifyContent: "flex-start",
          py: 1.05,
          px: 1.5,
          borderRadius: 2,
          fontWeight: 700,
          textTransform: "none",
          color: "#1F6B58",
          borderColor: alpha("#1F6B58", 0.28),
          bgcolor: alpha("#FDF8EE", 0.92),
          "&:hover": {
            borderColor: "#1F6B58",
            bgcolor: alpha("#1F6B58", 0.08),
          },
        }}
      >
        {label}
      </Button>
    </Box>
  );
}

export function SidebarDrawer({
  open,
  onOpen,
  onClose,
  title,
  subtitle,
  anchor = "left",
  children,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  anchor?: "left" | "right";
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <SwipeableDrawer
      anchor={anchor}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          width: "min(100%, 400px)",
          maxWidth: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: paperBg,
          backgroundImage: "none",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={1}
        sx={{
          px: 2,
          pt: 2,
          pb: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 26,
              lineHeight: 1.15,
              color: "#2C2118",
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <IconButton
          aria-label={t("sidebarClose")}
          onClick={onClose}
          size="small"
          sx={{ mt: 0.25 }}
        >
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          overscrollBehavior: "contain",
        }}
        onClick={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest("[data-aside-pick]")) onClose();
        }}
      >
        {children}
      </Box>
    </SwipeableDrawer>
  );
}
