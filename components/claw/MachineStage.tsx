"use client";

import { Play, Volume2, VolumeX, WandSparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useHaptics } from "@/hooks/use-haptics";
import type { MachineMedia } from "@/lib/domain/types";
import { TogglePill } from "@/components/ui/TogglePill";
import { usePrefs } from "@/store/prefs-provider";

/**
 * Idle claw loop with the Sound / Animation toggles from the design. Prefs are
 * cookie-backed, so the server already rendered the right variant and there is
 * no flash on hydration.
 */
export function MachineStage({ media, name }: { media: MachineMedia; name: string }) {
  const { sound, animation, setSound, setAnimation } = usePrefs((s) => s);
  const haptics = useHaptics();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [blocked, setBlocked] = useState(false);

  // Keep the DOM muted flag in sync with the persisted preference.
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = !sound;
  }, [sound, animation]);

  const tryPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video
      .play()
      .then(() => setBlocked(false))
      .catch(() => setBlocked(true));
  };

  const toggleSound = () => {
    haptics.fire("tap");
    const next = !sound;
    setSound(next);
    const video = videoRef.current;
    if (video) {
      video.muted = !next;
      if (video.paused) tryPlay();
    }
  };

  const toggleAnimation = () => {
    haptics.fire("tap");
    setAnimation(!animation);
  };

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-[#0e0e0e] lg:aspect-auto lg:min-h-[560px] lg:flex-1">
      {animation ? (
        <video
          ref={videoRef}
          className="size-full object-cover object-center"
          src={media.idle}
          poster={media.poster}
          autoPlay
          loop
          muted={!sound}
          playsInline
          preload="auto"
          aria-label={`${name} idle animation`}
          onPlay={() => setBlocked(false)}
          onPause={(event) => {
            // Autoplay can be refused (iOS Low Power Mode) – offer a tap-to-play affordance.
            if (event.currentTarget.ended === false && event.currentTarget.readyState >= 2) {
              setBlocked(true);
            }
          }}
        />
      ) : (
        <Image
          src={media.poster}
          alt={`${name} machine`}
          fill
          sizes="(min-width: 1024px) 660px, 100vw"
          className="object-cover object-center"
          loading="eager"
        />
      )}

      {animation && blocked ? (
        <button
          type="button"
          onClick={tryPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30"
          aria-label="Play animation"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
            <Play className="ml-1 size-7" />
          </span>
        </button>
      ) : null}

      <TogglePill
        onClick={toggleSound}
        pressed={sound}
        icon={sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        label={sound ? "Sound on" : "Sound off"}
        altLabel="Sound off"
        disabled={!animation}
        className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4"
      />
      <TogglePill
        onClick={toggleAnimation}
        pressed={animation}
        icon={<WandSparkles className="size-4" />}
        label={animation ? "Animation on" : "Animation off"}
        altLabel="Animation off"
        className="absolute bottom-3 right-3 sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
      />
    </div>
  );
}
