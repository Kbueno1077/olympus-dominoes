"use client";

import DominoTile from "@/components/DominoTile";
import { useTranslation } from "@/i18n/useTranslation";
import { gameModeRecoil, playersAmountRecoil } from "@/recoil/recoilState";
import { Box, Card, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useRecoilValue } from "recoil";

// A Cuban set is double-nine: 55 tiles. Every tile drawn on this table is
// accounted for, so the picture always adds back up to the real set.
const TILES_IN_SET = 55;
const TILES_PER_HAND = 10;
const TILES_PLAYED = 3;

/**
 * Tiles still held by each seat. Everyone is dealt ten; the three tiles laid
 * in the centre come off the first three hands, so a four handed game shows
 * 10 / 9 / 9 / 9 and the arithmetic still closes on 55.
 */
function buildHandCounts(playersAmount) {
  const counts = Array.from({ length: playersAmount }, () => TILES_PER_HAND);

  for (let i = 0; i < TILES_PLAYED; i += 1) {
    counts[i % playersAmount] -= 1;
  }

  return counts;
}

const poolCount = (playersAmount) =>
  TILES_IN_SET - TILES_PER_HAND * playersAmount;

/**
 * Seats around the table. Partners sit opposite each other, which is how a
 * real 2 vs 2 game is arranged, so the drawing doubles as seating advice.
 */
function buildSeats(playersAmount, isFreeForAll) {
  if (playersAmount === 2) {
    return [
      { position: "bottom", team: "team1", number: 1 },
      { position: "top", team: "team2", number: 2 },
    ];
  }

  const seats = [
    { position: "bottom", team: "team1", number: 1 },
    { position: "right", team: "team2", number: 2 },
    {
      position: "top",
      team: isFreeForAll ? "team3" : "team1",
      number: isFreeForAll ? 3 : 1,
    },
  ];

  if (playersAmount > 3) {
    seats.push({
      position: "left",
      team: isFreeForAll ? "team4" : "team2",
      number: isFreeForAll ? 4 : 2,
    });
  }

  return seats;
}

const SEAT_ANCHORS = {
  bottom: {
    bottom: 10,
    left: "50%",
    transform: "translateX(-50%)",
    flexDirection: "column-reverse",
  },
  top: {
    top: 10,
    left: "50%",
    transform: "translateX(-50%)",
    flexDirection: "column",
  },
  left: {
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    flexDirection: "row",
  },
  right: {
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    flexDirection: "row-reverse",
  },
};

// Seeded so the scatter is identical on the server and in the browser; a live
// Math.random() here would cause a hydration mismatch.
function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The pool sits in the four corners, clear of the seats at the edge midpoints.
const POOL_CORNERS = [
  { x: [6, 26], y: [6, 26] },
  { x: [74, 94], y: [6, 26] },
  { x: [6, 26], y: [74, 94] },
  { x: [74, 94], y: [74, 94] },
];

const POOL_SPOTS = (() => {
  const rng = mulberry32(55);
  // 35 is the largest pool possible (a two handed game).
  return Array.from({ length: 36 }, (_, index) => {
    const corner = POOL_CORNERS[index % POOL_CORNERS.length];
    return {
      left: corner.x[0] + rng() * (corner.x[1] - corner.x[0]),
      top: corner.y[0] + rng() * (corner.y[1] - corner.y[0]),
      rotate: -55 + rng() * 110,
    };
  });
})();

/** Face down leftovers. In Cuba these are the tiles nobody drew. */
function Pool({ count }) {
  return (
    <>
      {POOL_SPOTS.slice(0, count).map((spot, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            top: `${spot.top}%`,
            left: `${spot.left}%`,
            width: 8,
            height: 16,
            borderRadius: "2px",
            background: "linear-gradient(160deg, #FBF5E9 0%, #DDCDAF 100%)",
            border: `1px solid ${alpha("#241D14", 0.28)}`,
            boxShadow: `0 1px 2px ${alpha("#000000", 0.35)}`,
            transform: `translate(-50%, -50%) rotate(${spot.rotate}deg)`,
          }}
        />
      ))}
    </>
  );
}

/**
 * A name plaque resting on the table. Bone rather than the team colour, so it
 * stays legible against the baize; the colour is carried by the dot.
 */
function SeatPlaque({ label, teamColor }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{
        px: 1,
        py: 0.4,
        borderRadius: "8px",
        backgroundColor: "#FBF5E9",
        border: `1px solid ${alpha("#241D14", 0.2)}`,
        boxShadow: `0 2px 5px -1px ${alpha("#000000", 0.4)}`,
        whiteSpace: "nowrap",
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          flexShrink: 0,
          backgroundColor: (t) => t.palette[teamColor].main,
        }}
      />
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
          color: (t) => t.palette[teamColor].dark,
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

/** A stood up hand of tiles, seen edge on from across the table. */
function Rack({ vertical, teamColor, count }) {
  return (
    <Stack
      direction={vertical ? "column" : "row"}
      spacing="2px"
      sx={{
        p: "3px",
        borderRadius: "5px",
        backgroundColor: (t) => alpha(t.palette[teamColor].dark, 0.55),
        boxShadow: (t) => `0 1px 3px ${alpha(t.palette.common.black, 0.3)}`,
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            width: vertical ? 14 : 5,
            height: vertical ? 5 : 14,
            borderRadius: "1.5px",
            background: "linear-gradient(180deg, #FDF8EE 0%, #E4D7BE 100%)",
          }}
        />
      ))}
    </Stack>
  );
}

export default function TableDraw() {
  const { t, teamName } = useTranslation();
  const gameMode = useRecoilValue(gameModeRecoil);
  const playersAmount = useRecoilValue(playersAmountRecoil);

  const isFreeForAll = gameMode?.label === "Free For All";
  const seats = buildSeats(playersAmount, isFreeForAll);
  const handCounts = buildHandCounts(playersAmount);
  const pool = poolCount(playersAmount);

  return (
    <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h6" sx={{ color: "text.primary" }}>
          {t("tableTitle")}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t("tableSubtitle")}
        </Typography>
      </Stack>

      {/* Wooden rail around the baize */}
      <Box
        sx={{
          maxWidth: 380,
          mx: "auto",
          p: "10px",
          borderRadius: "18px",
          background:
            "linear-gradient(150deg, #8A6440 0%, #6B4A2D 45%, #4A3320 100%)",
          boxShadow: (t) =>
            `0 6px 18px -8px ${alpha(t.palette.common.black, 0.5)}`,
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            borderRadius: "10px",
            overflow: "hidden",
            // Green baize, lit from the middle the way a hanging lamp would.
            background:
              "radial-gradient(circle at 50% 45%, #2C8069 0%, #1F6B58 45%, #144B3D 100%)",
            boxShadow: `inset 0 2px 10px ${alpha("#000000", 0.35)}`,
            "&::after": {
              content: '""',
              display: "block",
              paddingBottom: "100%",
            },
          }}
        >
          <Pool count={pool} />

          {/* The three tiles already laid, forming the line of the game */}
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <DominoTile top={3} bottom={6} size={12} orientation="horizontal" />
            <DominoTile top={6} bottom={6} size={12} />
            <DominoTile top={6} bottom={1} size={12} orientation="horizontal" />
          </Stack>

          {seats.map((seat, index) => {
            const isVerticalRack =
              seat.position === "left" || seat.position === "right";

            return (
              <Box
                key={seat.position}
                sx={{
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  ...SEAT_ANCHORS[seat.position],
                }}
              >
                <SeatPlaque
                  label={teamName(seat.number)}
                  teamColor={seat.team}
                />
                <Rack
                  vertical={isVerticalRack}
                  teamColor={seat.team}
                  count={handCounts[index]}
                />
              </Box>
            );
          })}
        </Box>
      </Box>

      <Typography
        variant="caption"
        component="p"
        sx={{ mt: 1.5, textAlign: "center", color: "text.secondary" }}
      >
        {t("tableCaption", {
          total: TILES_IN_SET,
          perHand: TILES_PER_HAND,
        })}
      </Typography>
    </Card>
  );
}
