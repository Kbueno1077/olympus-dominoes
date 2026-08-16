"use client";

import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import type { DbMetaRow } from "@/lib/analytics/dbMeta";
import { withEnsuredDbMeta } from "@/lib/analytics/dbMetaState";
import {
  loadDatasetData,
  suggestedDatasetNameFromFile,
} from "@/lib/analytics/datasets";
import {
  downloadOlympusCsv,
  exportBasenameForDataset,
  serializeOlympusExport,
} from "@/lib/analytics/serializeExport";
import { useTranslation } from "@/i18n/useTranslation";
import useToast from "@/hooks/useToast";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useRef, useState } from "react";

function formatMetaTimestamp(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DatasetsPanel({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { t, language } = useTranslation();
  const displayToast = useToast();
  const {
    data,
    registry,
    importFile,
    importAsNew,
    switchDataset,
    renameDataset,
    deleteDataset,
    syncJosesCoefficients,
  } = useAnalytics();

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirm, setConfirm] = useState<
    | null
    | { type: "delete"; id: string; name: string }
    | { type: "switch"; id: string; name: string }
  >(null);
  const [infoOpen, setInfoOpen] = useState<{
    name: string;
    meta: DbMetaRow | null;
  } | null>(null);
  const [nameNewOpen, setNameNewOpen] = useState(false);
  const [pendingNewFile, setPendingNewFile] = useState<File | null>(null);
  const [newName, setNewName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const locale = language === "es" ? "es" : "en";

  const openDatasetInfo = (id: string, name: string) => {
    const active = id === registry.activeDatasetId;
    const payload = active ? data : loadDatasetData(id);
    if (!payload) {
      setInfoOpen({ name, meta: null });
      return;
    }
    const ensured = withEnsuredDbMeta(payload, { origin: "web" });
    setInfoOpen({ name, meta: ensured.db_meta ?? null });
  };

  const run = async (fn: () => Promise<void> | void) => {
    setBusy(true);
    setLocalError(null);
    try {
      await fn();
    } catch (err) {
      const code = err instanceof Error ? err.message : "failed";
      if (code === "empty_name") setLocalError(t("datasetsEmptyName"));
      else if (code === "duplicate_name")
        setLocalError(t("datasetsDuplicateName"));
      else if (code === "sql_unsupported")
        setLocalError(t("analyticsErrorSqlUnsupported"));
      else if (code === "unknown_format")
        setLocalError(t("analyticsErrorFormat"));
      else if (code === "schema_too_new")
        setLocalError(t("analyticsErrorSchemaTooNew"));
      else if (code === "schema_too_old")
        setLocalError(t("analyticsErrorSchemaTooOld"));
      else setLocalError(t("analyticsErrorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const exportDataset = (id: string, name: string) => {
    void run(() => {
      const payload = id === registry.activeDatasetId ? data : loadDatasetData(id);
      if (!payload) {
        displayToast(t("toastDatasetExportFailed"), "error");
        return;
      }
      const csv = serializeOlympusExport(payload, { label: name });
      downloadOlympusCsv(exportBasenameForDataset(name), csv);
      displayToast(t("toastDatasetExported"), "success");
    });
  };

  const handleSyncJoses = () => {
    void run(() => {
      try {
        syncJosesCoefficients();
        displayToast(t("toastJosesSynced"), "success");
      } catch (err) {
        console.error("syncJosesCoefficients failed", err);
        displayToast(t("toastJosesSyncFailed"), "error");
      }
    });
  };

  const content = (
    <>
      {!embedded ? (
        <Typography
          variant="overline"
          component="p"
          sx={{ color: "text.secondary", mb: 0.75 }}
        >
          {t("datasetsTitle")}
        </Typography>
      ) : null}
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", mb: 1.5 }}
      >
        {t("datasetsHint")}
      </Typography>

      <Stack spacing={1} sx={{ mb: 1.5 }}>
        {registry.datasets.map((ds) => {
          const active = ds.id === registry.activeDatasetId;
          return (
            <Box
              key={ds.id}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1,
                px: 1.25,
                py: 1,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: active ? "primary.main" : "divider",
                backgroundColor: active
                  ? (theme) => alpha(theme.palette.primary.main, 0.06)
                  : "transparent",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography sx={{ fontWeight: 600 }}>
                  {ds.displayName}
                  {active ? (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 1, color: "primary.main" }}
                    >
                      {t("datasetsActive")}
                    </Typography>
                  ) : null}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {!active ? (
                  <Button
                    size="small"
                    disabled={busy}
                    onClick={() =>
                      setConfirm({
                        type: "switch",
                        id: ds.id,
                        name: ds.displayName,
                      })
                    }
                  >
                    {t("datasetsSwitch")}
                  </Button>
                ) : null}
                <Button
                  size="small"
                  disabled={busy}
                  startIcon={<InfoOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={() => openDatasetInfo(ds.id, ds.displayName)}
                >
                  {t("datasetsInfo")}
                </Button>
                <Button
                  size="small"
                  disabled={busy}
                  startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={() => exportDataset(ds.id, ds.displayName)}
                >
                  {t("datasetsExport")}
                </Button>
                <Button
                  size="small"
                  disabled={busy}
                  onClick={() => {
                    setLocalError(null);
                    setRenameId(ds.id);
                    setRenameValue(ds.displayName);
                  }}
                >
                  {t("datasetsRename")}
                </Button>
                {active ? (
                  <Button
                    size="small"
                    disabled={busy}
                    onClick={() => replaceInputRef.current?.click()}
                  >
                    {t("datasetsReplace")}
                  </Button>
                ) : null}
                <Button
                  size="small"
                  color="error"
                  disabled={busy}
                  onClick={() =>
                    setConfirm({
                      type: "delete",
                      id: ds.id,
                      name: ds.displayName,
                    })
                  }
                >
                  {t("datasetsDelete")}
                </Button>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="outlined"
          size="small"
          disabled={busy}
          onClick={() => newInputRef.current?.click()}
        >
          {t("datasetsImportNew")}
        </Button>
        {data ? (
          <Button
            variant="outlined"
            size="small"
            disabled={busy}
            startIcon={<SyncIcon sx={{ fontSize: 16 }} />}
            onClick={handleSyncJoses}
          >
            {t("syncJosesCoefficientShort")}
          </Button>
        ) : null}
      </Stack>

      {data ? (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mt: 1 }}
        >
          {t("syncJosesCoefficientHint")}
        </Typography>
      ) : null}

      {localError ? (
        <Typography variant="body2" sx={{ color: "error.main", mt: 1 }}>
          {localError}
        </Typography>
      ) : null}

      <input
        ref={replaceInputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void run(() => importFile(file));
        }}
      />
      <input
        ref={newInputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setLocalError(null);
          setPendingNewFile(file);
          setNewName(suggestedDatasetNameFromFile(file.name));
          setNameNewOpen(true);
        }}
      />

      <Dialog
        open={renameId != null}
        onClose={() => setRenameId(null)}
        fullWidth
        maxWidth="xs"
        TransitionProps={{
          onExited: () => setLocalError(null),
        }}
      >
        <DialogTitle>{t("datasetsRenameTitle")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("datasetsRenamePlaceholder")}
            value={renameValue}
            onChange={(e) => {
              setLocalError(null);
              setRenameValue(e.target.value);
            }}
            error={Boolean(localError)}
            helperText={localError || undefined}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameId(null)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!renameId) return;
              void run(() => {
                renameDataset(renameId, renameValue);
                setRenameId(null);
              });
            }}
          >
            {t("datasetsRename")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={nameNewOpen}
        onClose={() => {
          setNameNewOpen(false);
          setPendingNewFile(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("datasetsNameTitle")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("datasetsRenamePlaceholder")}
            value={newName}
            onChange={(e) => {
              setLocalError(null);
              setNewName(e.target.value);
            }}
            error={Boolean(localError)}
            helperText={localError || undefined}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setNameNewOpen(false);
              setPendingNewFile(null);
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={!pendingNewFile}
            onClick={() => {
              if (!pendingNewFile) return;
              void run(async () => {
                await importAsNew(pendingNewFile, newName);
                setNameNewOpen(false);
                setPendingNewFile(null);
              });
            }}
          >
            {t("datasetsImportNew")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={infoOpen != null}
        onClose={() => setInfoOpen(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {infoOpen
            ? `${t("datasetsInfoTitle")} — ${infoOpen.name}`
            : t("datasetsInfoTitle")}
        </DialogTitle>
        <DialogContent>
          {infoOpen?.meta ? (
            <Stack spacing={1.25} sx={{ pt: 0.5 }}>
              {(
                [
                  ["datasetsInfoLabel", infoOpen.meta.label || "—"],
                  ["datasetsInfoOrigin", infoOpen.meta.origin],
                  [
                    "datasetsInfoSchema",
                    String(infoOpen.meta.schema_version),
                  ],
                  ["datasetsInfoAppVersion", infoOpen.meta.app_version],
                  [
                    "datasetsInfoCreated",
                    formatMetaTimestamp(infoOpen.meta.created_at, locale),
                  ],
                  [
                    "datasetsInfoUpdated",
                    formatMetaTimestamp(infoOpen.meta.updated_at, locale),
                  ],
                ] as const
              ).map(([labelKey, value]) => (
                <Box key={labelKey}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    {t(labelKey)}
                  </Typography>
                  <Typography variant="body2">{value}</Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <DialogContentText>{t("datasetsInfoEmpty")}</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoOpen(null)}>{t("done")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirm != null}
        onClose={() => setConfirm(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {confirm?.type === "delete"
            ? t("datasetsDeleteTitle", { name: confirm.name })
            : t("datasetsSwitchTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirm?.type === "delete"
              ? t("datasetsDeleteBody")
              : t("datasetsSwitchBody", { name: confirm?.name ?? "" })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            color={confirm?.type === "switch" ? "primary" : "error"}
            onClick={() => {
              if (!confirm) return;
              void run(() => {
                if (confirm.type === "delete") deleteDataset(confirm.id);
                else switchDataset(confirm.id);
                setConfirm(null);
              });
            }}
          >
            {confirm?.type === "switch"
              ? t("datasetsSwitch")
              : t("datasetsDelete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (embedded) return content;
  return <Card sx={{ p: 2 }}>{content}</Card>;
}
