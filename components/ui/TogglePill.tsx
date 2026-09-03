"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface TogglePillProps {
  pressed: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  /** The label of the opposite state; used to reserve width so toggling never resizes the pill. */
  altLabel: string;
  disabled?: boolean;
  className?: string;
}

/**
 * The frosted pill used over media: Sound / Animation on the claw stage and
 * Sound on the fullscreen reveal. Both states are laid on top of each other in a
 * grid so the pill is always as wide as its longest label and never jumps.
 */
export function TogglePill({
  pressed,
  onClick,
  icon,
  label,
  altLabel,
  disabled,
  className,
}: TogglePillProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      // The hidden twin below only reserves width; name the control explicitly.
      aria-label={label}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className={cn(
        "glass z-10 inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-40",
        className,
      )}
    >
      <span className="shrink-0" aria-hidden>
        {icon}
      </span>
      <span className="grid whitespace-nowrap">
        <span className="invisible col-start-1 row-start-1" aria-hidden>
          {altLabel}
        </span>
        <span className="col-start-1 row-start-1">{label}</span>
      </span>
    </motion.button>
  );
}
