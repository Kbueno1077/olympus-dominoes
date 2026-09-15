"use client";

import ConfirmDeleteMatch from "@/components/Dialogs/ConfirmDialog/ConfirmDeleteMatch";
import { useMatchStore } from "@/lib/matchStore";
import { useRouter } from "next/navigation";

/** Clears the in-progress match and returns the form to its defaults. */
export default function EndMatchControl({ fullWidth = false, variant }) {
  const router = useRouter();
  const resetMatch = useMatchStore((s) => s.resetMatch);

  const handleCancelGame = () => {
    resetMatch();
    router.push("/", { transitionTypes: ["nav-back"] });
  };

  return (
    <ConfirmDeleteMatch
      onCofirm={handleCancelGame}
      fullWidth={fullWidth}
      variant={variant ?? "outlined"}
    />
  );
}
