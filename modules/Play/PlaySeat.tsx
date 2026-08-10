"use client";

import { TEAM_TINT } from "@/modules/Play/PlayChain";
import type { Seat } from "@/lib/play/types";
import { useTranslation } from "@/i18n/useTranslation";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type SeatPosition = "top" | "left" | "right" | "bottom";

type Props = {
  seat: Seat;
  isTurn: boolean;
  passed: boolean;
  position: SeatPosition;
  /** Mobile stand densify (desktop unused when variant=chip). */
  compact?: boolean;
  /** Phone: corner pill instead of wooden stand. */
  variant?: "stand" | "chip";
  /** Anchor for bot tile fly-in (seat → board). */
  anchorRef?: (el: HTMLElement | null) => void;
};

/** Domino back — bone face you can count across the table. */
function TileBack({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <Box
      aria-hidden
      sx={{
        width,
        height,
        flexShrink: 0,
        borderRadius: `${Math.max(2, Math.round(Math.min(width, height) * 0.14))}px`,
        background:
          "linear-gradient(152deg, #F6F0E2 0%, #E6D7BC 50%, #D0BC96 100%)",
        border: `1px solid ${alpha("#241D14", 0.4)}`,
        boxShadow: `inset 0 1px 0 ${alpha("#FFFDF8", 0.55)}, 0 1px 2px ${alpha("#000", 0.22)}`,
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          left: "50%",
          top: "14%",
          bottom: "14%",
          width: 1,
          transform: "translateX(-50%)",
          backgroundColor: alpha("#241D14", 0.16),
        },
      }}
    />
  );
}

function SeatLabel({
  name,
  tint,
  isTurn,
  compact,
}: {
  name: string;
  tint: string;
  isTurn: boolean;
  compact?: boolean;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.35}
      sx={{ px: 0.2 }}
    >
      <Box
        aria-hidden
        sx={{
          width: compact ? 5 : 6,
          height: compact ? 5 : 6,
          borderRadius: "50%",
          backgroundColor: tint,
          flexShrink: 0,
          // Fixed ring — color only changes, no layout shift.
          boxShadow: isTurn
            ? `0 0 0 2px ${alpha(tint, 0.85)}, 0 0 6px ${alpha(tint, 0.55)}`
            : `0 0 0 2px transparent`,
          animation: isTurn ? "seatTurnPulse 1.4s ease-in-out infinite" : "none",
          "@keyframes seatTurnPulse": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.55 },
          },
        }}
      />
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: compact ? 9 : 12,
          color: alpha("#241D14", 0.92),
          lineHeight: 1,
          whiteSpace: "nowrap",
          maxWidth: compact ? 52 : "none",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </Typography>
    </Stack>
  );
}

/**
 * Seat stand facing the table — no CSS spin. Side seats are built vertical;
 * top/bottom stay horizontal. Chip variant is a corner pill for phones so the
 * baize keeps full width/height.
 */
export default function PlaySeat({
  seat,
  isTurn,
  passed,
  position,
  compact = false,
  variant = "stand",
  anchorRef,
}: Props) {
  const { t } = useTranslation();
  const tint = TEAM_TINT[seat.team] ?? TEAM_TINT[1];
  const tiles = seat.hand.length;
  const displayName = t(seat.name);

  if (variant === "chip") {
    return (
      <Stack
        ref={anchorRef}
        direction="row"
        alignItems="center"
        spacing={0.5}
        role="status"
        aria-label={`${displayName}, ${t("playTilesRemaining", { n: tiles })}${isTurn ? ", turn" : ""}${passed ? `, ${t("playPassed")}` : ""}`}
        sx={{
          boxSizing: "border-box",
          width: passed ? 118 : 102,
          height: 26,
          px: 0.75,
          py: 0,
          borderRadius: 999,
          justifyContent: "flex-start",
          backgroundColor: passed
            ? alpha("#8A6440", 0.92)
            : alpha("#FBF5E9", isTurn ? 1 : 0.92),
          border: `1.5px solid ${alpha(
            passed ? "#5C4028" : tint,
            isTurn ? 0.95 : passed ? 0.95 : 0.28
          )}`,
          boxShadow: passed
            ? `0 0 0 2px ${alpha("#C08A2E", 0.55)}, 0 2px 10px ${alpha("#000", 0.28)}`
            : isTurn
              ? `0 0 0 2px ${alpha(tint, 0.45)}, 0 2px 8px ${alpha("#000", 0.22)}`
              : `0 0 0 2px transparent, 0 2px 6px ${alpha("#000", 0.18)}`,
          opacity: isTurn || passed ? 1 : 0.7,
          transition:
            "box-shadow 160ms ease, border-color 160ms ease, opacity 160ms ease, background-color 160ms ease, width 160ms ease",
          animation: passed ? "seatPassPop 420ms ease-out" : "none",
          "@keyframes seatPassPop": {
            "0%": { transform: "scale(0.92)", opacity: 0.7 },
            "55%": { transform: "scale(1.06)" },
            "100%": { transform: "scale(1)", opacity: 1 },
          },
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: passed ? "#FBF5E9" : tint,
            flexShrink: 0,
            boxShadow:
              isTurn && !passed
                ? `0 0 0 2px ${alpha(tint, 0.9)}, 0 0 8px ${alpha(tint, 0.55)}`
                : `0 0 0 2px transparent`,
            animation:
              isTurn && !passed
                ? "seatTurnPulse 1.4s ease-in-out infinite"
                : "none",
            "@keyframes seatTurnPulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.5 },
            },
          }}
        />
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: 11,
            color: alpha(passed ? "#FBF5E9" : "#241D14", 0.95),
            lineHeight: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
            minWidth: 0,
          }}
        >
          {displayName}
        </Typography>
        {passed ? (
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 10,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#FBF5E9",
              lineHeight: 1,
              flexShrink: 0,
              px: 0.45,
              py: 0.2,
              borderRadius: 0.5,
              backgroundColor: alpha("#1A120C", 0.35),
            }}
          >
            {t("playPassed")}
          </Typography>
        ) : (
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 11,
              fontVariantNumeric: "tabular-nums",
              color: alpha("#241D14", 0.55),
              lineHeight: 1,
              flexShrink: 0,
              minWidth: 14,
              textAlign: "right",
            }}
          >
            {tiles}
          </Typography>
        )}
      </Stack>
    );
  }

  const side = position === "left" || position === "right";
  const lipTowardTable =
    position === "top"
      ? "bottom"
      : position === "bottom"
        ? "bottom"
        : position === "left"
          ? "right"
          : "left";

  // Rivals (side): edge-on bones in a column.
  // Partner/top & bottom: upright bones, height-matched to that edge-on band
  // so the stand keeps the same outer dimensions.
  const edgeW = compact
    ? tiles > 8
      ? 18
      : 20
    : tiles > 8
      ? 27
      : 30;
  const edgeH = compact
    ? tiles > 8
      ? 9
      : 10
    : tiles > 8
      ? 14
      : 15;
  const backW = side ? edgeW : Math.max(6, Math.round(edgeH / 2));
  const backH = side ? edgeH : edgeH;
  const gap = compact ? 1 : side ? 3 : 2;
  /** Negative margin packs backs so height/width is real-smaller, not CSS scale. */
  const overlap = compact ? (side ? -5 : -3) : 0;
  const lip = compact ? 5 : 8;
  const woodPad = compact ? 0.35 : 0.55;
  const trayPadX = compact ? 0.35 : 0.55;
  const trayPadY = compact ? 0.4 : 0.6;

  const wood = {
    background:
      "linear-gradient(165deg, #9A7350 0%, #7A5638 42%, #5C4028 100%)",
    boxShadow: `0 2px 8px -3px ${alpha("#000", 0.45)}, inset 0 1px 0 ${alpha("#FBF5E9", 0.2)}`,
  } as const;

  const tray = {
    backgroundColor: alpha("#FBF5E9", isTurn || passed ? 0.97 : 0.9),
    border: `${compact ? 1 : 1.5}px solid ${alpha(
      passed ? "#8A6440" : tint,
      isTurn || passed ? 0.9 : 0.28
    )}`,
    // Always reserve outer ring so turn highlight doesn't shift size.
    boxShadow: isTurn
      ? `0 0 0 1.5px ${alpha(tint, 0.35)}`
      : `0 0 0 1.5px transparent`,
  } as const;

  const lipSx =
    lipTowardTable === "bottom"
      ? {
          mt: compact ? 0.25 : 0.4,
          height: lip,
          width: "100%",
          borderRadius: `0 0 ${compact ? 3 : 5}px ${compact ? 3 : 5}px`,
        }
      : lipTowardTable === "right"
        ? {
            ml: compact ? 0.25 : 0.4,
            width: lip,
            alignSelf: "stretch",
            borderRadius: `0 ${compact ? 3 : 5}px ${compact ? 3 : 5}px 0`,
          }
        : {
            mr: compact ? 0.25 : 0.4,
            width: lip,
            alignSelf: "stretch",
            borderRadius: `${compact ? 3 : 5}px 0 0 ${compact ? 3 : 5}px`,
          };

  const tileList =
    tiles === 0 ? (
      <Typography
        sx={{
          fontSize: compact ? 9 : 10,
          fontWeight: 700,
          color: alpha("#241D14", 0.4),
          py: 0.35,
        }}
      >
        0
      </Typography>
    ) : (
      Array.from({ length: tiles }).map((_, i) => (
        <Box
          key={i}
          sx={{
            flexShrink: 0,
            mt: side && i > 0 ? `${overlap}px` : 0,
            ml: !side && i > 0 ? `${overlap}px` : 0,
          }}
        >
          <TileBack width={backW} height={backH} />
        </Box>
      ))
    );

  if (side) {
    return (
      <Stack
        ref={anchorRef}
        direction="row"
        alignItems="stretch"
        sx={{
          ...wood,
          borderRadius: compact ? 1 : 1.5,
          p: woodPad,
        }}
      >
        {lipTowardTable === "left" && (
          <Box
            sx={{
              ...lipSx,
              background:
                "linear-gradient(90deg, #4A3320 0%, #6B4A2D 40%, #A67B52 100%)",
              boxShadow: `inset 0 1px 0 ${alpha("#FBF5E9", 0.15)}`,
            }}
          />
        )}
        <Stack
          alignItems="center"
          spacing={compact ? 0.3 : 0.5}
          sx={{
            ...tray,
            borderRadius: compact ? 0.75 : 1,
            px: trayPadX,
            py: trayPadY,
            minWidth: backW + (compact ? 8 : 14),
          }}
        >
          <SeatLabel
            name={displayName}
            tint={tint}
            isTurn={isTurn}
            compact
          />
          {passed && (
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: compact ? 9 : 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#FBF5E9",
                backgroundColor: alpha("#8A6440", 0.95),
                px: 0.65,
                py: 0.25,
                borderRadius: 0.75,
                lineHeight: 1,
                boxShadow: `0 1px 4px ${alpha("#000", 0.25)}`,
              }}
            >
              {t("playPassed")}
            </Typography>
          )}
          <Stack
            direction="column"
            alignItems="center"
            spacing={overlap < 0 ? 0 : `${gap}px`}
            role="img"
            aria-label={t("playTilesRemaining", { n: tiles })}
            sx={{
              py: 0.1,
              maxHeight: compact ? 92 : { xs: 168, sm: 220 },
              overflowY: tiles > (compact ? 10 : 8) ? "auto" : "visible",
              overscrollBehavior: "contain",
            }}
          >
            {tileList}
          </Stack>
          <Typography
            sx={{
              fontSize: compact ? 9 : 11,
              fontWeight: 800,
              color: alpha("#241D14", 0.55),
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {tiles}
          </Typography>
        </Stack>
        {lipTowardTable === "right" && (
          <Box
            sx={{
              ...lipSx,
              background:
                "linear-gradient(90deg, #A67B52 0%, #6B4A2D 60%, #4A3320 100%)",
              boxShadow: `inset 0 1px 0 ${alpha("#FBF5E9", 0.15)}`,
            }}
          />
        )}
      </Stack>
    );
  }

  const flipForTop = position === "top";

  return (
    <Box
      ref={anchorRef}
      sx={{
        ...wood,
        borderRadius: compact ? 1 : 1.5,
        p: woodPad,
        display: "flex",
        flexDirection: flipForTop ? "column-reverse" : "column",
      }}
    >
      <Stack
        alignItems="center"
        spacing={compact ? 0.3 : 0.5}
        sx={{
          ...tray,
          borderRadius: compact ? 0.75 : 1,
          px: trayPadX,
          py: trayPadY,
          // Match rival tray depth: tile height + same side padding.
          minHeight: backH + (compact ? 8 : 14),
        }}
      >
        <SeatLabel
          name={displayName}
          tint={tint}
          isTurn={isTurn}
          compact
        />
        {passed && (
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: compact ? 9 : 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#FBF5E9",
              backgroundColor: alpha("#8A6440", 0.95),
              px: 0.65,
              py: 0.25,
              borderRadius: 0.75,
              lineHeight: 1,
              boxShadow: `0 1px 4px ${alpha("#000", 0.25)}`,
            }}
          >
            {t("playPassed")}
          </Typography>
        )}
        <Stack
          direction="row"
          alignItems="center"
          spacing={overlap < 0 ? 0 : `${gap}px`}
          role="img"
          aria-label={t("playTilesRemaining", { n: tiles })}
          sx={{
            minHeight: backH,
            maxWidth: compact ? 168 : 220,
            overflowX: tiles > (compact ? 10 : 8) ? "auto" : "visible",
            overscrollBehavior: "contain",
          }}
        >
          {tileList}
        </Stack>
        <Typography
          sx={{
            fontSize: compact ? 9 : 11,
            fontWeight: 800,
            color: alpha("#241D14", 0.55),
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {tiles}
        </Typography>
      </Stack>
      <Box
        sx={{
          ...lipSx,
          mt: flipForTop ? 0 : compact ? 0.25 : 0.4,
          mb: flipForTop ? (compact ? 0.25 : 0.4) : 0,
          background: flipForTop
            ? "linear-gradient(0deg, #A67B52 0%, #6B4A2D 60%, #4A3320 100%)"
            : "linear-gradient(180deg, #A67B52 0%, #6B4A2D 60%, #4A3320 100%)",
          boxShadow: `inset 0 1px 0 ${alpha("#FBF5E9", 0.18)}`,
          borderRadius: flipForTop
            ? `${compact ? 3 : 5}px ${compact ? 3 : 5}px 0 0`
            : `0 0 ${compact ? 3 : 5}px ${compact ? 3 : 5}px`,
        }}
      />
    </Box>
  );
}
