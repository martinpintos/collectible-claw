"use client";

import { LoaderCircle } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SlabCard } from "@/components/claw/SlabCard";
import { money } from "@/lib/domain/format";
import type { CatalogItem } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";

const SLIDE_MS = 1400;

/**
 * The gap between paying and the reveal. It teases what the machine holds while
 * the pull settles and the reveal clip finishes buffering. Its visible timer
 * always starts at zero; video readiness separately gates the next phase.
 */
export function PreparingModal({
  preview,
  progress,
}: {
  preview: CatalogItem[];
  /** 0..1 visible dwell-timer progress for the current pull. */
  progress: MotionValue<number>;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const fill = useTransform(progress, (p) => `${Math.min(100, Math.max(0, p * 100))}%`);

  // The bar is determinate, so it owes assistive tech an aria-valuenow. Written
  // straight to the node: re-rendering this panel on every animation frame would
  // restart the carousel's transitions for nothing.
  const barRef = useRef<HTMLDivElement | null>(null);
  useMotionValueEvent(progress, "change", (p) => {
    barRef.current?.setAttribute(
      "aria-valuenow",
      String(Math.round(Math.min(100, Math.max(0, p * 100)))),
    );
  });

  useEffect(() => {
    if (paused || preview.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % preview.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [paused, preview.length]);

  const item = preview[index] ?? null;

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-center text-base font-semibold text-fg">What you can pull</h2>

      <div
        className="w-full"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="relative mx-auto aspect-square w-full max-w-[340px] overflow-hidden rounded-xl">
          <AnimatePresence initial={false}>
            {item ? (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <SlabCard
                  name={item.name}
                  grade={item.grade}
                  grader={item.grader}
                  set={item.set}
                  imageSrc={item.imageSrc}
                  sizes="340px"
                  priority
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <ol className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {preview.map((p, i) => (
            <li
              key={p.id}
              className={cn(
                "h-1 rounded-full transition-all",
                i === index ? "w-5 bg-fg" : "w-1 bg-fg-secondary/40",
              )}
            />
          ))}
        </ol>

        <p className="mt-3 flex justify-center" aria-live="polite">
          <span className="rounded-md bg-control px-3 py-1.5 text-xs text-fg-secondary">
            Approx market value:{" "}
            <span className="font-semibold text-fg">{item ? money(item.marketValue) : "—"}</span>
          </span>
        </p>
      </div>

      <div
        ref={barRef}
        role="progressbar"
        aria-label="Preparing your pull"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        className="relative h-12 w-full select-none overflow-hidden rounded-input bg-brand"
      >
        {/* Darker gold sweeps left→right across the button as the pull prepares. */}
        <motion.div className="absolute inset-y-0 left-0 bg-black/20" style={{ width: fill }} />
        <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-bold text-brand-fg">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Do Not Refresh
        </span>
      </div>
    </div>
  );
}
