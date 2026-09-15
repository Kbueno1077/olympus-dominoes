"use client";

import { usePathname } from "next/navigation";
import { ViewTransition, type ReactNode } from "react";

/**
 * Native React 19.3 View Transitions around App Router page swaps.
 * Keyed by pathname so enter/exit fire; `transitionTypes` on Link/router
 * pick the directional slide, otherwise the browser cross-fade runs.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition
      key={pathname}
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "auto",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "auto",
      }}
    >
      {children}
    </ViewTransition>
  );
}
