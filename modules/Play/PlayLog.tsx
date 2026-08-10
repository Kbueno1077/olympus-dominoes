"use client";

import type { GameLogEntry } from "@/lib/play/types";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useRef } from "react";

const LEVEL_COLOR: Record<GameLogEntry["level"], string> = {
  info: "#5F5341",
  play: "#1F6B58",
  bot: "#3D6C8C",
  warn: "#B4542F",
  win: "#C08A2E",
};

type Props = {
  logs: GameLogEntry[];
  open: boolean;
  onToggle: () => void;
};

export default function PlayLog({ logs, open, onToggle }: Props) {
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, open]);

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[600], 0.22)}`,
        backgroundColor: alpha("#FDF8EE", 0.92),
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: open
            ? (theme) => `1px solid ${alpha(theme.palette.grey[600], 0.16)}`
            : "none",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t("playDebugLog")}
        </Typography>
        <Button size="small" onClick={onToggle} sx={{ minWidth: 0, px: 1.25 }}>
          {open ? t("playHide") : t("playShow")}
        </Button>
      </Stack>

      {open && (
        <Box
          sx={{
            maxHeight: 220,
            overflowY: "auto",
            px: 1.5,
            py: 1,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          {logs.length === 0 && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {t("playNoEvents")}
            </Typography>
          )}
          {logs.map((entry) => (
            <Box key={entry.id} sx={{ mb: 0.85 }}>
              <Box
                component="span"
                sx={{
                  color: LEVEL_COLOR[entry.level],
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  mr: 1,
                }}
              >
                {entry.level}
              </Box>
              <Box component="span" sx={{ color: "text.primary" }}>
                {entry.message}
              </Box>
              {entry.detail && (
                <Box sx={{ color: "text.secondary", pl: 0.5, mt: 0.15 }}>
                  └ {entry.detail}
                </Box>
              )}
            </Box>
          ))}
          <div ref={endRef} />
        </Box>
      )}
    </Box>
  );
}
