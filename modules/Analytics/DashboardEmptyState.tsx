"use client";

import StatsDataDrawer from "@/modules/Analytics/StatsDataDrawer";
import { useTranslation } from "@/i18n/useTranslation";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { CloudUpload, InsertDriveFile } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";

const SIDEBAR_BORDER = "1px solid #C0C0C0";

export function DashboardChromeShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        flex: 1,
        minHeight: { md: "calc(100vh - 64px)" },
        width: "100%",
        backgroundColor: "background.default",
        alignItems: "stretch",
      }}
    >
      <Box
        component="aside"
        sx={{
          width: { xs: "100%", md: 300 },
          flexShrink: 0,
          borderRight: { xs: "none", md: SIDEBAR_BORDER },
          borderBottom: { xs: SIDEBAR_BORDER, md: "none" },
          backgroundColor: (theme) => alpha(theme.palette.grey[100], 0.75),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
          alignSelf: "stretch",
        }}
      >
        {sidebar}
      </Box>
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          px: { xs: 1.5, sm: 2.5, lg: 3 },
          pt: { xs: 2.5, md: 3 },
          pb: { xs: 3, sm: 4 },
          overflow: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function DashboardUploadDropzone({
  onFile,
  busy,
}: {
  onFile: (file: File) => Promise<void>;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    await onFile(file);
  };

  return (
    <Card
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handleFiles(e.dataTransfer.files);
      }}
      sx={{
        p: { xs: 3, sm: 4 },
        textAlign: "center",
        borderStyle: "dashed",
        borderWidth: 2,
        borderColor: (theme) =>
          dragging
            ? theme.palette.primary.main
            : alpha(theme.palette.grey[600], 0.28),
        backgroundColor: (theme) =>
          dragging
            ? alpha(theme.palette.primary.main, 0.06)
            : alpha(theme.palette.common.white, 0.55),
        transition: "border-color 160ms ease, background-color 160ms ease",
        maxWidth: 560,
        width: "100%",
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            backgroundColor: (theme) =>
              alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
          }}
        >
          {busy ? <CircularProgress size={24} /> : <CloudUpload />}
        </Box>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.75 }}>
            {t("analyticsUploadTitle")}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", maxWidth: 420, mx: "auto" }}
          >
            {t("analyticsUploadBody")}
          </Typography>
        </Box>
        <Button
          variant="contained"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          startIcon={<InsertDriveFile />}
        >
          {t("analyticsChooseFile")}
        </Button>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {t("analyticsUploadHint")}
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.sql,text/csv,application/sql,text/plain"
          hidden
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </Stack>
    </Card>
  );
}

type EmptyPage = "stats" | "compare" | "history";

type Props = {
  page: EmptyPage;
  onUploadFile?: (file: File) => Promise<void>;
  uploadBusy?: boolean;
  errorMessage?: string | null;
  onOpenStats?: () => void;
};

/**
 * Empty analytics chrome when no export is loaded.
 * Nav stays in the header — this shell only carries the page title + one CTA.
 */
export default function DashboardEmptyState({
  page,
  onUploadFile,
  uploadBusy = false,
  errorMessage = null,
  onOpenStats,
}: Props) {
  const { t } = useTranslation();
  const [dataDrawerOpen, setDataDrawerOpen] = useState(false);

  const title =
    page === "stats"
      ? t("statsTitle")
      : page === "compare"
        ? t("statsCompare")
        : t("historyTitle");

  const subtitle =
    page === "stats"
      ? t("analyticsSubtitle")
      : page === "compare"
        ? t("compareNeedImport")
        : t("historyNeedImport");

  return (
    <>
      <DashboardChromeShell
        sidebar={
          <Box sx={{ px: 2, pt: { xs: 2.5, md: 3 }, pb: 2.5 }}>
            <Typography variant="h5" sx={{ mb: 0.35 }}>
              {title}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block" }}
            >
              {t("dashboardEmptyNoData")}
            </Typography>
          </Box>
        }
      >
        <Stack
          spacing={2}
          alignItems="flex-start"
          sx={{ maxWidth: 560, width: "100%" }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {subtitle}
          </Typography>

          {page === "stats" && onUploadFile ? (
            <>
              <DashboardUploadDropzone
                onFile={onUploadFile}
                busy={uploadBusy}
              />
              <Button
                size="small"
                color="inherit"
                startIcon={<FolderOpenIcon />}
                onClick={() => setDataDrawerOpen(true)}
                sx={{ color: "text.secondary" }}
              >
                {t("statsManageData")}
              </Button>
            </>
          ) : onOpenStats ? (
            <Button variant="contained" onClick={onOpenStats}>
              {t("historyGoAnalytics")}
            </Button>
          ) : (
            <Button component={Link} href="/stats" variant="contained">
              {t("historyGoAnalytics")}
            </Button>
          )}

          {errorMessage ? (
            <Typography variant="body2" sx={{ color: "error.main" }}>
              {errorMessage}
            </Typography>
          ) : null}
        </Stack>
      </DashboardChromeShell>

      <StatsDataDrawer
        open={dataDrawerOpen}
        onClose={() => setDataDrawerOpen(false)}
      />
    </>
  );
}
