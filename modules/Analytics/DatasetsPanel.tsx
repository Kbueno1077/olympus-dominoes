"use client";

import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { suggestedDatasetNameFromFile } from "@/lib/analytics/datasets";
import { useTranslation } from "@/i18n/useTranslation";
import useToast from "@/hooks/useToast";
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

export default function DatasetsPanel({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { t } = useTranslation();
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
  const [nameNewOpen, setNameNewOpen] = useState(false);
  const [pendingNewFile, setPendingNewFile] = useState<File | null>(null);
  const [newName, setNewName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

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
      else setLocalError(t("analyticsErrorGeneric"));
    } finally {
      setBusy(false);
    }
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
