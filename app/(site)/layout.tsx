"use client";

import AppShell from "@/components/AppShell/AppShell";
import PageTransition from "@/components/PageTransition";
import type { ReactNode } from "react";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <PageTransition>{children}</PageTransition>
    </AppShell>
  );
}
