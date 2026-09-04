"use client";

import { Minus, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useHaptics } from "@/hooks/use-haptics";
import { cn } from "@/lib/utils/cn";

interface StepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  className?: string;
  label?: string;
}

/** Quantity stepper: 128×48 in the design, minus in secondary grey, plus in white. */
export function Stepper({ value, min = 1, max, onChange, className, label = "Quantity" }: StepperProps) {
  const haptics = useHaptics();
  const canDecrement = value > min;
  const canIncrement = value < max;

  const step = (delta: number) => {
    const next = value + delta;
    if (next < min || next > max) return;
    haptics.fire("tick");
    onChange(next);
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex h-12 w-32 shrink-0 items-center rounded-control border border-border bg-control",
        className,
      )}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp" || event.key === "ArrowRight") {
          event.preventDefault();
          step(1);
        } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
          event.preventDefault();
          step(-1);
        }
      }}
    >
      <motion.button
        type="button"
        aria-label="Decrease quantity"
        disabled={!canDecrement}
        whileTap={canDecrement ? { scale: 0.85 } : undefined}
        onClick={() => step(-1)}
        className="flex h-full w-11 items-center justify-center rounded-l-control text-fg-secondary outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-brand/70 disabled:opacity-40"
      >
        <Minus className="size-4" strokeWidth={2.25} aria-hidden />
      </motion.button>
      <output
        aria-live="polite"
        className="flex-1 text-center text-base font-medium tabular-nums text-fg"
      >
        {value}
      </output>
      <motion.button
        type="button"
        aria-label="Increase quantity"
        disabled={!canIncrement}
        whileTap={canIncrement ? { scale: 0.85 } : undefined}
        onClick={() => step(1)}
        className="flex h-full w-11 items-center justify-center rounded-r-control text-fg outline-none focus-visible:ring-2 focus-visible:ring-brand/70 disabled:opacity-40"
      >
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
      </motion.button>
    </div>
  );
}
