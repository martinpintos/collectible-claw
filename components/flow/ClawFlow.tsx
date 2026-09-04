"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { pullFromMachine, swapItems } from "@/app/actions";
import { useHaptics } from "@/hooks/use-haptics";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRevealVideo } from "@/hooks/use-reveal-video";
import { fireSideCannons } from "@/lib/effects/confetti";
import type { CatalogItem, Machine, WalletSnapshot } from "@/lib/domain/types";
import { canSwap, selectedTotal as selectTotal } from "@/store/claw-flow";
import { useClawFlow, useClawFlowApi } from "@/store/claw-flow-provider";
import { usePrefs } from "@/store/prefs-provider";
import { cn } from "@/lib/utils/cn";
import { FlowOverlay } from "./FlowOverlay";
import { PaymentModal } from "./PaymentModal";
import { PreparingModal } from "./PreparingModal";
import { RevealMulti } from "./RevealMulti";
import { RevealSingle } from "./RevealSingle";
import { RevealVideoLayer } from "./RevealVideoLayer";
import { SwapSuccess } from "./SwapSuccess";

/** Minimum time the "Do not refresh" screen stays up, even if everything is instant. */
const MIN_PREPARING_MS = 6000;
const MIN_SWAP_MS = 1100;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function ClawFlow({
  machine,
  preview,
  wallet,
}: {
  machine: Machine;
  preview: CatalogItem[];
  wallet: WalletSnapshot;
}) {
  const api = useClawFlowApi();
  const flow = useClawFlow((s) => ({
    phase: s.phase,
    quantity: s.quantity,
    promo: s.promo,
    paymentMethod: s.paymentMethod,
    walletChoice: s.wallet,
    pull: s.pull,
    error: s.error,
    selectedIds: s.selectedIds,
    swap: s.swap,
    expired: s.expired,
    dispatch: s.dispatch,
  }));
  const { dispatch } = flow;
  const { sound, setSound } = usePrefs((s) => ({ sound: s.sound, setSound: s.setSound }));
  const haptics = useHaptics();
  const reveal = useRevealVideo(machine.media);
  const [pulling, startPull] = useTransition();
  const [swapping, startSwap] = useTransition();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const reduceMotion = useReducedMotion();
  const celebrated = useRef<string | null>(null);

  /* ---------------------------------------------------------- preload gate */
  useEffect(() => {
    if (reveal.state.status === "ready") dispatch({ type: "VIDEO_READY" });
  }, [reveal.state.status, dispatch]);

  /* --------------------------------------------------- reveal celebration */
  // Fires as the reveal takes over from the opening video, once per pull: a
  // failed swap drops back to `reveal` and must not set the cannons off again.
  const pullId = flow.pull?.pullId ?? null;
  useEffect(() => {
    if (flow.phase !== "reveal" || !pullId || reduceMotion) return;
    if (celebrated.current === pullId) return;
    celebrated.current = pullId;
    return fireSideCannons();
  }, [flow.phase, pullId, reduceMotion]);

  /* ------------------------------------------------ preparing progress bar */
  const timerProgress = useMotionValue(0);
  useEffect(() => {
    if (flow.phase !== "preparing") {
      timerProgress.set(0);
      return;
    }
    // A cached reveal video may already be loaded, but the visible loader must
    // always begin at zero for each pull. Video readiness still gates opening.
    timerProgress.set(0);
    // Mimic real work: a reassuring quick start, a measured middle while the
    // reveal is prepared, then a short final completion. It still always ends
    // exactly when the six-second preparation window completes.
    const controls = animate(timerProgress, [0, 0.28, 0.53, 0.68, 0.84, 1], {
      duration: MIN_PREPARING_MS / 1000,
      times: [0, 0.12, 0.42, 0.68, 0.86, 1],
      ease: "easeInOut",
    });
    return () => controls.stop();
  }, [flow.phase, timerProgress]);

  /* -------------------------------------------------------------- actions */
  const confirm = useCallback(() => {
    const state = api.getState();
    if (state.phase !== "payment") return;
    haptics.fire("confirm");
    // Gesture-bound: activates the reveal element on iOS (with sound if opted in).
    reveal.unlock(sound);
    // Reset before rendering the preparing panel, avoiding a stale final frame
    // when a user starts another pull after a previous reveal.
    timerProgress.set(0);
    dispatch({ type: "CONFIRM" });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => dispatch({ type: "MIN_TIMER_DONE" }), MIN_PREPARING_MS);

    startPull(async () => {
      const result = await pullFromMachine({
        machineSlug: state.machineSlug,
        quantity: state.quantity,
        promoCode: state.promo?.code,
        paymentMethod: state.paymentMethod,
        wallet: state.wallet,
      });
      if (result.ok) {
        dispatch({ type: "PULL_SUCCEEDED", pull: result.data });
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
        haptics.fire("error");
        dispatch({ type: "PULL_FAILED", error: result.error });
      }
    });
  }, [api, dispatch, haptics, reveal, sound, timerProgress]);

  const runSwap = useCallback(
    (itemIds: string[], itemId: string | null) => {
      const state = api.getState();
      if (!state.pull || itemIds.length === 0) return;
      haptics.fire("confirm");
      setPendingItemId(itemId);
      dispatch({ type: "SWAP" });
      const pullId = state.pull.pullId;
      startSwap(async () => {
        const [result] = await Promise.all([swapItems({ pullId, itemIds }), delay(MIN_SWAP_MS)]);
        setPendingItemId(null);
        if (result.ok) {
          haptics.fire("success");
          dispatch({ type: "SWAP_SUCCEEDED", swap: result.data });
        } else {
          haptics.fire("error");
          dispatch({ type: "SWAP_FAILED", error: result.error });
        }
      });
    },
    [api, dispatch, haptics],
  );

  const swapSelected = useCallback(() => {
    const state = api.getState();
    if (!canSwap(state)) return;
    runSwap(state.selectedIds, null);
  }, [api, runSwap]);

  const swapOne = useCallback(
    (id: string) => {
      dispatch({ type: "CLEAR_SELECTION" });
      dispatch({ type: "TOGGLE_SELECT", id });
      const state = api.getState();
      if (!canSwap(state)) return;
      runSwap([id], id);
    },
    [api, dispatch, runSwap],
  );

  const requestClose = useCallback(() => {
    const phase = api.getState().phase;
    if (closing || (phase !== "payment" && phase !== "reveal" && phase !== "swapped")) return;
    setClosing(true);
  }, [api, closing]);
  const finishClose = useCallback(() => {
    setClosing(false);
    dispatch({ type: "CLOSE" });
  }, [dispatch]);
  // The overlay reports its own close animation, except in a hidden tab where
  // rAF is paused; fall back to a timer so the flow can never get stuck.
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(finishClose, 600);
    return () => clearTimeout(timer);
  }, [closing, finishClose]);
  const keep = useCallback(() => {
    haptics.fire("tap");
    requestClose();
  }, [haptics, requestClose]);
  const { setMuted } = reveal;
  const toggleSound = useCallback(() => {
    haptics.fire("tap");
    const next = !sound;
    setSound(next);
    setMuted(!next);
  }, [haptics, setMuted, setSound, sound]);
  const expire = useCallback(() => dispatch({ type: "EXPIRE" }), [dispatch]);

  /* --------------------------------------------------------------- render */
  const open = flow.phase !== "idle";
  const inPanel =
    flow.phase === "payment" || flow.phase === "preparing" || flow.phase === "swapped";
  const label =
    flow.phase === "payment"
      ? "Review and pay"
      : flow.phase === "preparing"
        ? "Preparing your pull"
        : "Your pull";
  const total = flow.pull ? selectTotal({ ...api.getState() }) : 0;
  const draggable = isMobile && flow.phase === "payment";

  return (
    <>
      <FlowOverlay
        open={open}
        closing={closing}
        onRequestClose={requestClose}
        onCloseAnimationComplete={finishClose}
        label={label}
      >
        {inPanel ? (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-6">
            <motion.div
              layout
              drag={draggable ? "y" : false}
              dragConstraints={{ top: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (draggable && (info.offset.y > 120 || info.velocity.y > 700)) requestClose();
              }}
              transition={
                closing
                  ? { duration: 0.3, ease: [0.32, 0, 0.67, 0] }
                  : { type: "spring", stiffness: 340, damping: 32, mass: 0.85 }
              }
              initial={{ y: isMobile ? 40 : 12, opacity: 0, scale: isMobile ? 1 : 0.98 }}
              // Closing sends the sheet back the way it came: down and out on
              // mobile, a small settle-and-fade on desktop.
              animate={{
                y: closing ? (isMobile ? 96 : 18) : 0,
                opacity: closing ? 0 : 1,
                scale: closing ? (isMobile ? 1 : 0.96) : 1,
              }}
              className={cn(
                "panel pointer-events-auto w-full overflow-hidden rounded-b-none p-4 sm:max-w-[460px] sm:rounded-b-panel",
                "pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4",
              )}
              onClick={(event) => event.stopPropagation()}
            >
              {isMobile ? (
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden />
              ) : null}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={flow.phase}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  {flow.phase === "payment" ? (
                    <PaymentModal
                      machine={machine}
                      wallet={wallet}
                      quantity={flow.quantity}
                      promo={flow.promo}
                      paymentMethod={flow.paymentMethod}
                      walletChoice={flow.walletChoice}
                      error={flow.error}
                      pending={pulling}
                      onConfirm={confirm}
                      dispatch={dispatch}
                    />
                  ) : flow.phase === "preparing" ? (
                    <PreparingModal preview={preview} progress={timerProgress} />
                  ) : flow.swap ? (
                    <SwapSuccess swap={flow.swap} onClose={requestClose} />
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        ) : null}

        {(flow.phase === "reveal" || flow.phase === "swapping") && flow.pull ? (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-0 top-20 sm:inset-0 sm:p-4"
            initial={{ opacity: 0 }}
            // Settles back the way it arrived rather than blinking out.
            animate={{ opacity: closing ? 0 : 1, scale: closing ? 0.97 : 1, y: closing ? 24 : 0 }}
            transition={closing ? { duration: 0.3, ease: [0.32, 0, 0.67, 0] } : { duration: 0.5 }}
          >
            <div className="panel pointer-events-auto h-full w-full overflow-hidden rounded-b-none sm:rounded-panel">
              {flow.pull.items.length === 1 ? (
                <RevealSingle
                  item={flow.pull.items[0]}
                  pending={swapping}
                  error={flow.error}
                  expired={flow.expired}
                  onSwap={swapSelected}
                  onKeep={keep}
                  onClose={requestClose}
                />
              ) : (
                <RevealMulti
                  items={flow.pull.items}
                  selectedIds={flow.selectedIds}
                  selectedTotal={total}
                  expiresAt={flow.pull.expiresAt}
                  expired={flow.expired}
                  pending={swapping}
                  pendingItemId={pendingItemId}
                  error={flow.error}
                  onToggle={(id) => dispatch({ type: "TOGGLE_SELECT", id })}
                  onSelectAll={() => dispatch({ type: "SELECT_ALL" })}
                  onClear={() => dispatch({ type: "CLEAR_SELECTION" })}
                  onSwapSelected={swapSelected}
                  onSwapOne={swapOne}
                  onExpire={expire}
                  onClose={requestClose}
                />
              )}
            </div>
          </motion.div>
        ) : null}
      </FlowOverlay>

      <RevealVideoLayer
        videoRef={reveal.videoRef}
        active={flow.phase === "opening"}
        sound={sound}
        onToggleSound={toggleSound}
        play={reveal.play}
        stop={reveal.stop}
        dispatch={dispatch}
        label={`${machine.name} reveal animation`}
      />
    </>
  );
}
