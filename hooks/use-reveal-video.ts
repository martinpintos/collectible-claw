"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MachineMedia } from "@/lib/domain/types";
import { getPreloader, type PreloadState } from "@/lib/video/preloader";
import { KNOWN_BYTES, pickRevealVariant, revealSource, type RevealVariant } from "@/lib/video/sources";

const SERVER_SNAPSHOT: PreloadState = {
  status: "idle",
  progress: 0,
  url: null,
  objectUrl: null,
  usedFallback: false,
  degraded: false,
  error: null,
};
const getServerSnapshot = () => SERVER_SNAPSHOT;

/**
 * Owns the persistent reveal <video>: kicks off the blob preload as soon as the
 * page hydrates, attaches the buffered file to the element, and exposes the
 * gesture-bound unlock + play controls used by the flow.
 */
export function useRevealVideo(media: MachineMedia) {
  const [variant] = useState<RevealVariant>(() => pickRevealVariant());
  const url = revealSource(media, variant);
  const preloader = getPreloader(url);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const state = useSyncExternalStore(preloader.subscribe, preloader.getSnapshot, getServerSnapshot);

  useEffect(() => {
    void preloader.start(url, KNOWN_BYTES[variant]);
  }, [preloader, url, variant]);

  useEffect(() => {
    const video = videoRef.current;
    if (state.status === "attaching" && video) void preloader.attach(video);
  }, [preloader, state.status]);

  const unlock = useCallback(
    (soundOn: boolean) => {
      const video = videoRef.current;
      if (video) preloader.unlock(video, soundOn);
    },
    [preloader],
  );

  const play = useCallback((soundOn: boolean) => {
    const video = videoRef.current;
    if (!video) return Promise.reject(new Error("no video element"));
    video.muted = !soundOn;
    video.currentTime = 0;
    return video.play();
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, []);

  const stop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      /* not seekable yet */
    }
  }, []);

  return { videoRef, state, variant, url, unlock, play, stop, setMuted };
}
