"use client";

import { chooseBotMove } from "@/lib/play/bot";
import {
  readBotBrain,
  writeBotBrain,
  type BotBrainId,
} from "@/lib/play/botBrain";
import {
  accountFinishedHand,
  chooseHandOpener,
  createMatch,
  dealNextHand,
  drawOrPass,
  legalMovesForSeat,
  openEnds,
  playMove,
  seatPositions,
  startNextGame,
  teamLabels,
} from "@/lib/play/engine";
import type {
  ChainSide,
  DominoSetId,
  GameSnapshot,
  LegalMove,
  MatchSnapshot,
  PlayModeId,
} from "@/lib/play/types";
import PlayChain from "@/modules/Play/PlayChain";
import PlayHand from "@/modules/Play/PlayHand";
import PlayLeftoverCorner from "@/modules/Play/PlayLeftoverCorner";
import PlayConfigDrawer from "@/modules/Play/PlayConfigDrawer";
import PlayNotesDrawer from "@/modules/Play/PlayNotesDrawer";
import PlayOpenerDialog from "@/modules/Play/PlayOpenerDialog";
import PlaySeat from "@/modules/Play/PlaySeat";
import PlaySetup from "@/modules/Play/PlaySetup";
import PlayTileFlight, {
  type TileFlight,
} from "@/modules/Play/PlayTileFlight";
import { pressableSx, tapFeedback } from "@/modules/Play/pressFeedback";
import {
  animMsFromLevel,
  botMsFromLevel,
  PACE_LEVEL_NORMAL,
} from "@/modules/Play/paceLevels";
import { useTranslation } from "@/i18n/useTranslation";
import { organizeHand, setConfig } from "@/lib/play/tiles";
import AutoModeOutlined from "@mui/icons-material/AutoModeOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import SortOutlined from "@mui/icons-material/SortOutlined";
import SwapHorizOutlined from "@mui/icons-material/SwapHorizOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
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

const AUTO_PASS_KEY = "olympus-play-auto-pass";

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

/**
 * Side to play without asking: one legal placement, or both chain ends match
 * so L vs R is the same play.
 */
function autoPlaySide(
  moves: LegalMove[],
  ends: { left: number; right: number } | null
): ChainSide | null {
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0].side;
  if (ends && ends.left === ends.right) return moves[0].side;
  return null;
}

/** Below this width (px), Play uses the phone layout (chips, compact rack). */
const PLAY_MOBILE_MAX_PX = 768;

export default function PlayGame() {
  const { t } = useTranslation();
  const narrowWidth = useMediaQuery(`(max-width:${PLAY_MOBILE_MAX_PX - 1}px)`);
  const shortHeight = useMediaQuery(`(max-height:${PLAY_MOBILE_MAX_PX - 1}px)`);
  const landscapePhone = useMediaQuery(
    `(max-height: 500px) and (min-width: ${PLAY_MOBILE_MAX_PX}px)`
  );
  const compact = narrowWidth || shortHeight || landscapePhone;
  const tileScale =
    landscapePhone
      ? "landscape"
      : narrowWidth || shortHeight
        ? "portrait"
        : "default";
  const [modeId, setModeId] = useState<PlayModeId>("2v2");
  const [setId, setSetId] = useState<DominoSetId>("double_nine");
  const [maxPoints, setMaxPoints] = useState(150);
  const [match, setMatch] = useState<MatchSnapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [botDelayMs, setBotDelayMs] = useState(() =>
    botMsFromLevel(PACE_LEVEL_NORMAL)
  );
  const [botBrain, setBotBrain] = useState<BotBrainId>(() => readBotBrain());
  const [animMs, setAnimMs] = useState(() => animMsFromLevel(PACE_LEVEL_NORMAL));
  const botBrainRef = useRef(botBrain);
  botBrainRef.current = botBrain;
  const [autoPass, setAutoPass] = useState(() => {
    try {
      return sessionStorage.getItem(AUTO_PASS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [rearrangeMode, setRearrangeMode] = useState(false);
  const [pendingFlight, setPendingFlight] = useState<PendingFlight | null>(
    null
  );
  const [flight, setFlight] = useState<TileFlight | null>(null);
  const [passFlash, setPassFlash] = useState<{
    seatIndex: number;
    nameKey: string;
    token: number;
  } | null>(null);
  const passFlashTimerRef = useRef<number | null>(null);
  const passFlashTokenRef = useRef(0);
  /** Last pass signal we already surfaced — avoids re-arming on unrelated renders. */
  const passFlashSignalRef = useRef<string | null>(null);
  const matchRef = useRef(match);
  matchRef.current = match;
  const seatAnchorRefs = useRef<Partial<Record<SeatPos, HTMLElement | null>>>(
    {}
  );

  const setSeatAnchor = useCallback((pos: SeatPos, el: HTMLElement | null) => {
    seatAnchorRefs.current[pos] = el;
  }, []);

  const game = match?.current ?? null;

  const clearPassFlashTimer = useCallback(() => {
    if (passFlashTimerRef.current != null) {
      window.clearTimeout(passFlashTimerRef.current);
      passFlashTimerRef.current = null;
    }
  }, []);

  const dismissPassFlash = useCallback(() => {
    clearPassFlashTimer();
    passFlashSignalRef.current = null;
    setPassFlash(null);
  }, [clearPassFlashTimer]);

  const showPassFlash = useCallback(
    (seatIndex: number, nameKey: string) => {
      const token = passFlashTokenRef.current + 1;
      passFlashTokenRef.current = token;
      setPassFlash({ seatIndex, nameKey, token });
      clearPassFlashTimer();
      passFlashTimerRef.current = window.setTimeout(() => {
        setPassFlash((cur) => (cur?.token === token ? null : cur));
        passFlashTimerRef.current = null;
      }, 2000);
    },
    [clearPassFlashTimer]
  );

  const start = useCallback(() => {
    setSelectedId(null);
    setBusy(false);
    setPendingFlight(null);
    setFlight(null);
    setMatch(createMatch(modeId, setId, maxPoints));
    setLogOpen(false);
    setNotesOpen(false);
    setRearrangeMode(false);
    dismissPassFlash();
  }, [modeId, setId, maxPoints, dismissPassFlash]);

  const handleMaxPoints = useCallback((n: number) => {
    setMaxPoints(Math.max(1, Math.round(n)));
  }, []);

  const handleBotBrain = useCallback((id: BotBrainId) => {
    setBotBrain(id);
    writeBotBrain(id);
  }, []);

  const humanTurn =
    !!game &&
    game.phase === "playing" &&
    !game.awaitingOpenerChoice &&
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

  // Pass callout: one live notice. Replace on each new pass, clear on play /
  // hand end / game end, otherwise auto-dismiss after 2s.
  useEffect(() => {
    if (!match || !game || game.phase !== "playing" || match.gameOver) {
      dismissPassFlash();
      return;
    }

    // A play (or new hand) cleared the passer — drop any leftover banner.
    if (game.lastPasserIndex == null) {
      dismissPassFlash();
      return;
    }

    const signal = `${match.gameIndex}:${game.handIndex}:${game.lastPasserIndex}:${game.passesInRow}`;
    if (passFlashSignalRef.current === signal) return;
    passFlashSignalRef.current = signal;

    const seat = game.seats[game.lastPasserIndex];
    if (!seat) return;
    showPassFlash(game.lastPasserIndex, seat.name);
  }, [
    match?.gameIndex,
    match?.gameOver,
    game?.lastPasserIndex,
    game?.passesInRow,
    game?.handIndex,
    game?.phase,
    showPassFlash,
    dismissPassFlash,
  ]);

  useEffect(() => {
    return () => {
      clearPassFlashTimer();
    };
  }, [clearPassFlashTimer]);

  useEffect(() => {
    if (!match || !game || game.phase !== "playing") return;
    if (game.awaitingOpenerChoice) return;
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

      const decision = chooseBotMove(g, g.turn, botBrainRef.current);
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
      if (!match?.current || !humanTurn || rearrangeMode) return;
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
    [match, humanTurn, rearrangeMode]
  );

  const handleDropSide = (side: ChainSide, tileId: string) => {
    if (!humanTurn || rearrangeMode || !game) return;
    const moves = legalMovesForSeat(game, game.turn).filter(
      (m) => m.tileId === tileId && m.side === side
    );
    if (moves.length === 1) commitMove(side, tileId);
  };

  /** Single tap: select only. Double tap: play if side is unambiguous. */
  const lastSelectRef = useRef<{ id: string; at: number } | null>(null);
  const handleSelectTile = (tileId: string) => {
    if (!humanTurn || rearrangeMode || !game) return;
    const moves = legal.filter((m) => m.tileId === tileId);
    if (moves.length === 0) return;

    const now = Date.now();
    const prev = lastSelectRef.current;
    const doubleTap =
      prev?.id === tileId && now - prev.at < 420;
    lastSelectRef.current = { id: tileId, at: now };

    setSelectedId(tileId);
    if (!doubleTap) return;

    const ends = openEnds(game.chain);
    const side = autoPlaySide(moves, ends);
    if (side) commitMove(side, tileId);
  };

  /** Hold-drag arm: select only — drop / L·R chooses the side. */
  const handleArmTile = (tileId: string) => {
    if (!humanTurn || rearrangeMode || !game) return;
    const moves = legal.filter((m) => m.tileId === tileId);
    if (moves.length === 0) return;
    setSelectedId(tileId);
  };

  const handlePassOrDraw = useCallback(() => {
    if (rearrangeMode) return;
    setMatch((current) => {
      if (!current?.current) return current;
      const g = current.current;
      if (g.phase !== "playing" || g.awaitingOpenerChoice) return current;
      const seat = g.seats[g.turn];
      if (!seat || seat.kind !== "human") return current;
      if (legalMovesForSeat(g, g.turn).length > 0) return current;
      return withGame(current, drawOrPass(g, g.turn));
    });
  }, [rearrangeMode]);

  const toggleAutoPass = () => {
    setAutoPass((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(AUTO_PASS_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const toggleRearrangeMode = () => {
    setRearrangeMode((prev) => {
      const next = !prev;
      if (next) setSelectedId(null);
      return next;
    });
  };

  const handleReorderHand = (fromIndex: number, toIndex: number) => {
    setMatch((current) => {
      if (!current?.current) return current;
      const g = current.current;
      const seat = g.seats[0];
      if (fromIndex < 0 || fromIndex >= seat.hand.length) return current;
      const hand = [...seat.hand];
      const [tile] = hand.splice(fromIndex, 1);
      const clampedTo = Math.max(0, Math.min(toIndex, hand.length));
      hand.splice(clampedTo, 0, tile);
      if (seat.hand.every((t, i) => t.id === hand[i]?.id)) return current;
      const seats = g.seats.map((s) =>
        s.index === 0 ? { ...s, hand } : s
      );
      return withGame(current, { ...g, seats });
    });
  };

  const handleOrganizeHand = () => {
    setMatch((current) => {
      if (!current?.current) return current;
      const g = current.current;
      const seat = g.seats[0];
      if (seat.hand.length < 2) return current;
      const hand = organizeHand(seat.hand);
      if (
        seat.hand.every(
          (t, i) =>
            t.id === hand[i]?.id && !!t.rackFlip === !!hand[i]?.rackFlip
        )
      ) {
        return current;
      }
      const seats = g.seats.map((s) =>
        s.index === 0 ? { ...s, hand } : s
      );
      return withGame(current, { ...g, seats });
    });
    setSelectedId(null);
  };

  const handleFlipHandTile = (tileId: string) => {
    setMatch((current) => {
      if (!current?.current) return current;
      const g = current.current;
      const seat = g.seats[0];
      const tile = seat.hand.find((t) => t.id === tileId);
      if (!tile || tile.a === tile.b) return current;
      const hand = seat.hand.map((t) =>
        t.id === tileId ? { ...t, rackFlip: !t.rackFlip } : t
      );
      const seats = g.seats.map((s) =>
        s.index === 0 ? { ...s, hand } : s
      );
      return withGame(current, { ...g, seats });
    });
  };

  const handleChooseOpener = (seatIndex: number) => {
    setMatch((current) => {
      if (!current?.current) return current;
      return withGame(current, chooseHandOpener(current.current, seatIndex));
    });
  };

  // Auto-pass/draw when you have nothing playable — no waiting on Pass.
  useEffect(() => {
    if (!autoPass || rearrangeMode || !match || !game) return;
    if (game.phase !== "playing" || game.awaitingOpenerChoice) return;
    if (pendingFlight || flight || busy) return;
    const seat = game.seats[game.turn];
    if (!seat || seat.kind !== "human") return;
    if (legalMovesForSeat(game, game.turn).length > 0) return;

    const timer = window.setTimeout(() => {
      handlePassOrDraw();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [
    autoPass,
    rearrangeMode,
    match,
    game,
    pendingFlight,
    flight,
    busy,
    handlePassOrDraw,
  ]);

  const continueAfterHand = () => {
    if (!match) return;
    setSelectedId(null);
    dismissPassFlash();
    setMatch(dealNextHand(match));
  };

  const continueAfterGame = () => {
    if (!match) return;
    setSelectedId(null);
    dismissPassFlash();
    setMatch(startNextGame(match));
  };

  if (!match || !game) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          position: "relative",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
          py: { xs: 2, md: 4 },
          px: { xs: 1.5, sm: 2 },
          pb: { xs: 4, md: 6 },
        }}
      >
        <IconButton
          aria-label={t("playConfigAria")}
          onPointerDown={tapFeedback}
          onClick={() => setConfigOpen(true)}
          sx={{
            ...pressableSx,
            position: "absolute",
            top: { xs: 8, sm: 12 },
            right: { xs: 8, sm: 12 },
            zIndex: 2,
            color: "primary.dark",
            backgroundColor: (theme) => alpha(theme.palette.grey[100], 0.9),
            border: "1px solid",
            borderColor: "divider",
            "&:hover": {
              backgroundColor: (theme) => alpha(theme.palette.grey[100], 1),
            },
          }}
        >
          <SettingsOutlined />
        </IconButton>
        <PlaySetup
          modeId={modeId}
          setId={setId}
          maxPoints={maxPoints}
          botBrain={botBrain}
          onMode={setModeId}
          onSet={setSetId}
          onMaxPoints={handleMaxPoints}
          onBotBrain={handleBotBrain}
          onStart={start}
        />
        <PlayConfigDrawer
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          pace={{
            botDelayMs,
            onBotDelay: setBotDelayMs,
            animMs,
            onAnimMs: setAnimMs,
          }}
        />
      </Box>
    );
  }

  const positions = seatPositions(game.modeId);
  const seatByPosition = Object.fromEntries(
    game.seats.map((seat, i) => [positions[i], seat])
  ) as Record<string, (typeof game.seats)[0]>;

  const labels = teamLabels(game.modeId);

  const canPass = humanTurn && !rearrangeMode && legal.length === 0;
  const humanTeam = game.seats[0]?.team ?? 1;
  const partnerSeat = game.seats.find(
    (s) => s.team === humanTeam && s.index !== 0
  );
  const turnActive = game.phase === "playing" && !game.awaitingOpenerChoice;
  /** Same height for every control in the table action bar. */
  /** Action bar: taller tap targets on phones; width stays compact. */
  const actionHeight = { xs: 39, sm: 36 } as const;
  const actionWidth = { xs: 34, sm: 36 } as const;
  const actionBtnSx = {
    height: actionHeight,
    minHeight: actionHeight,
    minWidth: actionWidth,
    px: { xs: 1, sm: 1.15 },
    py: 0,
    fontSize: { xs: 12, sm: 13 },
    fontWeight: 800,
    borderRadius: 1,
    lineHeight: 1,
  };
  const actionIconSx = {
    width: actionWidth,
    height: actionHeight,
    borderRadius: 1,
  };
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
      isTurn={turnActive && game.turn === seat.index}
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
                    turnActive && game.turn === seatByPosition.top.index
                  }
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
                    turnActive && game.turn === seatByPosition.left.index
                  }
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
                      dropEnabled={humanTurn && !rearrangeMode}
                      onDropSide={handleDropSide}
                      onTapSide={(side) => {
                        if (!selectedId) return;
                        if (!selectedMoves.some((m) => m.side === side)) return;
                        commitMove(side, selectedId);
                      }}
                      activeSides={selectedMoves.map((m) => m.side)}
                      flyingTileId={
                        pendingFlight?.tileId ?? flight?.tileId ?? null
                      }
                      tileScale={tileScale}
                    />
                  </Box>

                  {useChips && game.phase === "playing" && (
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
                    {game.phase === "finished" && (
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
                        {(
                          [
                            "top",
                            "left",
                            "right",
                            "bottom",
                          ] as const
                        ).map((pos) => {
                          const seat = seatByPosition[pos];
                          if (!seat) return null;
                          const isWinner =
                            !!game.result &&
                            (game.result.winners.includes(seat.index) ||
                              seat.team === game.result.winnerTeam);
                          return (
                            <PlayLeftoverCorner
                              key={pos}
                              seat={seat}
                              position={pos}
                              isWinner={isWinner}
                              compact={compact}
                            />
                          );
                        })}

                        <Box
                          sx={{
                            position: "relative",
                            zIndex: 7,
                            px: { xs: 2, sm: 2.5 },
                            py: { xs: 1.75, sm: 2 },
                            borderRadius: 2,
                            backgroundColor: alpha("#FDF8EE", 0.97),
                            textAlign: "center",
                            maxWidth: 320,
                            mx: 1.5,
                            boxShadow: `0 10px 28px ${alpha("#000", 0.28)}`,
                            border: `1px solid ${alpha("#C08A2E", 0.35)}`,
                          }}
                        >
                          {match.gameOver ? (
                            <>
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                  color: "text.secondary",
                                }}
                              >
                                {t("gameNumber", { n: match.gameIndex })}
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: (theme) =>
                                    theme.typography.h2.fontFamily,
                                  fontWeight: 800,
                                  fontSize: { xs: 22, sm: 26 },
                                  color: "primary.dark",
                                  lineHeight: 1.15,
                                  mt: 0.5,
                                }}
                              >
                                {t("tookIt", {
                                  team: match.gameWinnerTeams
                                    .map((team) => t(labels[team]))
                                    .join(" & "),
                                })}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.5 }}
                              >
                                {t("playReached", {
                                  team: match.gameWinnerTeams
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
                                  onPointerDown={tapFeedback}
                                  onClick={() => setNotesOpen(true)}
                                  sx={pressableSx}
                                >
                                  {t("playScorepad")}
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onPointerDown={tapFeedback}
                                  onClick={continueAfterGame}
                                  sx={pressableSx}
                                >
                                  {t("nextGame")}
                                </Button>
                              </Stack>
                            </>
                          ) : game.result ? (
                            <>
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                  color: "text.secondary",
                                }}
                              >
                                {t("playHandDone", { n: game.handIndex })}
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: (theme) =>
                                    theme.typography.h2.fontFamily,
                                  fontWeight: 800,
                                  fontSize: { xs: 22, sm: 26 },
                                  color: "primary.dark",
                                  lineHeight: 1.15,
                                  mt: 0.5,
                                }}
                              >
                                {t("playHandWinner", {
                                  name: t(labels[game.result.winnerTeam]),
                                })}
                              </Typography>
                              <Typography
                                sx={{
                                  fontWeight: 800,
                                  fontSize: { xs: 28, sm: 32 },
                                  color: "secondary.main",
                                  fontVariantNumeric: "tabular-nums",
                                  lineHeight: 1.1,
                                  mt: 0.5,
                                }}
                              >
                                {t("playHandPoints", {
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
                                  onPointerDown={tapFeedback}
                                  onClick={() => setNotesOpen(true)}
                                  sx={pressableSx}
                                >
                                  {t("playScorepad")}
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onPointerDown={tapFeedback}
                                  onClick={continueAfterHand}
                                  sx={pressableSx}
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
                    py: { xs: landscapePhone ? 0.2 : 0.35, sm: 0.45 },
                    borderRadius: { xs: "6px", sm: "8px" },
                    background: alpha("#1A120C", 0.42),
                    boxShadow: `inset 0 1px 3px ${alpha("#000", 0.3)}`,
                    minWidth: 0,
                  }}
                >
                  {/* Left: pass callout */}
                  <Box
                    sx={{
                      flex: "1 1 0",
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <AnimatePresence initial={false}>
                      {passFlash &&
                        game.phase === "playing" &&
                        !match.gameOver && (
                        <motion.div
                          key={`pass-${passFlash.token}`}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          transition={{ duration: 0.18 }}
                          style={{ minWidth: 0, maxWidth: "100%" }}
                        >
                          <Box
                            role="status"
                            aria-live="polite"
                            sx={{
                              px: { xs: 0.75, sm: 1 },
                              py: { xs: 0.35, sm: 0.45 },
                              borderRadius: { xs: "5px", sm: "6px" },
                              backgroundColor: "#C23B2E",
                              border: `1px solid ${alpha("#F7C4BC", 0.75)}`,
                              boxShadow: `0 0 0 1px ${alpha("#8F1F16", 0.45)}`,
                              maxWidth: "100%",
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: { xs: 10, sm: 12 },
                                lineHeight: 1.2,
                                color: "#FFF6F4",
                                letterSpacing: "0.01em",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {t("playSeatPassed", {
                                name: t(passFlash.nameKey),
                              })}
                            </Typography>
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>

                  {/* Center: Auto-pass — Organize — Rearrange — Pass/Draw */}
                  <Stack
                    direction="row"
                    spacing={0.45}
                    alignItems="center"
                    justifyContent="center"
                    sx={{ flexShrink: 0 }}
                  >
                    <IconButton
                      size="small"
                      aria-label={
                        autoPass ? t("playAutoPassOn") : t("playAutoPassOff")
                      }
                      aria-pressed={autoPass}
                      onPointerDown={tapFeedback}
                      onClick={toggleAutoPass}
                      sx={{
                        ...pressableSx,
                        ...actionIconSx,
                        color: autoPass ? "#1A120C" : alpha("#FBF5E9", 0.92),
                        backgroundColor: autoPass
                          ? "#E8A04A"
                          : alpha("#FBF5E9", 0.14),
                        border: `1px solid ${
                          autoPass ? "#C8842E" : alpha("#FBF5E9", 0.42)
                        }`,
                        "&:hover": {
                          backgroundColor: autoPass
                            ? "#F0B25E"
                            : alpha("#FBF5E9", 0.22),
                        },
                      }}
                    >
                      <AutoModeOutlined sx={{ fontSize: { xs: 17, sm: 19 } }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label={t("playOrganizeHand")}
                      disabled={game.seats[0].hand.length < 2}
                      onPointerDown={tapFeedback}
                      onClick={handleOrganizeHand}
                      sx={{
                        ...pressableSx,
                        ...actionIconSx,
                        color: alpha("#FBF5E9", 0.92),
                        backgroundColor: alpha("#FBF5E9", 0.14),
                        border: `1px solid ${alpha("#FBF5E9", 0.42)}`,
                        "&:hover": {
                          backgroundColor: alpha("#FBF5E9", 0.22),
                        },
                        "&.Mui-disabled": {
                          color: alpha("#FBF5E9", 0.35),
                          backgroundColor: alpha("#FBF5E9", 0.08),
                          borderColor: alpha("#FBF5E9", 0.2),
                        },
                      }}
                    >
                      <SortOutlined sx={{ fontSize: { xs: 17, sm: 19 } }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label={
                        rearrangeMode
                          ? t("playRearrangeOn")
                          : t("playRearrangeOff")
                      }
                      aria-pressed={rearrangeMode}
                      onPointerDown={tapFeedback}
                      onClick={toggleRearrangeMode}
                      sx={{
                        ...pressableSx,
                        ...actionIconSx,
                        color: rearrangeMode
                          ? "#1A120C"
                          : alpha("#FBF5E9", 0.92),
                        backgroundColor: rearrangeMode
                          ? "#E8A04A"
                          : alpha("#FBF5E9", 0.14),
                        border: `1px solid ${
                          rearrangeMode
                            ? "#C8842E"
                            : alpha("#FBF5E9", 0.42)
                        }`,
                        "&:hover": {
                          backgroundColor: rearrangeMode
                            ? "#F0B25E"
                            : alpha("#FBF5E9", 0.22),
                        },
                      }}
                    >
                      <SwapHorizOutlined sx={{ fontSize: { xs: 17, sm: 19 } }} />
                    </IconButton>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!canPass}
                      onPointerDown={tapFeedback}
                      onClick={handlePassOrDraw}
                      sx={{
                        ...pressableSx,
                        ...actionBtnSx,
                        minWidth: { xs: 56, sm: 64 },
                        color: "#1A120C",
                        backgroundColor: "#FBF5E9",
                        boxShadow: "none",
                        "&:hover": {
                          backgroundColor: "#FFFBF3",
                          boxShadow: "none",
                        },
                        "&.Mui-disabled": {
                          color: alpha("#FBF5E9", 0.45),
                          backgroundColor: alpha("#FBF5E9", 0.12),
                        },
                      }}
                    >
                      {game.allowDraw && game.boneyard.length > 0
                        ? t("playDraw")
                        : t("playPass")}
                    </Button>
                  </Stack>

                  {/* Right: Settings — Notebook */}
                  <Stack
                    direction="row"
                    spacing={0.45}
                    alignItems="center"
                    justifyContent="flex-end"
                    sx={{ flex: "1 1 0", minWidth: 0 }}
                  >
                    <IconButton
                      size="small"
                      aria-label={t("playConfigAria")}
                      onPointerDown={tapFeedback}
                      onClick={() => setConfigOpen(true)}
                      sx={{
                        ...pressableSx,
                        ...actionIconSx,
                        color: "#1A120C",
                        backgroundColor: "#FBF5E9",
                        border: `1px solid ${alpha("#FBF5E9", 0.7)}`,
                        "&:hover": {
                          backgroundColor: "#FFFBF3",
                        },
                      }}
                    >
                      <SettingsOutlined sx={{ fontSize: { xs: 17, sm: 19 } }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label={t("playScorepad")}
                      onPointerDown={tapFeedback}
                      onClick={() => setNotesOpen(true)}
                      sx={{
                        ...pressableSx,
                        ...actionIconSx,
                        color: "#1A120C",
                        backgroundColor: "#FBF5E9",
                        border: `1px solid ${alpha("#FBF5E9", 0.7)}`,
                        "&:hover": {
                          backgroundColor: "#FFFBF3",
                        },
                      }}
                    >
                      <MenuBookOutlined sx={{ fontSize: { xs: 17, sm: 19 } }} />
                    </IconButton>
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
                    turnActive && game.turn === seatByPosition.right.index
                  }
                  position="right"
                  anchorRef={(el) => setSeatAnchor("right", el)}
                />
              </Box>
            )}
          </Box>

          {/* Keep the rack mounted after you go out — empty stand, not gone. */}
          {(game.phase === "playing" || game.phase === "finished") && (
            <Box
              sx={{
                flexShrink: 0,
                width: "100%",
                display: "flex",
                justifyContent: "center",
                position: "relative",
                zIndex: selectedId ? 25 : 2,
              }}
            >
              <PlayHand
                hand={game.seats[0].hand}
                legal={legal}
                selectedId={selectedId}
                disabled={!humanTurn || rearrangeMode}
                onSelect={handleSelectTile}
                onArm={handleArmTile}
                onDropSide={handleDropSide}
                compact={compact}
                rearrange={rearrangeMode}
                onReorder={handleReorderHand}
                onFlip={handleFlipHandTile}
                handSlots={setConfig(game.setId).tilesPerHand}
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
                    turnActive && game.turn === seatByPosition.bottom.index
                  }
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

      <PlayOpenerDialog
        open={game.awaitingOpenerChoice}
        onChooseYou={() => handleChooseOpener(0)}
        onChoosePartner={() => {
          if (partnerSeat) handleChooseOpener(partnerSeat.index);
        }}
      />

      <PlayNotesDrawer
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        match={match}
        onEndGame={() => {
          setNotesOpen(false);
          setMatch(null);
          setSelectedId(null);
          setBusy(false);
          setPendingFlight(null);
          setFlight(null);
          dismissPassFlash();
        }}
      />

      <PlayConfigDrawer
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        pace={{
          botDelayMs,
          onBotDelay: setBotDelayMs,
          animMs,
          onAnimMs: setAnimMs,
        }}
        botBrain={{
          id: botBrain,
          onChange: handleBotBrain,
          locked: true,
        }}
        debugLog={
          process.env.NODE_ENV === "development"
            ? {
                logs: game.logs,
                open: logOpen,
                onToggle: () => setLogOpen((v) => !v),
              }
            : null
        }
      />
    </>
  );
}
