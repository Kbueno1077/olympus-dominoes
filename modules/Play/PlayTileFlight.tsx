"use client";

import DominoTile from "@/components/DominoTile";
import { motion } from "framer-motion";
import { useRef } from "react";

export type TileFlight = {
  tileId: string;
  a: number;
  b: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  face: number;
  orientation: "horizontal" | "vertical";
};

type Props = {
  flight: TileFlight;
  /** Flight duration in milliseconds. */
  durationMs: number;
  onComplete: () => void;
};

/**
 * Fixed overlay: tile flies from a seat/hand to its chain slot.
 */
export default function PlayTileFlight({
  flight,
  durationMs,
  onComplete,
}: Props) {
  const { from, to, face, orientation, a, b } = flight;
  const w = orientation === "horizontal" ? face * 2 : face;
  const h = orientation === "horizontal" ? face : face * 2;
  const finished = useRef(false);

  return (
    <motion.div
      initial={{
        left: from.x,
        top: from.y,
        scale: 0.55,
        opacity: 0.92,
      }}
      animate={{
        left: to.x,
        top: to.y,
        scale: 1,
        opacity: 1,
      }}
      transition={{
        duration: Math.max(0.12, durationMs / 1000),
        ease: [0.22, 1, 0.36, 1],
      }}
      onAnimationComplete={() => {
        if (finished.current) return;
        finished.current = true;
        onComplete();
      }}
      style={{
        position: "fixed",
        zIndex: 40,
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        pointerEvents: "none",
        display: "grid",
        placeItems: "center",
        filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))",
      }}
    >
      <DominoTile
        top={a}
        bottom={b}
        size={face}
        orientation={orientation}
        highContrast
      />
    </motion.div>
  );
}
