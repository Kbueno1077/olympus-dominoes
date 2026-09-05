"use client";

import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { findDuplicateNightGroups } from "@/lib/analytics/dedupeNights";
import { formatYmd } from "@/lib/analytics/dateRangeFilter";
import { useTranslation } from "@/i18n/useTranslation";
import ToolsNeedData from "@/modules/Analytics/ToolsNeedData";
import useToast from "@/hooks/useToast";
import DifferenceOutlinedIcon from "@mui/icons-material/DifferenceOutlined";
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
import { useMemo, useState } from "react";

export default function ToolsDedupePanel() {
  const { t, language } = useTranslation();
  const { data, activeDataset, dedupeNights } = useAnalytics();
  const displayToast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const groups = useMemo(
    () => (data ? findDuplicateNightGroups(data) : []),
    [data]
  );
  const dropCount = groups.reduce(
    (sum, group) => sum + group.dropMatchIds.length,
    0
  );

  const run = () => {
    setConfirmOpen(false);
    setBusy(true);
    try {
      const result = dedupeNights();
      displayToast(
        t("toastDedupeDone", { n: result.droppedCount }),
        "success"
      );
    } catch (err) {
      console.error(err);
      displayToast(t("toolsDedupeFailed"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t("toolsDedupeTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
          {t("toolsDedupeHint")}
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
      ) : groups.length === 0 ? (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Typography color="text.secondary">{t("toolsDedupeEmpty")}</Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2">
            {t("toolsDedupeFound", { groups: groups.length, n: dropCount })}
          </Typography>
          <Stack spacing={1}>
            {groups.map((group) => (
              <Box
                key={group.fingerprint}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>
                  {group.day === "unknown-date"
                    ? t("toolsDedupeUnknownDate")
                    : formatYmd(language, group.day)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {group.playerNames.join(", ")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("toolsDedupeKeepDrop", {
                    keep: group.keepMatchId,
                    n: group.dropMatchIds.length,
                  })}
                </Typography>
              </Box>
            ))}
          </Stack>
          <Button
            variant="contained"
            startIcon={<DifferenceOutlinedIcon />}
            onClick={() => setConfirmOpen(true)}
            sx={{
              alignSelf: { xs: "stretch", md: "flex-start" },
              width: { xs: "100%", md: "auto" },
              minWidth: { md: 280 },
            }}
          >
            {t("toolsDedupeRun", { n: dropCount })}
          </Button>
        </>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t("toolsDedupeConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("toolsDedupeConfirmBody", { n: dropCount })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" disabled={busy} onClick={run}>
            {t("toolsDedupeRun", { n: dropCount })}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
