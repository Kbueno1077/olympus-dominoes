"use client";

import Dashboard from "@/components/Dashboard/Dashboard";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <Dashboard
      onPlayWithBots={() =>
        router.push("/play", { transitionTypes: ["nav-forward"] })
      }
      onStartScorepad={() =>
        router.push("/match", { transitionTypes: ["nav-forward"] })
      }
    />
  );
}
