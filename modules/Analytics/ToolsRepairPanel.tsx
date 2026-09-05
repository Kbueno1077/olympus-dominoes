"use client";

import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { SCHEMA_VERSION } from "@/lib/analytics/dbMeta";
import type { RepairSaveReport } from "@/lib/analytics/repairSave";
import { useTranslation } from "@/i18n/useTranslation";
import ToolsNeedData from "@/modules/Analytics/ToolsNeedData";
import useToast from "@/hooks/useToast";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function ToolsRepairPanel() {
  const { t } = useTranslation();
  const { data, activeDataset, repairActiveSave } = useAnalytics();
  const displayToast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<RepairSaveReport | null>(null);

  const run = () => {
    setConfirmOpen(false);
    setBusy(true);
    try {
      const next = repairActiveSave();
      setReport(next);
      displayToast(t("toastRepairDone"), "success");
    } catch (err) {
      console.error(err);
      displayToast(t("toolsRepairFailed"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t("toolsRepairTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
          {t("toolsRepairHint")}
        </Typography>
        {activeDataset ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.75 }}
          >
            {t("dashboardViewingDataset", { name: activeDataset.displayName })}
          </Typography>
        ) : null}
      </Box>

      {!data ? (
        <ToolsNeedData />
      ) : (
        <>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2">
              {t("toolsRepairSchema", {
                current: data.db_meta?.schema_version ?? "—",
                latest: SCHEMA_VERSION,
              })}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75 }}>
              {t("toolsRepairDoes")}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<BuildOutlinedIcon />}
            onClick={() => setConfirmOpen(true)}
            sx={{
              alignSelf: { xs: "stretch", md: "flex-start" },
              width: { xs: "100%", md: "auto" },
              minWidth: { md: 280 },
            }}
          >
            {t("toolsRepairRun")}
          </Button>
          {report ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
                {t("toolsRepairReportTitle")}
              </Typography>
              <Typography variant="body2">
                {t("toolsRepairReportSchema", {
                  before: report.schemaVersionBefore ?? "—",
                  after: report.schemaVersionAfter,
                })}
              </Typography>
              <Typography variant="body2">
                {t("toolsRepairReportPlayers", {
                  n: report.playerPublicIdsFilled,
                })}
              </Typography>
              <Typography variant="body2">
                {t("toolsRepairReportMatches", {
                  n: report.matchPublicIdsFilled,
                })}
              </Typography>
              <Typography variant="body2">
                {t("toolsRepairReportSeats", { n: report.seatsBackfilled })}
              </Typography>
              <Typography variant="body2">
                {t("toolsRepairReportStats")}
              </Typography>
            </Box>
          ) : null}
        </>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t("toolsRepairConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("toolsRepairConfirmBody")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" disabled={busy} onClick={run}>
            {t("toolsRepairRun")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
