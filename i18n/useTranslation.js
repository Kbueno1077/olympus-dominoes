"use client";

import { useCallback, useContext, useMemo } from "react";
import { LanguageContext } from "./LanguageProvider";
import {
  DEFAULT_LANGUAGE,
  MODE_LABEL_KEYS,
  translations,
} from "./translations";

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Strings live in a plain dictionary rather than a routing based i18n library
 * because the whole app is one client rendered page with no localised URLs.
 *
 * Any key missing from a translation falls back to English rather than showing
 * the raw key, so a half finished translation still reads as an app.
 */
export function useTranslation() {
  const { language, setLanguage } = useContext(LanguageContext);

  const dictionary = translations[language] ?? translations[DEFAULT_LANGUAGE];

  const t = useCallback(
    (key, values) => {
      const template =
        dictionary[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;

      if (!values) return template;

      return template.replace(PLACEHOLDER, (match, name) =>
        values[name] === undefined ? match : String(values[name])
      );
    },
    [dictionary]
  );

  // Team and mode names are stored in English and only translated for display.
  const teamName = useCallback((teamNumber) => t("team", { n: teamNumber }), [t]);

  const modeName = useCallback(
    (storedLabel) => {
      const key = MODE_LABEL_KEYS[storedLabel];
      return key ? t(key) : storedLabel;
    },
    [t]
  );

  return useMemo(
    () => ({ t, teamName, modeName, language, setLanguage }),
    [t, teamName, modeName, language, setLanguage]
  );
}
