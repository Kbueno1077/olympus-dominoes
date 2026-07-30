"use client";

import { createContext, useCallback, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LANGUAGE_COOKIE,
} from "./translations";

export const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * The choice lives in a cookie rather than localStorage so the server can
 * render the correct language on the very first paint. Storing it client side
 * would mean the prerendered HTML is always English and every reload in
 * Spanish would fail hydration and re-render the whole tree.
 */
export default function LanguageProvider({ initialLanguage, children }) {
  const [language, setLanguageState] = useState(initialLanguage);

  const setLanguage = useCallback((next) => {
    if (!isSupportedLanguage(next)) return;
    setLanguageState(next);
    document.cookie = `${LANGUAGE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    document.documentElement.lang = next;
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
