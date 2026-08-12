"use client";

import DominoTile from "@/components/DominoTile";
import type { ChainSide, LegalMove, Tile } from "@/lib/play/types";
import { rackDisplayFaces } from "@/lib/play/tiles";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Stack, Typography, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export const DRAG_TILE_MIME = "application/x-olympus-tile";

type Props = {
  hand: Tile[];
  legal: LegalMove[];
  selectedId: string | null;
  disabled: boolean;
  /** Single / double tap. Parent decides select vs play. */
  onSelect: (tileId: string) => void;
  /** Drag start — select only; do not auto-play. */
  onArm?: (tileId: string) => void;
  /** Pointer drop onto board L·R / opening zones (`data-drop-side`). */
  onDropSide?: (side: ChainSide, tileId: string) => void;
  /**
   * Phone layout: smaller real tile/stand height (not CSS transform),
   * rack still spans full width.
   */
  compact?: boolean;
  /** Drag tiles to reorder; play / board drops are disabled. */
  rearrange?: boolean;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /** Flip a tile 180° on the rack (e.g. tap while rearranging). */
  onFlip?: (tileId: string) => void;
};

/** Rearrange / play: pixels before a press becomes a drag. */
const DRAG_THRESHOLD_PX = 12;

type Density = "desktop" | "portrait" | "landscape";

type PointerDrag = {
  tileId: string;
  top: number;
  bottom: number;
  x: number;
  y: number;
  pointerId: number;
};

function rackFaceSize(count: number, width: number, density: Density) {
  /** Shared bump for tile + stand height (lockstep — no CSS scale). */
  const bump = (face: number) => Math.round(face * 1.1);

  if (count <= 0) {
    switch (density) {
      case "landscape":
        return bump(18);
      case "portrait":
        return bump(25);
      case "desktop":
        return bump(36);
      default: {
        const _exhaustive: never = density;
        return _exhaustive;
      }
    }
  }
  const pad = density === "desktop" ? 28 : density === "landscape" ? 14 : 18;
  const usable = Math.max(100, width - pad);
  const raw = Math.floor(usable / count) - (density === "desktop" ? 2 : 1);
  // Face drives both tile and stand height — keep them in lockstep (no CSS scale).
  let max: number;
  let min: number;
  switch (density) {
    case "landscape":
      max = 20;
      min = 14;
      break;
    case "portrait":
      max = 26;
      min = 17;
      break;
    case "desktop":
      max = 38;
      min = 24;
      break;
    default: {
      const _exhaustive: never = density;
      return _exhaustive;
    }
  }
  return bump(Math.max(min, Math.min(max, raw)));
}

function dropSideAtPoint(x: number, y: number): ChainSide | null {
  const stack = document.elementsFromPoint(x, y);
  for (const node of stack) {
    if (!(node instanceof Element)) continue;
    const host = node.closest("[data-drop-side]");
    const side = host?.getAttribute("data-drop-side");
    if (side === "left" || side === "right") return side;
  }
  return null;
}

/** Insert index among `handIds` after removing `dragId`, based on pointer x. */
function reorderIndexAtX(
  x: number,
  handIds: string[],
  dragId: string
): number {
  const others = handIds.filter((id) => id !== dragId);
  if (others.length === 0) return 0;
  for (let i = 0; i < others.length; i += 1) {
    const el = document.querySelector(
      `[data-hand-tile="${others[i]}"]`
    ) as HTMLElement | null;
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (x < rect.left + rect.width / 2) return i;
  }
  return others.length;
}

/**
 * Player rack: tiles stand close on a wooden lip, like a real mesa stand.
 * Width is controlled by the parent (full page on mobile).
 * Play: tap select, double-tap play, press+slide to drag onto zones
 * (pointer preview — solid opacity, not the browser’s faded HTML5 ghost).
 * Rearrange: drag to reorder.
 */
export default function PlayHand({
  hand,
  legal,
  selectedId,
  disabled,
  onSelect,
  onArm,
  onDropSide,
  compact = false,
  rearrange = false,
  onReorder,
  onFlip,
}: Props) {
  const { t } = useTranslation();
  const shortLandscape = useMediaQuery(
    "(orientation: landscape) and (max-height: 520px)"
  );
  const density: Density = !compact
    ? "desktop"
    : shortLandscape
      ? "landscape"
      : "portrait";

  const playableIds = new Set(legal.map((m) => m.tileId));
  const [rackWidth, setRackWidth] = useState(360);
  const rackRef = useRef<HTMLDivElement | null>(null);
  const pressRef = useRef<{
    tileId: string;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [pointerDrag, setPointerDrag] = useState<PointerDrag | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  const clearPress = () => {
    pressRef.current = null;
  };

  useEffect(() => {
    const el = rackRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 360;
      setRackWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const face = rackFaceSize(hand.length, rackWidth, density);
  const tight = density !== "desktop";
  const landscape = density === "landscape";
  const tileGap = landscape ? 2 : tight ? 3 : 2;
  const lift = density === "landscape" ? 3 : density === "portrait" ? 5 : 8;

  const endPointerDrag = (
    clientX: number,
    clientY: number,
    tileId: string,
    wasDragging: boolean
  ) => {
    clearPress();
    setPointerDrag(null);
    setInsertIndex(null);

    if (!wasDragging) return;

    if (rearrange && onReorder) {
      const from = hand.findIndex((t) => t.id === tileId);
      if (from < 0) return;
      const to = reorderIndexAtX(
        clientX,
        hand.map((t) => t.id),
        tileId
      );
      onReorder(from, to);
      return;
    }

    if (!onDropSide) return;
    const side = dropSideAtPoint(clientX, clientY);
    if (side) onDropSide(side, tileId);
  };

  return (
    <Box
      ref={rackRef}
      sx={{
        position: "relative",
        zIndex: selectedId || pointerDrag ? 30 : 1,
        width: "100%",
        borderRadius: landscape
          ? "6px 6px 4px 4px"
          : tight
            ? "8px 8px 6px 6px"
            : "10px 10px 8px 8px",
        background:
          "linear-gradient(180deg, #9A7350 0%, #7A5638 38%, #5C4028 100%)",
        boxShadow: (theme) =>
          rearrange
            ? `0 0 0 2px ${alpha("#E8A04A", 0.85)}, 0 8px 22px -12px ${alpha(theme.palette.common.black, 0.5)}, inset 0 1px 0 ${alpha("#FBF5E9", 0.22)}`
            : `0 8px 22px -12px ${alpha(theme.palette.common.black, 0.5)}, inset 0 1px 0 ${alpha("#FBF5E9", 0.22)}`,
        px: landscape ? 0.35 : tight ? 0.45 : { xs: 0.6, sm: 1 },
        pt: landscape ? 0.3 : tight ? 0.45 : { xs: 0.75, sm: 0.9 },
        pb: landscape ? 0.2 : tight ? 0.3 : { xs: 0.55, sm: 0.7 },
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: landscape ? 0.5 : tight ? 0.75 : 1,
          background: `linear-gradient(180deg, ${alpha("#2A1C12", 0.35)} 0%, ${alpha("#1A120C", 0.5)} 100%)`,
          boxShadow: `inset 0 2px 6px ${alpha("#000", 0.35)}`,
          px: landscape ? 0.2 : tight ? 0.3 : 0.4,
          pt: (landscape ? 0.2 : tight ? 0.3 : 0.55) + lift / 8,
          pb: landscape ? 0.15 : tight ? 0.25 : 0.45,
          minHeight: face * 2 + lift + (landscape ? 3 : tight ? 5 : 10),
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          overflowX: "auto",
          overflowY: "visible",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {hand.length === 0 ? (
          <Typography
            sx={{
              fontSize: tight ? 10 : 11,
              fontWeight: 700,
              color: alpha("#FBF5E9", 0.45),
              py: 0.5,
            }}
          >
            {t("playEmptyHand")}
          </Typography>
        ) : (
          <Stack
            direction="row"
            alignItems="flex-end"
            justifyContent="center"
            sx={{
              gap: `${tileGap}px`,
              minHeight: face * 2 + 2,
              position: "relative",
              zIndex: 1,
            }}
          >
            {hand.map((tile, index) => {
              const canPlay = !rearrange && playableIds.has(tile.id);
              const selected = !rearrange && selectedId === tile.id;
              const ghosting = pointerDrag?.tileId === tile.id;
              const faces = rackDisplayFaces(tile);
              const showInsertBefore =
                rearrange &&
                insertIndex != null &&
                pointerDrag != null &&
                pointerDrag.tileId !== tile.id &&
                insertIndex ===
                  hand
                    .filter((t) => t.id !== pointerDrag.tileId)
                    .findIndex((t) => t.id === tile.id);
              return (
                <motion.div
                  key={tile.id}
                  layout={!pointerDrag}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: ghosting ? 0.35 : 1,
                    y: selected && !ghosting ? -lift : 0,
                  }}
                  transition={{
                    delay: pointerDrag ? 0 : index * 0.015,
                    type: "spring",
                    stiffness: 400,
                    damping: 28,
                  }}
                  style={{
                    flexShrink: 0,
                    position: "relative",
                    zIndex:
                      selected || ghosting ? 40 : canPlay || rearrange ? 2 : 1,
                  }}
                >
                  {showInsertBefore && (
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        left: -Math.max(2, tileGap),
                        top: 4,
                        bottom: 4,
                        width: 3,
                        borderRadius: 1,
                        backgroundColor: "#E8A04A",
                        zIndex: 5,
                      }}
                    />
                  )}
                  <Box
                    component="button"
                    type="button"
                    draggable={false}
                    disabled={rearrange ? false : disabled || !canPlay}
                    onClick={() => {
                      if (rearrange) return;
                      if (suppressClickRef.current) {
                        suppressClickRef.current = false;
                        return;
                      }
                      onSelect(tile.id);
                    }}
                    onPointerDown={(event) => {
                      if (rearrange) {
                        if (!onReorder || hand.length < 2) return;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        pressRef.current = {
                          tileId: tile.id,
                          startX: event.clientX,
                          startY: event.clientY,
                          dragging: false,
                        };
                        return;
                      }
                      if (disabled || !canPlay || !onDropSide) return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      pressRef.current = {
                        tileId: tile.id,
                        startX: event.clientX,
                        startY: event.clientY,
                        dragging: false,
                      };
                    }}
                    onPointerMove={(event) => {
                      const press = pressRef.current;
                      if (!press || press.tileId !== tile.id) return;
                      const dist = Math.hypot(
                        event.clientX - press.startX,
                        event.clientY - press.startY
                      );
                      if (!press.dragging && dist < DRAG_THRESHOLD_PX) return;
                      if (!press.dragging) {
                        press.dragging = true;
                        suppressClickRef.current = true;
                        if (!rearrange) onArm?.(tile.id);
                      }
                      setPointerDrag({
                        tileId: tile.id,
                        top: faces.top,
                        bottom: faces.bottom,
                        x: event.clientX,
                        y: event.clientY,
                        pointerId: event.pointerId,
                      });
                      if (rearrange) {
                        setInsertIndex(
                          reorderIndexAtX(
                            event.clientX,
                            hand.map((t) => t.id),
                            tile.id
                          )
                        );
                      }
                    }}
                    onPointerUp={(event) => {
                      const press = pressRef.current;
                      if (!press || press.tileId !== tile.id) return;
                      const wasDragging = press.dragging;
                      endPointerDrag(
                        event.clientX,
                        event.clientY,
                        tile.id,
                        wasDragging
                      );
                      if (rearrange && !wasDragging) {
                        onFlip?.(tile.id);
                      }
                      try {
                        event.currentTarget.releasePointerCapture(
                          event.pointerId
                        );
                      } catch {
                        /* already released */
                      }
                    }}
                    onPointerCancel={() => {
                      clearPress();
                      setPointerDrag(null);
                      setInsertIndex(null);
                    }}
                    aria-label={`${t("playTileAria", { a: tile.a, b: tile.b })}${
                      rearrange
                        ? `, ${t("playRearrangeDrag")}, ${t("playFlipTileHint")}`
                        : canPlay
                          ? t("playTilePlayable")
                          : ""
                    }`}
                    data-hand-tile={tile.id}
                    sx={{
                      p: 0,
                      m: 0,
                      border: "none",
                      background: "transparent",
                      cursor: rearrange
                        ? "grab"
                        : disabled || !canPlay
                          ? "default"
                          : "grab",
                      opacity: rearrange
                        ? 1
                        : canPlay || disabled
                          ? 1
                          : 0.4,
                      filter: selected
                        ? `drop-shadow(0 5px 7px ${alpha("#B4542F", 0.45)})`
                        : rearrange || canPlay
                          ? `drop-shadow(0 2px 3px ${alpha("#000", 0.35)})`
                          : "none",
                      outline: selected
                        ? `2px solid ${alpha("#B4542F", 0.9)}`
                        : rearrange
                          ? `1.5px solid ${alpha("#E8A04A", 0.55)}`
                          : "1.5px solid transparent",
                      outlineOffset: 1,
                      borderRadius: 1,
                      lineHeight: 0,
                      touchAction:
                        rearrange || canPlay ? "none" : "manipulation",
                      WebkitUserSelect: "none",
                      userSelect: "none",
                      "&:active": {
                        cursor:
                          rearrange || canPlay ? "grabbing" : "default",
                      },
                    }}
                  >
                    <DominoTile
                      top={faces.top}
                      bottom={faces.bottom}
                      size={face}
                      highContrast
                    />
                  </Box>
                </motion.div>
              );
            })}
            {rearrange &&
              insertIndex != null &&
              pointerDrag &&
              insertIndex >=
                hand.filter((t) => t.id !== pointerDrag.tileId).length && (
                <Box
                  aria-hidden
                  sx={{
                    width: 3,
                    alignSelf: "stretch",
                    minHeight: face * 2,
                    borderRadius: 1,
                    backgroundColor: "#E8A04A",
                    flexShrink: 0,
                  }}
                />
              )}
          </Stack>
        )}
      </Box>
      <Box
        sx={{
          mt: landscape ? 0.15 : tight ? 0.2 : 0.4,
          height: landscape ? 3 : tight ? 4 : 7,
          borderRadius: landscape
            ? "0 0 3px 3px"
            : tight
              ? "0 0 4px 4px"
              : "0 0 5px 5px",
          background:
            "linear-gradient(180deg, #A67B52 0%, #6B4A2D 55%, #4A3320 100%)",
          boxShadow: `inset 0 1px 0 ${alpha("#FBF5E9", 0.2)}`,
        }}
      />

      {pointerDrag && (
        <Box
          sx={{
            position: "fixed",
            left: pointerDrag.x,
            top: pointerDrag.y,
            transform: "translate(-50%, -60%)",
            zIndex: 1400,
            pointerEvents: "none",
            // Solid drag image (pointer path); avoid browser HTML5 ghost fade.
            opacity: 1,
            filter: `drop-shadow(0 8px 14px ${alpha("#000", 0.45)})`,
          }}
        >
          <DominoTile
            top={pointerDrag.top}
            bottom={pointerDrag.bottom}
            size={face}
            highContrast
          />
        </Box>
      )}
    </Box>
  );
}
