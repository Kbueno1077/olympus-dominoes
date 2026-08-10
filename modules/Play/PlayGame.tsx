"use client";

import { chooseBotMove } from "@/lib/play/bot";
import {
  accountFinishedHand,
  createMatch,
  dealNextHand,
  drawOrPass,
  legalMovesForSeat,
  playMove,
  seatPositions,
  teamLabels,
} from "@/lib/play/engine";
import type {
  ChainSide,
  DominoSetId,
  GameSnapshot,
  MatchSnapshot,
  PlayModeId,
} from "@/lib/play/types";
import PlayChain from "@/modules/Play/PlayChain";
import PlayHand from "@/modules/Play/PlayHand";
import PlayNotesDrawer from "@/modules/Play/PlayNotesDrawer";
import PlaySeat from "@/modules/Play/PlaySeat";
import PlaySetup from "@/modules/Play/PlaySetup";
import PlayTileFlight, {
  type TileFlight,
} from "@/modules/Play/PlayTileFlight";
import { useTranslation } from "@/i18n/useTranslation";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SeatPos = "top" | "left" | "right" | "bottom";

type PendingFlight = {
  tileId: string;
  a: number;
  b: number;
  from: { x: number; y: number };
};

/** Push a game update; credit the scorepad as soon as a hand finishes. */
function withGame(match: MatchSnapshot, nextGame: GameSnapshot): MatchSnapshot {
  const next = { ...match, current: nextGame };
  if (nextGame.phase === "finished") return accountFinishedHand(next);
  return next;
}

export default function PlayGame() {
  const { t } = useTranslation();
  const theme = useTheme();
  const mobileEdge = theme.breakpoints.values.sm;
  const narrowWidth = useMediaQuery(theme.breakpoints.down("sm"));
  const shortHeight = useMediaQuery(`(max-height:${mobileEdge}px)`);
  const landscapePhone = useMediaQuery(
    `(max-height: 500px) and (min-width: ${mobileEdge}px)`
  );
  const compact = narrowWidth || shortHeight || landscapePhone;
  const tileScale =
    landscapePhone
      ? "landscape"
      : narrowWidth || shortHeight
        ? "portrait"
        : "default";
  const [modeId, setModeId] = useState<PlayModeId>("2v2");
  const [setId, setSetId] = useState<DominoSetId>("double_six");
  const [maxPoints, setMaxPoints] = useState(150);
  const [match, setMatch] = useState<MatchSnapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [botDelayMs, setBotDelayMs] = useState(900);
  const [animMs, setAnimMs] = useState(480);
  const [pendingFlight, setPendingFlight] = useState<PendingFlight | null>(
    null
  );
  const [flight, setFlight] = useState<TileFlight | null>(null);
  const matchRef = useRef(match);
  matchRef.current = match;
  const seatAnchorRefs = useRef<Partial<Record<SeatPos, HTMLElement | null>>>(
    {}
  );

  const setSeatAnchor = useCallback((pos: SeatPos, el: HTMLElement | null) => {
    seatAnchorRefs.current[pos] = el;
  }, []);

  const game = match?.current ?? null;

  const start = useCallback(() => {
    setSelectedId(null);
    setBusy(false);
    setPendingFlight(null);
    setFlight(null);
    setMatch(createMatch(modeId, setId, maxPoints));
    setLogOpen(false);
    setNotesOpen(false);
  }, [modeId, setId, maxPoints]);

  const humanTurn =
    !!game &&
    game.phase === "playing" &&
    game.seats[game.turn]?.kind === "human" &&
    !busy &&
    !pendingFlight &&
    !flight;

  const legal = useMemo(() => {
    if (!game || !humanTurn) return [];
    return legalMovesForSeat(game, game.turn);
  }, [game, humanTurn]);

  const selectedMoves = useMemo(
    () => legal.filter((m) => m.tileId === selectedId),
    [legal, selectedId]
  );

  const highlightSide: ChainSide | null =
    selectedMoves.length === 1 ? selectedMoves[0].side : null;

  const finishFlight = useCallback(() => {
    setFlight(null);
    setPendingFlight(null);
    setBusy(false);
  }, []);

  // Resolve board destination after the played tile is laid (hidden).
  useLayoutEffect(() => {
    if (!pendingFlight || flight) return;
    let attempts = 0;
    let raf = 0;
    const resolve = () => {
      const el = document.querySelector(
        `[data-chain-tile="${pendingFlight.tileId}"]`
      ) as HTMLElement | null;
      if (!el) {
        attempts += 1;
        if (attempts < 12) {
          raf = window.requestAnimationFrame(resolve);
          return;
        }
        finishFlight();
        return;
      }
      const rect = el.getBoundingClientRect();
      const orientation: "horizontal" | "vertical" =
        rect.width >= rect.height ? "horizontal" : "vertical";
      const face = Math.max(
        18,
        Math.round(orientation === "horizontal" ? rect.height : rect.width)
      );
      const faceA = Number(el.dataset.faceA);
      const faceB = Number(el.dataset.faceB);
      setFlight({
        tileId: pendingFlight.tileId,
        a: Number.isFinite(faceA) ? faceA : pendingFlight.a,
        b: Number.isFinite(faceB) ? faceB : pendingFlight.b,
        from: pendingFlight.from,
        to: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
        face,
        orientation,
      });
    };
    raf = window.requestAnimationFrame(resolve);
    return () => window.cancelAnimationFrame(raf);
  }, [pendingFlight, flight, finishFlight]);

  useEffect(() => {
    if (!match || !game || game.phase !== "playing") return;
    if (pendingFlight || flight) return;
    const seat = game.seats[game.turn];
    if (!seat || seat.kind !== "bot") return;

    let cancelled = false;
    setBusy(true);
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const current = matchRef.current;
      if (!current?.current || current.current.phase !== "playing") {
        setBusy(false);
        return;
      }
      const g = current.current;
      const botSeat = g.seats[g.turn];
      if (!botSeat || botSeat.kind !== "bot") {
        setBusy(false);
        return;
      }

      const decision = chooseBotMove(g, g.turn);
      if (decision.type === "drawOrPass") {
        setMatch(withGame(current, drawOrPass(g, g.turn)));
        setBusy(false);
        return;
      }

      const tile = botSeat.hand.find((t) => t.id === decision.move.tileId);
      const positions = seatPositions(g.modeId);
      const pos = positions[g.turn] as SeatPos | undefined;
      const fromEl = pos ? seatAnchorRefs.current[pos] : null;
      const fromRect = fromEl?.getBoundingClientRect();
      const from = fromRect
        ? {
            x: fromRect.left + fromRect.width / 2,
            y: fromRect.top + fromRect.height / 2,
          }
        : {
            x: window.innerWidth / 2,
            y: Math.max(48, window.innerHeight * 0.12),
          };

      const nextGame = playMove(g, g.turn, decision.move, decision.reason);
      setMatch(withGame(current, nextGame));
      if (tile) {
        setPendingFlight({
          tileId: tile.id,
          a: tile.a,
          b: tile.b,
          from,
        });
      } else {
        setBusy(false);
      }
    }, botDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [match, game, botDelayMs, pendingFlight, flight]);

  const commitMove = useCallback(
    (side: ChainSide, tileId: string) => {
      if (!match?.current || !humanTurn) return;
      const g = match.current;
      const moves = legalMovesForSeat(g, g.turn);
      const move = moves.find((m) => m.tileId === tileId && m.side === side);
      if (!move) return;
      const tile = g.seats[g.turn]?.hand.find((item) => item.id === tileId);
      const fromEl = document.querySelector(
        `[data-hand-tile="${tileId}"]`
      ) as HTMLElement | null;
      const fromRect = fromEl?.getBoundingClientRect();
      const from = fromRect
        ? {
            x: fromRect.left + fromRect.width / 2,
            y: fromRect.top + fromRect.height / 2,
          }
        : {
            x: window.innerWidth / 2,
            y: Math.max(120, window.innerHeight * 0.82),
          };

      setSelectedId(null);
      setBusy(true);
      setMatch(withGame(match, playMove(g, g.turn, move)));
      if (tile) {
        setPendingFlight({
          tileId: tile.id,
          a: tile.a,
          b: tile.b,
          from,
        });
      } else {
        setBusy(false);
      }
    },
    [match, humanTurn]
  );

  const handleDropSide = (side: ChainSide, tileId: string) => {
    if (!humanTurn || !game) return;
    const moves = legalMovesForSeat(game, game.turn).filter(
      (m) => m.tileId === tileId && m.side === side
    );
    if (moves.length === 1) commitMove(side, tileId);
  };

  const handleSelectTile = (tileId: string) => {
    if (!humanTurn) return;
    const moves = legal.filter((m) => m.tileId === tileId);
    if (moves.length === 0) return;

    if (selectedId === tileId && moves.length === 1) {
      commitMove(moves[0].side, tileId);
      return;
    }

    setSelectedId(tileId);
    if (moves.length === 1 && game && game.chain.length === 0) {
      commitMove(moves[0].side, tileId);
    }
  };

  const handlePassOrDraw = () => {
    if (!match?.current || !humanTurn) return;
    if (legal.length > 0) return;
    setMatch(withGame(match, drawOrPass(match.current, match.current.turn)));
  };

  const continueAfterHand = () => {
    if (!match) return;
    setSelectedId(null);
    setMatch(dealNextHand(match));
  };

  if (!match || !game) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
          py: { xs: 2, md: 4 },
          px: { xs: 1.5, sm: 2 },
          pb: { xs: 4, md: 6 },
        }}
      >
        <PlaySetup
          modeId={modeId}
          setId={setId}
          maxPoints={maxPoints}
          onMode={setModeId}
          onSet={setSetId}
          onMaxPoints={setMaxPoints}
          onStart={start}
        />
      </Box>
    );
  }

  const positions = seatPositions(game.modeId);
  const seatByPosition = Object.fromEntries(
    game.seats.map((seat, i) => [positions[i], seat])
  ) as Record<string, (typeof game.seats)[0]>;

  const labels = teamLabels(game.modeId);

  // Games won per side (points live on the scorepad).
  const gamesGlance = Object.keys(labels)
    .map(Number)
    .sort((a, b) => a - b)
    .map(
      (team) => match.hands.filter((hand) => hand.winnerTeam === team).length
    )
    .join("–");

  const canPass = humanTurn && legal.length === 0;
  const showSideButtons = !!selectedId && selectedMoves.length >= 1;
  /** Same clearance from every stand lip to the wood table edge. */
  const seatTableGap = { xs: 0.5, sm: 1.25 };
  /** Phones: corner chips; sm+ keeps wooden stands. */
  const useChips = compact;

  const seatChip = (
    pos: SeatPos,
    seat: (typeof game.seats)[0]
  ) => (
    <PlaySeat
      seat={seat}
      isTurn={game.turn === seat.index && game.phase === "playing"}
      passed={game.lastPasserIndex === seat.index}
      position={pos}
      variant="chip"
      anchorRef={(el) => setSeatAnchor(pos, el)}
    />
  );

  return (
    <>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          px: { xs: 0.4, sm: 1, md: 1.5 },
          pt: { xs: 0.25, sm: 0.5 },
          pb: { xs: "max(4px, env(safe-area-inset-bottom))", sm: 0.75 },
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: useChips ? 0.4 : seatTableGap,
          }}
        >
          {!useChips && (
            <Box sx={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
              {seatByPosition.top && (
                <PlaySeat
                  seat={seatByPosition.top}
                  isTurn={
                    game.turn === seatByPosition.top.index &&
                    game.phase === "playing"
                  }
                  passed={game.lastPasserIndex === seatByPosition.top.index}
                  position="top"
                  anchorRef={(el) => setSeatAnchor("top", el)}
                />
              )}
            </Box>
          )}

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              alignItems: "stretch",
              gap: useChips ? 0 : seatTableGap,
            }}
          >
            {!useChips && seatByPosition.left && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  flexShrink: 0,
                  alignSelf: "center",
                  maxHeight: "100%",
                }}
              >
                <PlaySeat
                  seat={seatByPosition.left}
                  isTurn={
                    game.turn === seatByPosition.left.index &&
                    game.phase === "playing"
                  }
                  passed={game.lastPasserIndex === seatByPosition.left.index}
                  position="left"
                  anchorRef={(el) => setSeatAnchor("left", el)}
                />
              </Box>
            )}

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: { xs: 0.35, sm: 0.55 },
              }}
            >
              {/* Full-bleed wood table — uses all remaining width × height. */}
              <Box
                sx={{
                  flex: "1 1 0",
                  minHeight: { xs: landscapePhone ? 72 : 120, sm: 200 },
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: { xs: "10px", sm: "12px" },
                  p: { xs: landscapePhone ? "2px" : "4px", sm: "6px" },
                  background:
                    "linear-gradient(150deg, #8A6440 0%, #6B4A2D 45%, #4A3320 100%)",
                  boxShadow: (t) =>
                    `0 12px 32px -14px ${alpha(t.palette.common.black, 0.55)}`,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    flex: "1 1 0",
                    minHeight: { xs: landscapePhone ? 56 : 88, sm: 160 },
                    width: "100%",
                    borderRadius: { xs: "6px", sm: "8px" },
                    overflow: "hidden",
                    background:
                      "radial-gradient(ellipse at 50% 42%, #2C8069 0%, #1F6B58 42%, #144B3D 100%)",
                    boxShadow: `inset 0 2px 10px ${alpha("#000", 0.4)}`,
                  }}
                >
                  <Box sx={{ position: "absolute", inset: { xs: 3, sm: 4 } }}>
                    <PlayChain
                      chain={game.chain}
                      openingTileId={game.openingTileId}
                      highlightSide={highlightSide}
                      dropEnabled={humanTurn}
                      onDropSide={handleDropSide}
                      flyingTileId={
                        pendingFlight?.tileId ?? flight?.tileId ?? null
                      }
                      tileScale={tileScale}
                    />
                  </Box>

                  {useChips && (
                    <>
                      {seatByPosition.top && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 2,
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 3,
                            pointerEvents: "none",
                          }}
                        >
                          {seatChip("top", seatByPosition.top)}
                        </Box>
                      )}
                      {seatByPosition.left && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: 2,
                            top: 0,
                            bottom: 0,
                            width: 26,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 3,
                            pointerEvents: "none",
                          }}
                        >
                          <Box
                            sx={{
                              transform: "rotate(90deg)",
                              flexShrink: 0,
                            }}
                          >
                            {seatChip("left", seatByPosition.left)}
                          </Box>
                        </Box>
                      )}
                      {seatByPosition.right && (
                        <Box
                          sx={{
                            position: "absolute",
                            right: 2,
                            top: 0,
                            bottom: 0,
                            width: 26,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 3,
                            pointerEvents: "none",
                          }}
                        >
                          <Box
                            sx={{
                              transform: "rotate(-90deg)",
                              flexShrink: 0,
                            }}
                          >
                            {seatChip("right", seatByPosition.right)}
                          </Box>
                        </Box>
                      )}
                      {seatByPosition.bottom &&
                        seatByPosition.bottom.kind !== "human" && (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 2,
                              left: "50%",
                              transform: "translateX(-50%)",
                              zIndex: 3,
                              pointerEvents: "none",
                            }}
                          >
                            {seatChip("bottom", seatByPosition.bottom)}
                          </Box>
                        )}
                    </>
                  )}

                  <AnimatePresence>
                    {(game.phase === "finished" || match.matchOver) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "grid",
                          placeItems: "center",
                          background: alpha("#0B2E24", 0.55),
                          backdropFilter: "blur(3px)",
                          zIndex: 5,
                        }}
                      >
                        <Box
                          sx={{
                            px: 2.5,
                            py: 2,
                            borderRadius: 2,
                            backgroundColor: alpha("#FDF8EE", 0.96),
                            textAlign: "center",
                            maxWidth: 300,
                            mx: 1.5,
                          }}
                        >
                          {match.matchOver ? (
                            <>
                              <Typography
                                sx={{
                                  fontFamily: (theme) =>
                                    theme.typography.h2.fontFamily,
                                  fontWeight: 700,
                                  fontSize: 20,
                                  color: "primary.dark",
                                }}
                              >
                                {t("playMatchOver")}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.5 }}
                              >
                                {t("playReached", {
                                  team: match.matchWinnerTeams
                                    .map((team) => t(labels[team]))
                                    .join(" & "),
                                  points: match.maxPoints,
                                })}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="center"
                                sx={{ mt: 1.5 }}
                              >
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => setNotesOpen(true)}
                                >
                                  {t("playScorepad")}
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={start}
                                >
                                  {t("playNewMatch")}
                                </Button>
                              </Stack>
                            </>
                          ) : game.result ? (
                            <>
                              <Typography
                                sx={{
                                  fontFamily: (theme) =>
                                    theme.typography.h2.fontFamily,
                                  fontWeight: 700,
                                  fontSize: 20,
                                  color: "primary.dark",
                                }}
                              >
                                {t("playHandDone", { n: game.handIndex })}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.5 }}
                              >
                                {game.result.reason === "blocked"
                                  ? t("playHandAwardBlocked", {
                                      team: t(labels[game.result.winnerTeam]),
                                      points: game.result.pointsAwarded,
                                    })
                                  : t("playHandAward", {
                                      team: t(labels[game.result.winnerTeam]),
                                      points: game.result.pointsAwarded,
                                    })}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="center"
                                sx={{ mt: 1.5 }}
                              >
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => setNotesOpen(true)}
                                >
                                  {t("playScorepad")}
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={continueAfterHand}
                                >
                                  {t("playNextHand")}
                                </Button>
                              </Stack>
                            </>
                          ) : null}
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  sx={{
                    flexShrink: 0,
                    mt: { xs: landscapePhone ? "2px" : "3px", sm: "6px" },
                    px: { xs: 0.4, sm: 0.75 },
                    py: { xs: landscapePhone ? 0.15 : 0.3, sm: 0.55 },
                    borderRadius: { xs: "6px", sm: "8px" },
                    background: alpha("#1A120C", 0.28),
                    boxShadow: `inset 0 1px 3px ${alpha("#000", 0.25)}`,
                    minWidth: 0,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: 10, sm: 13 },
                        color: alpha("#FBF5E9", 0.95),
                        lineHeight: 1.15,
                        fontFamily: (theme) => theme.typography.h2.fontFamily,
                      }}
                      noWrap
                    >
                      {t("playGameN", { n: game.handIndex })}
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 600,
                          opacity: 0.75,
                          mx: 0.5,
                          fontFamily: "inherit",
                        }}
                      >
                        ·
                      </Box>
                      {gamesGlance}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={0.4} alignItems="center">
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      disabled={
                        !showSideButtons ||
                        !selectedMoves.some((m) => m.side === "left")
                      }
                      onClick={() =>
                        selectedId && commitMove("left", selectedId)
                      }
                      sx={{
                        minWidth: { xs: 30, sm: 36 },
                        px: { xs: 0.55, sm: 0.75 },
                        py: { xs: 0.25, sm: 0.35 },
                        fontSize: { xs: 11, sm: 12 },
                        fontWeight: 800,
                      }}
                    >
                      L
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      disabled={
                        !showSideButtons ||
                        !selectedMoves.some((m) => m.side === "right")
                      }
                      onClick={() =>
                        selectedId && commitMove("right", selectedId)
                      }
                      sx={{
                        minWidth: { xs: 30, sm: 36 },
                        px: { xs: 0.55, sm: 0.75 },
                        py: { xs: 0.25, sm: 0.35 },
                        fontSize: { xs: 11, sm: 12 },
                        fontWeight: 800,
                      }}
                    >
                      R
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!canPass}
                      onClick={handlePassOrDraw}
                      sx={{
                        minWidth: { xs: 44, sm: 52 },
                        px: { xs: 0.55, sm: 0.75 },
                        py: { xs: 0.25, sm: 0.35 },
                        fontSize: { xs: 10, sm: 11 },
                        fontWeight: 700,
                        color: alpha("#FBF5E9", canPass ? 0.95 : 0.4),
                        borderColor: alpha("#FBF5E9", canPass ? 0.45 : 0.2),
                        "&:hover": {
                          borderColor: alpha("#FBF5E9", 0.7),
                          backgroundColor: alpha("#FBF5E9", 0.08),
                        },
                        "&.Mui-disabled": {
                          color: alpha("#FBF5E9", 0.35),
                          borderColor: alpha("#FBF5E9", 0.15),
                        },
                      }}
                    >
                      {game.allowDraw && game.boneyard.length > 0
                        ? t("playDraw")
                        : t("playPass")}
                    </Button>
                    <Chip
                      size="small"
                      icon={<MenuBookOutlined sx={{ fontSize: 14 }} />}
                      label={gamesGlance}
                      onClick={() => setNotesOpen(true)}
                      clickable
                      sx={{
                        height: { xs: 24, sm: 28 },
                        fontWeight: 700,
                        fontSize: { xs: 11, sm: 12 },
                        backgroundColor: alpha("#FBF5E9", 0.92),
                        color: "primary.dark",
                        "& .MuiChip-icon": { color: "secondary.main" },
                        "&:hover": { backgroundColor: "#FBF5E9" },
                      }}
                    />
                  </Stack>
                </Stack>
              </Box>
            </Box>

            {!useChips && seatByPosition.right && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  flexShrink: 0,
                  alignSelf: "center",
                  maxHeight: "100%",
                }}
              >
                <PlaySeat
                  seat={seatByPosition.right}
                  isTurn={
                    game.turn === seatByPosition.right.index &&
                    game.phase === "playing"
                  }
                  passed={game.lastPasserIndex === seatByPosition.right.index}
                  position="right"
                  anchorRef={(el) => setSeatAnchor("right", el)}
                />
              </Box>
            )}
          </Box>

          {game.phase === "playing" && (
            <Box sx={{ flexShrink: 0, width: "100%" }}>
              <PlayHand
                hand={game.seats[0].hand}
                legal={legal}
                selectedId={selectedId}
                disabled={!humanTurn}
                onSelect={handleSelectTile}
                compact={compact}
              />
            </Box>
          )}

          {!useChips &&
            seatByPosition.bottom &&
            seatByPosition.bottom.kind !== "human" && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <PlaySeat
                  seat={seatByPosition.bottom}
                  isTurn={
                    game.turn === seatByPosition.bottom.index &&
                    game.phase === "playing"
                  }
                  passed={game.lastPasserIndex === seatByPosition.bottom.index}
                  position="bottom"
                  anchorRef={(el) => setSeatAnchor("bottom", el)}
                />
              </Box>
            )}
        </Box>
      </Box>

      {flight && (
        <PlayTileFlight
          flight={flight}
          durationMs={animMs}
          onComplete={finishFlight}
        />
      )}

      <PlayNotesDrawer
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        match={match}
        game={game}
        botDelayMs={botDelayMs}
        onBotDelay={setBotDelayMs}
        animMs={animMs}
        onAnimMs={setAnimMs}
        logOpen={logOpen}
        onToggleLog={() => setLogOpen((v) => !v)}
        onNewMatch={() => {
          setNotesOpen(false);
          start();
        }}
        onSetup={() => {
          setNotesOpen(false);
          setMatch(null);
          setSelectedId(null);
        }}
      />
    </>
  );
}
