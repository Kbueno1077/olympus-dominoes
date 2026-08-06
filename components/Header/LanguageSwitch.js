"use client";

import { LANGUAGES } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function LanguageSwitch({ tone = "default" }) {
  const { t, language, setLanguage } = useTranslation();
  const mesa = tone === "mesa";
  const ivory = "#F7F0E3";

  const handleChange = (_event, next) => {
    if (next !== null) setLanguage(next);
  };

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={language}
      onChange={handleChange}
      aria-label={t("language")}
      sx={
        mesa
          ? {
              border: `1px solid ${alpha(ivory, 0.28)}`,
              "& .MuiToggleButtonGroup-grouped": {
                border: 0,
                color: alpha(ivory, 0.7),
                "&.Mui-selected": {
                  color: ivory,
                  backgroundColor: alpha(ivory, 0.14),
                  "&:hover": {
                    backgroundColor: alpha(ivory, 0.2),
                  },
                },
                "&:hover": {
                  backgroundColor: alpha(ivory, 0.08),
                },
              },
            }
          : undefined
      }
    >
      {LANGUAGES.map(({ code, short, name }) => (
        <ToggleButton
          key={code}
          value={code}
          aria-label={name}
          sx={{ px: 1.25, py: 0.35, fontSize: 11, minWidth: 38 }}
        >
          {short}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
