"use client";

import { useEffect, useState } from "react";

/**
 * False on the server and during the first client render, true after mount.
 * Use when persisted client state (e.g. recoil-persist) would otherwise
 * mismatch the SSR HTML.
 */
export function useHasMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
