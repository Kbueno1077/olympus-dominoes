"use client";

import { useTranslation } from "@/i18n/useTranslation";
import {
  Box,
  Button,
  Card,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";

/** Soft gate only — not security. Session unlock for internal demos. */
export const PLAY_UNLOCK_KEY = "olympus-play-unlock";
export const PLAY_DEMO_PASSWORD = "p55demo";

type Props = {
  children: React.ReactNode;
};

export default function PlayGate({ children }: Props) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem(PLAY_UNLOCK_KEY) === "1");
    } catch {
      setUnlocked(false);
    }
    setReady(true);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password === PLAY_DEMO_PASSWORD) {
      try {
        sessionStorage.setItem(PLAY_UNLOCK_KEY, "1");
      } catch {
        /* ignore */
      }
      setUnlocked(true);
      setError(false);
      return;
    }
    setError(true);
  };

  if (!ready) return null;
  if (unlocked) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
        py: { xs: 4, md: 8 },
        px: { xs: 1.5, sm: 2 },
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <Card
        component="form"
        onSubmit={submit}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          width: "100%",
          maxWidth: 420,
          background: `linear-gradient(165deg, ${alpha("#FDF8EE", 0.98)} 0%, ${alpha("#F0E4CF", 0.95)} 100%)`,
          border: (theme) => `1px solid ${alpha(theme.palette.grey[600], 0.2)}`,
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography
              variant="overline"
              sx={{ color: "secondary.main", letterSpacing: "0.14em" }}
            >
              {t("playGateOverline")}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
              {t("playGateTitle")}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75 }}>
              {t("playGateBody")}
            </Typography>
          </Box>
          <TextField
            type="password"
            label={t("playGatePassword")}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            error={error}
            helperText={error ? t("playGateWrong") : " "}
            autoFocus
            fullWidth
            size="small"
          />
          <Button type="submit" variant="contained" color="primary">
            {t("playGateUnlock")}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
