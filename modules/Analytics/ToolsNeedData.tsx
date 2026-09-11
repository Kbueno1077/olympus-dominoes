"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { ToolsQuietCard } from "@/modules/Analytics/ToolsChrome";
import { statsDataDrawerOpenRecoil } from "@/recoil/recoilState";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { Button } from "@mui/material";
import { useSetRecoilState } from "recoil";

export default function ToolsNeedData({
  overline,
  message,
}: {
  overline?: string;
  message?: string;
}) {
  const { t } = useTranslation();
  const openDataDrawer = useSetRecoilState(statsDataDrawerOpenRecoil);

  return (
    <ToolsQuietCard
      overline={overline ?? t("toolsNeedDataOverline")}
      action={
        <Button
          size="small"
          sx={{ mt: 1.25 }}
          startIcon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
          onClick={() => openDataDrawer(true)}
        >
          {t("statsManageData")}
        </Button>
      }
    >
      {message ?? t("toolsRestoreNeedData")}
    </ToolsQuietCard>
  );
}
