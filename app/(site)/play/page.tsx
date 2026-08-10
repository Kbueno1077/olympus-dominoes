"use client";

import PlayGame from "@/modules/Play/PlayGame";
import PlayGate from "@/modules/Play/PlayGate";

export default function PlayPage() {
  return (
    <PlayGate>
      <PlayGame />
    </PlayGate>
  );
}
