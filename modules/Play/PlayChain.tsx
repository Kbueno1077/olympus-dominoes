"use client";

import DominoTile from "@/components/DominoTile";
import {
  DEFAULT_LAYOUT_PREFS,
  layoutChain,
  prefsAfterRotate,
  type LayoutPrefs,
} from "@/lib/play/layoutChain";
import type { ChainSide, PlacedTile } from "@/lib/play/types";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";

export const TEAM_TINT: Record<number, string> = {
  1: "#1F6B58",
  2: "#B4542F",
  3: "#3D6C8C",
  4: "#C08A2E",
};

type Props = {
  chain: PlacedTile[];
  openingTileId?: string | null;
  highlightSide?: ChainSide | null;
  dropEnabled: boolean;
  onDropSide: (side: ChainSide, tileId: string) => void;
  /** Hide while a fly-in animation covers this tile. */
  flyingTileId?: string | null;
  /**
   * Board tile density:
   * - portrait: ~30% smaller than original (phones upright)
   * - landscape: original pre-shrink size
   * - default: desktop
   */
  tileScale?: "default" | "portrait" | "landscape";
};

/**
 * Square board train: opening stays centered; arms snake both ways.
 * Tap a tile to pivot that arm 90° — no free dragging.
 */
export default function PlayChain({
  chain,
  openingTileId = null,
  highlightSide = null,
  dropEnabled,
  onDropSide,
  flyingTileId = null,
  tileScale = "default",
}: Props) {
  const { t } = useTranslation();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [boardSize, setBoardSize] = useState({ w: 420, h: 420 });
  const [prefs, setPrefs] = useState<LayoutPrefs>(DEFAULT_LAYOUT_PREFS);
  const [flashId, setFlashId] = useState<string | null>(null);
  const openingKey = openingTileId ?? "";
  const openingRef = useRef(openingKey);

  // New hand (different opening tile) — reset pivots. Keep them when the train grows.
  useEffect(() => {
    if (openingKey !== openingRef.current) {
      openingRef.current = openingKey;
      setPrefs(DEFAULT_LAYOUT_PREFS);
      return;
    }
    if (chain.length === 0) {
      setPrefs(DEFAULT_LAYOUT_PREFS);
    }
  }, [openingKey, chain.length]);

  // Drop prefs for tiles that left the chain.
  useEffect(() => {
    const alive = new Set(chain.map((t) => t.id));
    setPrefs((prev) => {
      const entries = Object.entries(prev.dirById).filter(([id]) =>
        alive.has(id)
      );
      if (entries.length === Object.keys(prev.dirById).length) return prev;
      return { ...prev, dirById: Object.fromEntries(entries) };
    });
  }, [chain]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      const w = Math.max(1, Math.floor(rect?.width ?? 420));
      const h = Math.max(1, Math.floor(rect?.height ?? 420));
      setBoardSize((prev) =>
        prev.w === w && prev.h === h ? prev : { w, h }
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w: boardW, h: boardH } = boardSize;
  const short = Math.min(boardW, boardH);
  const base = Math.floor(short / 10);
  let face: number;
  switch (tileScale) {
    case "portrait":
      // ~30% smaller than the original phone face.
      face = Math.max(15, Math.min(25, Math.floor(base * 0.7)));
      break;
    case "landscape":
      // Original sizing (before the 50% cut).
      face = Math.max(22, Math.min(36, base));
      break;
    case "default":
      face = Math.max(20, Math.min(36, base));
      break;
    default: {
      const _exhaustive: never = tileScale;
      face = _exhaustive;
      break;
    }
  }
  const compactChrome = tileScale !== "default";
  const openingIndex = Math.max(
    0,
    openingTileId ? chain.findIndex((t) => t.id === openingTileId) : 0
  );
  const layout = useMemo(
    () => layoutChain(chain, boardW, boardH, face, 2, prefs, openingTileId),
    [chain, boardW, boardH, face, prefs, openingTileId]
  );

  const rotateAt = (index: number) => {
    const laid = layout.tiles[index];
    if (!laid) return;
    setPrefs((prev) =>
      prefsAfterRotate(prev, chain, index, laid.dir, openingIndex)
    );
    setFlashId(laid.tile.id);
    window.setTimeout(() => setFlashId(null), 220);
  };

  const handleEndDrop = (side: ChainSide, event: React.DragEvent) => {
    if (!dropEnabled) return;
    event.preventDefault();
    const tileId =
      event.dataTransfer.getData("application/x-olympus-tile") ||
      event.dataTransfer.getData("text/plain");
    if (tileId) onDropSide(side, tileId);
  };

  return (
    <Box
      ref={boardRef}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 1.5,
        overflow: "hidden",
      }}
    >
      {chain.length === 0 ? (
        <Box
          onDragOver={(event) => {
            if (!dropEnabled) return;
            event.preventDefault();
          }}
          onDrop={(event) => handleEndDrop("right", event)}
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            minWidth: 140,
            minHeight: 72,
            display: "grid",
            placeItems: "center",
            px: 2,
            borderRadius: 2,
            border: `2px dashed ${alpha("#FBF5E9", 0.45)}`,
            color: alpha("#FBF5E9", 0.9),
            fontSize: 13,
            fontWeight: 600,
            backgroundColor: alpha("#0B2E24", 0.28),
          }}
        >
          {t("playDropOpening")}
        </Box>
      ) : (
        <>
          {layout.tiles.map((laid, index) => {
            const flying = flyingTileId === laid.tile.id;
            return (
              <Box
                key={laid.tile.id}
                component="button"
                type="button"
                data-chain-tile={laid.tile.id}
                data-face-a={laid.faceA}
                data-face-b={laid.faceB}
                aria-label={t("playRotateTile", {
                  a: laid.faceA,
                  b: laid.faceB,
                })}
                onClick={() => rotateAt(index)}
                sx={{
                  position: "absolute",
                  left: Math.round(laid.x),
                  top: Math.round(laid.y),
                  width: laid.width,
                  height: laid.height,
                  display: "grid",
                  placeItems: "center",
                  p: 0,
                  m: 0,
                  border: "none",
                  background: "transparent",
                  cursor: flying ? "default" : "pointer",
                  touchAction: "manipulation",
                  zIndex: flashId === laid.tile.id ? 5 : 1,
                  opacity: flying ? 0 : 1,
                  transition: "filter 160ms ease",
                  filter:
                    flashId === laid.tile.id
                      ? "drop-shadow(0 0 8px rgba(251,245,233,0.55))"
                      : "none",
                  pointerEvents: flying ? "none" : "auto",
                  "&:focus-visible": {
                    outline: `2px solid ${alpha("#FBF5E9", 0.85)}`,
                    outlineOffset: 2,
                  },
                }}
              >
                <DominoTile
                  top={laid.faceA}
                  bottom={laid.faceB}
                  size={face}
                  orientation={laid.orientation}
                  highContrast
                />
              </Box>
            );
          })}

          <DropAnchor
            x={layout.leftAnchor.x}
            y={layout.leftAnchor.y}
            label="L"
            active={highlightSide === "left"}
            enabled={dropEnabled}
            size={Math.round(face * 1.5)}
            onDragOver={(e) => {
              if (!dropEnabled) return;
              e.preventDefault();
            }}
            onDrop={(e) => handleEndDrop("left", e)}
          />
          <DropAnchor
            x={layout.rightAnchor.x}
            y={layout.rightAnchor.y}
            label="R"
            active={highlightSide === "right"}
            enabled={dropEnabled}
            size={Math.round(face * 1.5)}
            onDragOver={(e) => {
              if (!dropEnabled) return;
              e.preventDefault();
            }}
            onDrop={(e) => handleEndDrop("right", e)}
          />
        </>
      )}

      {chain.length > 0 && !compactChrome && (
        <Typography
          sx={{
            position: "absolute",
            left: 6,
            bottom: 4,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: alpha("#FBF5E9", 0.45),
            pointerEvents: "none",
            zIndex: 2,
            display: { xs: "none", sm: "block" },
          }}
        >
          {t("playTapToTurn")}
        </Typography>
      )}
    </Box>
  );
}

function DropAnchor({
  x,
  y,
  label,
  active,
  enabled,
  onDragOver,
  onDrop,
  size = 28,
}: {
  x: number;
  y: number;
  label: string;
  active: boolean;
  enabled: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  size?: number;
}) {
  const [over, setOver] = useState(false);
  return (
    <Box
      onDragOver={(e) => {
        onDragOver(e);
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        onDrop(e);
      }}
      sx={{
        position: "absolute",
        left: Math.round(x),
        top: Math.round(y),
        transform: "translate(-50%, -50%)",
        width: size,
        height: size,
        borderRadius: `${Math.max(3, Math.round(size * 0.14))}px`,
        display: "grid",
        placeItems: "center",
        border: `2px dashed ${alpha("#FBF5E9", over || active ? 0.95 : 0.45)}`,
        backgroundColor: alpha("#C08A2E", over ? 0.5 : active ? 0.28 : 0.12),
        pointerEvents: enabled ? "auto" : "none",
        zIndex: 4,
      }}
    >
      <Typography
        sx={{
          color: "#FBF5E9",
          fontSize: Math.max(11, Math.round(size * 0.42)),
          fontWeight: 800,
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
