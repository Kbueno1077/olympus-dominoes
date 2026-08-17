"use client";

import { unlockDevGate } from "@/lib/devGate/actions";
import { GATE_NAV_KEY, type GateId } from "@/lib/devGate/config";
import { useTranslation } from "@/i18n/useTranslation";
import LockOutlined from "@mui/icons-material/LockOutlined";
import {
  Box,
  Button,
  Card,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DevGateForm({ gate }: { gate: GateId }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [wrong, setWrong] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 6,
      }}
    >
      <Card sx={{ p: 3, width: "100%", maxWidth: 360 }}>
        <Stack
          component="form"
          gap={2}
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const password = String(
              new FormData(form).get("password") ?? ""
            );
            setPending(true);
            setWrong(false);
            const result = await unlockDevGate(gate, password);
            setPending(false);
            if (!result.ok) {
              setWrong(true);
              return;
            }
            router.refresh();
          }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <LockOutlined fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {t(GATE_NAV_KEY[gate])}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t("gateLockedHint")}
          </Typography>
          <TextField
            name="password"
            type="password"
            autoComplete="current-password"
            label={t("gatePassword")}
            error={wrong}
            helperText={wrong ? t("gateWrongPassword") : " "}
            fullWidth
            autoFocus
          />
          <Button
            type="submit"
            variant="contained"
            disabled={pending}
            sx={{ textTransform: "none" }}
          >
            {t("gateUnlock")}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
