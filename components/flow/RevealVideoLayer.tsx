"use client";

import { Volume2, VolumeX } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { FlowEvent } from "@/store/claw-flow";
import { REVEAL_DURATION_S, REVEAL_TAIL_AT_S } from "@/lib/video/sources";
import { TogglePill } from "@/components/ui/TogglePill";
import { cn } from "@/lib/utils/cn";

export interface RevealVideoLayerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  active: boolean;
  sound: boolean;
  onToggleSound: () => void;
  play: (soundOn: boolean) => Promise<void>;
  stop: () => void;
  dispatch: (event: FlowEvent) => void;
  label: string;
}

/**
 * The single, persistent reveal <video>. It exists from hydration onwards so
 * the preloader can attach the buffered clip long before the user presses
 * Confirm; the flow only toggles its visibility and drives playback.
 */
export function RevealVideoLayer({
  videoRef,
  active,
  sound,
  onToggleSound,
  play,
  stop,
  dispatch,
  label,
}: RevealVideoLayerProps) {
  const [visible, setVisible] = useState(false);
  const soundRef = useRef(sound);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // Drive playback and the phase transitions while active.
  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) {
      dispatch({ type: "SKIP_VIDEO" });
      return;
    }
    let cancelled = false;
    let frame = 0;
    let tailSent = false;

    // Read the clip's own clock to begin the result transition at its tail.
    const sample = () => {
      if (cancelled) return;
      const t = video.currentTime;
      if (!tailSent && t >= REVEAL_TAIL_AT_S) {
        tailSent = true;
        dispatch({ type: "VIDEO_TAIL" });
      }
    };

    const tick = () => {
      sample();
      if (!cancelled) frame = requestAnimationFrame(tick);
    };
    // rAF keeps the handoff crisp while the reveal is visible. A coarse timer
    // still advances it if rendering is temporarily starved.
    const backup = setInterval(sample, 100);

    const onEnded = () => dispatch({ type: "VIDEO_ENDED" });
    const skipVideo = () => dispatch({ type: "SKIP_VIDEO" });
    const onError = () => skipVideo();
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (video.ended) dispatch({ type: "VIDEO_ENDED" });
      else if (video.paused) void video.play().catch(skipVideo);
    };
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    document.addEventListener("visibilitychange", onVisibility);

    // Never trap the user: if the clip stalls, move on once its duration has passed.
    const watchdog = setTimeout(() => dispatch({ type: "VIDEO_ENDED" }), (REVEAL_DURATION_S + 1.5) * 1000);

    play(soundRef.current).catch(() => {
      // Autoplay with sound refused – retry muted before giving up.
      video.muted = true;
      return video.play().catch(skipVideo);
    });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearInterval(backup);
      clearTimeout(watchdog);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, videoRef, dispatch, play]);

  return (
    <motion.div
      aria-hidden={!active}
      inert={!active ? true : undefined}
      className={cn(
        "fixed inset-0 z-[60] bg-black",
        !active && "pointer-events-none",
        !visible && !active && "invisible",
      )}
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: active ? 0.25 : 0.6, ease: "easeInOut" }}
      onAnimationStart={() => {
        if (active) setVisible(true);
      }}
      onAnimationComplete={() => {
        if (!active) {
          setVisible(false);
          stop();
        }
      }}
    >
      <video
        ref={videoRef}
        id="reveal-video"
        className="size-full object-cover"
        playsInline
        muted={!sound}
        preload="auto"
        aria-label={label}
        disablePictureInPicture
        controls={false}
      />
      {/* Action-oriented audio control for the fullscreen reveal. */}
      <TogglePill
        pressed={sound}
        onClick={onToggleSound}
        icon={sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        label={sound ? "Mute" : "Unmute"}
        altLabel="Unmute"
        className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:right-6"
      />
    </motion.div>
  );
}
