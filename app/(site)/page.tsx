"use client";

import Dashboard from "@/components/Dashboard/Dashboard";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <Dashboard
      onStartNewGame={() => router.push("/match")}
      onOpenAnalytics={() => router.push("/stats")}
    />
  );
}
