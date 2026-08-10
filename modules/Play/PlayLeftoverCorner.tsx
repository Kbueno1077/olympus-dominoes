"use client";

import DominoTile from "@/components/DominoTile";
import { TEAM_TINT } from "@/modules/Play/PlayChain";
import type { Seat } from "@/lib/play/types";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type SeatPos = "top" | "left" | "right" | "bottom";

type Props = {
  seat: Seat;
  position: SeatPos;
  isWinner: boolean;
  compact?: boolean;
};

function cornerSx(position: SeatPos, compact: boolean) {
  const inset = compact ? 4 : 8;
  switch (position) {
    case "top":
      return {
        top: inset,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "72%",
      };
    case "bottom":
      return {
        bottom: inset,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "72%",
      };
    case "left":
      return {
        left: inset,
        top: "50%",
        transform: "translateY(-50%)",
        maxWidth: compact ? 108 : 144,
      };
    case "right":
      return {
        right: inset,
        top: "50%",
        transform: "translateY(-50%)",
        maxWidth: compact ? 108 : 144,
      };
    default: {
      const _exhaustive: never = position;
      return _exhaustive;
    }
  }
}

/**
 * Corner reveal of leftover tiles when a hand ends.
 */
export default function PlayLeftoverCorner({
  seat,
  position,
  isWinner,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const tint = TEAM_TINT[seat.team] ?? TEAM_TINT[1];
  const face = compact ? 15 : 20;
  const side = position === "left" || position === "right";
  const pips = seat.hand.reduce((sum, tile) => sum + tile.a + tile.b, 0);

  return (
    <Box
      sx={{
        position: "absolute",
        zIndex: 6,
        pointerEvents: "none",
        ...cornerSx(position, compact),
      }}
    >
      <Stack
        spacing={0.35}
        alignItems="center"
        sx={{
          px: compact ? 0.5 : 0.75,
          py: compact ? 0.4 : 0.55,
          borderRadius: 1.25,
          backgroundColor: alpha("#FDF8EE", isWinner ? 0.96 : 0.88),
          border: `1.5px solid ${alpha(
            isWinner ? "#C08A2E" : tint,
            isWinner ? 0.9 : 0.45
          )}`,
          boxShadow: isWinner
            ? `0 0 0 1px ${alpha("#C08A2E", 0.35)}, 0 4px 14px ${alpha("#000", 0.28)}`
            : `0 3px 10px ${alpha("#000", 0.22)}`,
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: compact ? 11 : 13,
            lineHeight: 1.1,
            color: "primary.dark",
            whiteSpace: "nowrap",
            maxWidth: side ? (compact ? 96 : 120) : "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {t(seat.name)}
          <Box
            component="span"
            sx={{
              ml: 0.5,
              fontWeight: 700,
              color: alpha("#241D14", 0.55),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            · {pips}
          </Box>
        </Typography>

        {seat.hand.length === 0 ? (
          <Typography
            sx={{
              fontSize: compact ? 8 : 10,
              fontWeight: 700,
              color: alpha("#241D14", 0.4),
              py: 0.25,
            }}
          >
            {t("playEmptyHand")}
          </Typography>
        ) : (
          <Stack
            direction={side ? "column" : "row"}
            alignItems="center"
            justifyContent="center"
            sx={{
              gap: "1px",
              maxHeight: side ? (compact ? 132 : 180) : undefined,
              maxWidth: side ? undefined : "100%",
              overflow: "auto",
              flexWrap: side ? "nowrap" : "wrap",
            }}
          >
            {seat.hand.map((tile) => (
              <DominoTile
                key={tile.id}
                top={tile.a}
                bottom={tile.b}
                size={face}
                orientation={side ? "horizontal" : "vertical"}
                highContrast
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
