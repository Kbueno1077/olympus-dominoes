"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { statsDataDrawerOpenRecoil } from "@/recoil/recoilState";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { Box, Button, Typography } from "@mui/material";
import { useSetRecoilState } from "recoil";

export default function ToolsNeedData() {
  const { t } = useTranslation();
  const openDataDrawer = useSetRecoilState(statsDataDrawerOpenRecoil);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "divider",
        textAlign: "center",
      }}
    >
      <Typography color="text.secondary">{t("toolsRestoreNeedData")}</Typography>
      <Button
        size="small"
        sx={{ mt: 1 }}
        startIcon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
        onClick={() => openDataDrawer(true)}
      >
        {t("statsManageData")}
      </Button>
    </Box>
  );
}
