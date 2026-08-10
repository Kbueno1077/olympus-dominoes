"use client";

import DominoTile from "@/components/DominoTile";
import type { LegalMove, Tile } from "@/lib/play/types";
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
  onSelect: (tileId: string) => void;
  /**
   * Phone layout: smaller real tile/stand height (not CSS transform),
   * rack still spans full width.
   */
  compact?: boolean;
};

type Density = "desktop" | "portrait" | "landscape";

function rackFaceSize(count: number, width: number, density: Density) {
  if (count <= 0) {
    switch (density) {
      case "landscape":
        return 16;
      case "portrait":
        return 22;
      case "desktop":
        return 36;
      default: {
        const _exhaustive: never = density;
        return _exhaustive;
      }
    }
  }
  const pad = density === "desktop" ? 28 : density === "landscape" ? 14 : 18;
  const usable = Math.max(100, width - pad);
  const raw = Math.floor(usable / count) - (density === "desktop" ? 2 : 1);
  // Real size caps — landscape prioritizes baize height (~12–14% viewport).
  let max: number;
  let min: number;
  switch (density) {
    case "landscape":
      max = 17;
      min = 12;
      break;
    case "portrait":
      max = 23;
      min = 15;
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
  return Math.max(min, Math.min(max, raw));
}

/**
 * Player rack: tiles stand close on a wooden lip, like a real mesa stand.
 * Width is controlled by the parent (full page on mobile).
 */
export default function PlayHand({
  hand,
  legal,
  selectedId,
  disabled,
  onSelect,
  compact = false,
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
  const lift = density === "landscape" ? 3 : density === "portrait" ? 5 : 8;
  const tight = density !== "desktop";
  const landscape = density === "landscape";

  return (
    <Box
      ref={rackRef}
      sx={{
        position: "relative",
        width: "100%",
        borderRadius: landscape
          ? "6px 6px 4px 4px"
          : tight
            ? "8px 8px 6px 6px"
            : "10px 10px 8px 8px",
        background:
          "linear-gradient(180deg, #9A7350 0%, #7A5638 38%, #5C4028 100%)",
        boxShadow: (t) =>
          `0 8px 22px -12px ${alpha(t.palette.common.black, 0.5)}, inset 0 1px 0 ${alpha("#FBF5E9", 0.22)}`,
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
          pt: landscape ? 0.2 : tight ? 0.3 : 0.55,
          pb: landscape ? 0.15 : tight ? 0.25 : 0.45,
          minHeight: face * 2 + (landscape ? 3 : tight ? 5 : 10),
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          overflowX: "auto",
          overflowY: "hidden",
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
              gap: landscape ? "0px" : tight ? "1px" : "2px",
              minHeight: face * 2 + 2,
            }}
          >
            {hand.map((tile, index) => {
              const canPlay = playableIds.has(tile.id);
              const selected = selectedId === tile.id;
              return (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: selected ? -lift : 0 }}
                  transition={{
                    delay: index * 0.015,
                    type: "spring",
                    stiffness: 400,
                    damping: 28,
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <Box
                    component="button"
                    type="button"
                    draggable={!disabled && canPlay}
                    disabled={disabled || !canPlay}
                    onClick={() => onSelect(tile.id)}
                    onDragStart={(event) => {
                      if (disabled || !canPlay) {
                        event.preventDefault();
                        return;
                      }
                      onSelect(tile.id);
                      event.dataTransfer.setData(DRAG_TILE_MIME, tile.id);
                      event.dataTransfer.setData("text/plain", tile.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    aria-label={`${t("playTileAria", { a: tile.a, b: tile.b })}${canPlay ? t("playTilePlayable") : ""}`}
                    data-hand-tile={tile.id}
                    sx={{
                      p: 0,
                      m: 0,
                      border: "none",
                      background: "transparent",
                      cursor: disabled || !canPlay ? "default" : "grab",
                      opacity: canPlay || disabled ? 1 : 0.4,
                      filter: selected
                        ? `drop-shadow(0 5px 7px ${alpha("#B4542F", 0.45)})`
                        : canPlay
                          ? `drop-shadow(0 2px 3px ${alpha("#000", 0.35)})`
                          : "none",
                      outline: selected
                        ? `2px solid ${alpha("#B4542F", 0.9)}`
                        : "1.5px solid transparent",
                      outlineOffset: 1,
                      borderRadius: 1,
                      lineHeight: 0,
                      "&:active": {
                        cursor: canPlay ? "grabbing" : "default",
                      },
                    }}
                  >
                    <DominoTile
                      top={tile.a}
                      bottom={tile.b}
                      size={face}
                      highContrast
                    />
                  </Box>
                </motion.div>
              );
            })}
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
    </Box>
  );
}
