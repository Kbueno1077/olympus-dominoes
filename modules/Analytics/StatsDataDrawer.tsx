"use client";

import DatasetsPanel from "@/modules/Analytics/DatasetsPanel";
import { useTranslation } from "@/i18n/useTranslation";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Dataset import / switch lives here so the dashboard stays about the numbers.
 */
export default function StatsDataDrawer({ open, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 420 },
          p: 2.5,
          backgroundColor: "background.paper",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 0.25 }}>
            {t("statsDataTitle")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("statsDataHint")}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label={t("cancel")}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <DatasetsPanel embedded />
    </Drawer>
  );
}
