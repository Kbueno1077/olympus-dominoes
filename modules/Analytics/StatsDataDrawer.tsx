"use client";

import Iconify from "@/components/Iconify";
import ActiveDatasetPlayersAccordion from "@/modules/Analytics/ActiveDatasetPlayersAccordion";
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
          maxWidth: "100%",
          height: "100%",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "background.paper",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1}
        sx={{
          flexShrink: 0,
          px: 2.5,
          pt: 2.5,
          pb: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
            <Iconify
              icon="ion:folder-outline"
              sx={{
                width: 22,
                height: 22,
                color: "primary.main",
                flexShrink: 0,
              }}
            />
            <Typography variant="h5">{t("statsDataTitle")}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("statsDataHint")}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          aria-label={t("cancel")}
          sx={{ flexShrink: 0 }}
        >
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: "hidden",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          px: 2.5,
          py: 2,
          pb: { xs: 4, sm: 2.5 },
        }}
      >
        <DatasetsPanel embedded />
      </Box>
      <ActiveDatasetPlayersAccordion />
    </Drawer>
  );
}
