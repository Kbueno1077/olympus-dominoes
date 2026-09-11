"use client";

import {
  LIVE_WATCH_MAX_SHARES,
  LIVE_WATCH_VIEWER_MAX,
  LIVE_WATCH_VIEWER_WARN,
} from "@/lib/liveWatch/types";
import { useTranslation } from "@/i18n/useTranslation";
import { ToolsPanelHeader, ToolsQuietCard, toolsPaperSx } from "@/modules/Analytics/ToolsChrome";
import useToast from "@/hooks/useToast";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState, Fragment } from "react";

type AdminViewer = {
  id: string;
  joinedAt: number;
  lastSeenAt: number;
};

type AdminSession = {
  id: string;
  matchId: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  viewerCount: number;
  viewers: AdminViewer[];
  overallLine: string;
  currentLine: string;
  modeLabel: string;
  isClosed: boolean;
};

function ago(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.round(m / 60)}h`;
}

export default function ToolsLiveWatchPanel() {
  const { t } = useTranslation();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const tRef = useRef(t);
  tRef.current = t;

  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [shareCount, setShareCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/live-watch", { cache: "no-store" });
      if (!res.ok) {
        toastRef.current(tRef.current("liveWatchAdminLoadFailed"), "error");
        return;
      }
      const data = await res.json();
      setSessions(data.sessions ?? []);
      setShareCount(data.shareCount ?? 0);
    } catch {
      toastRef.current(tRef.current("liveWatchAdminLoadFailed"), "error");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 4000);
    return () => clearInterval(timer);
  }, [refresh]);

  const removeShare = async (id: string) => {
    const res = await fetch(`/api/live-watch/admin/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast(t("liveWatchAdminActionFailed"), "error");
      return;
    }
    toast(t("liveWatchAdminRemoved"), "success");
    void refresh();
  };

  const clearViewers = async (id: string) => {
    const res = await fetch(`/api/live-watch/admin/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_viewers" }),
    });
    if (!res.ok) {
      toast(t("liveWatchAdminActionFailed"), "error");
      return;
    }
    toast(t("liveWatchAdminViewersCleared"), "success");
    void refresh();
  };

  const kickViewer = async (shareId: string, viewerId: string) => {
    const res = await fetch(`/api/live-watch/admin/${shareId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "kick_viewer", viewerId }),
    });
    if (!res.ok) {
      toast(t("liveWatchAdminActionFailed"), "error");
      return;
    }
    toast(t("liveWatchAdminViewerKicked"), "success");
    void refresh();
  };

  return (
    <Box>
      <ToolsPanelHeader
        overline={t("toolsLiveWatchKicker")}
        title={t("liveWatchAdminTitle")}
        hint={t("liveWatchAdminHint", {
          used: shareCount,
          max: LIVE_WATCH_MAX_SHARES,
          warn: LIVE_WATCH_VIEWER_WARN,
          cap: LIVE_WATCH_VIEWER_MAX,
          hours: 10,
        })}
        trailing={
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              void refresh();
            }}
            disabled={loading}
          >
            {t("liveWatchAdminRefresh")}
          </Button>
        }
      />

      <Chip
        label={`${shareCount} / ${LIVE_WATCH_MAX_SHARES}`}
        color={shareCount >= LIVE_WATCH_MAX_SHARES ? "error" : "default"}
        sx={{ mb: 2 }}
      />

      {sessions.length === 0 ? (
        <ToolsQuietCard overline={t("liveWatchAdminEmptyOverline")}>
          {t("liveWatchAdminEmpty")}
        </ToolsQuietCard>
      ) : (
        <Box sx={[toolsPaperSx(), { p: 0, overflow: "hidden" }]}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40} />
              <TableCell>{t("liveWatchAdminColId")}</TableCell>
              <TableCell>{t("liveWatchAdminColScore")}</TableCell>
              <TableCell>{t("liveWatchAdminColViewers")}</TableCell>
              <TableCell>{t("liveWatchAdminColAge")}</TableCell>
              <TableCell align="right">{t("liveWatchAdminColActions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((s) => {
              const open = Boolean(expanded[s.id]);
              const viewers = s.viewers ?? [];
              return (
                <Fragment key={s.id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        aria-label={t("liveWatchAdminToggleViewers")}
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [s.id]: !prev[s.id],
                          }))
                        }
                      >
                        {open ? (
                          <ExpandLessIcon fontSize="small" />
                        ) : (
                          <ExpandMoreIcon fontSize="small" />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {s.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.modeLabel} · {s.isClosed ? "closed" : "open"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.overallLine}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.currentLine}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={s.viewerCount}
                        color={
                          s.viewerCount >= LIVE_WATCH_VIEWER_MAX
                            ? "error"
                            : s.viewerCount >= LIVE_WATCH_VIEWER_WARN
                              ? "warning"
                              : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {t("liveWatchAdminUpdated", {
                          ago: ago(Date.now() - s.updatedAt),
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("liveWatchAdminExpires", {
                          left: ago(Math.max(0, s.expiresAt - Date.now())),
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        aria-label={t("liveWatchAdminClearViewers")}
                        onClick={() => {
                          void clearViewers(s.id);
                        }}
                      >
                        <PersonOffOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={t("liveWatchAdminRemove")}
                        onClick={() => {
                          void removeShare(s.id);
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                      <Button
                        size="small"
                        href={`/watch/${s.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("liveWatchAdminOpen")}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                      <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ px: 2, py: 1.5, bgcolor: "action.hover" }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, fontWeight: 700 }}
                          >
                            {t("liveWatchAdminViewersTitle", {
                              n: viewers.length,
                            })}
                          </Typography>
                          {viewers.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              {t("liveWatchAdminNoViewers")}
                            </Typography>
                          ) : (
                            <Stack spacing={0.75}>
                              {viewers.map((v) => (
                                <Stack
                                  key={v.id}
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  spacing={1}
                                  sx={{
                                    bgcolor: "background.paper",
                                    borderRadius: 1,
                                    px: 1.25,
                                    py: 0.75,
                                  }}
                                >
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                      variant="body2"
                                      fontFamily="monospace"
                                      noWrap
                                    >
                                      {v.id}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {t("liveWatchAdminViewerSeen", {
                                        joined: ago(Date.now() - v.joinedAt),
                                        seen: ago(Date.now() - v.lastSeenAt),
                                      })}
                                    </Typography>
                                  </Box>
                                  <Button
                                    size="small"
                                    color="warning"
                                    startIcon={
                                      <PersonRemoveOutlinedIcon fontSize="small" />
                                    }
                                    onClick={() => {
                                      void kickViewer(s.id, v.id);
                                    }}
                                  >
                                    {t("liveWatchAdminKickOne")}
                                  </Button>
                                </Stack>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
        </Box>
      )}
    </Box>
  );
}
