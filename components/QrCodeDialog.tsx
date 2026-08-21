"use client";

import { useTranslation } from "@/i18n/useTranslation";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

type QrCodeDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  href: string | null;
  comingSoon?: boolean;
};

export default function QrCodeDialog({
  open,
  onClose,
  title,
  href,
  comingSoon = false,
}: QrCodeDialogProps) {
  const { t } = useTranslation();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !href || comingSoon) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(href, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#241D14", light: "#FFFFFFFF" },
    }).then((dataUrl) => {
      if (!cancelled) setSrc(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [open, href, comingSoon]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <Stack alignItems="center" spacing={2} sx={{ pb: 1.5 }}>
          {comingSoon || !href ? (
            <>
              <Box
                sx={{
                  width: 280,
                  height: 280,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                }}
              >
                <Typography color="text.secondary" fontWeight={600}>
                  {t("qrComingSoon")}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {t("qrAndroidSoonBody")}
              </Typography>
            </>
          ) : (
            <>
              {src ? (
                <Box
                  component="img"
                  src={src}
                  alt=""
                  width={280}
                  height={280}
                  sx={{
                    borderRadius: 2,
                    bgcolor: "common.white",
                    p: 1,
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 280,
                    height: 280,
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                  }}
                />
              )}
              <Typography
                component="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{
                  color: "primary.main",
                  textAlign: "center",
                  wordBreak: "break-all",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                {href}
              </Typography>
            </>
          )}
          <Button onClick={onClose} variant="contained" fullWidth>
            {t("done")}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
