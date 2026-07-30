"use client";

import { LANGUAGES } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

export default function LanguageSwitch() {
  const { t, language, setLanguage } = useTranslation();

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
