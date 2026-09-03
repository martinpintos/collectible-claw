"use client";

import { X } from "lucide-react";
import { motion } from "motion/react";
import { IconButton } from "@/components/ui/IconButton";
import { money } from "@/lib/domain/format";
import type { SwapResult } from "@/lib/domain/types";

export function SwapSuccess({ swap, onClose }: { swap: SwapResult; onClose: () => void }) {
  return (
    <div className="relative flex flex-col items-center gap-4 px-2 pb-4 pt-8 text-center">
      <IconButton label="Close" onClick={onClose} className="absolute -right-2 -top-4">
        <X className="size-5" />
      </IconButton>
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="flex size-24 items-center justify-center rounded-full bg-positive"
      >
        <svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="#0b2a1f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
      <div>
        <h2 className="text-2xl font-semibold text-fg">Swap success</h2>
        <p className="mt-1 text-sm text-fg-secondary">
          {money(swap.credited, { cents: true })} has been credited to your wallet.
        </p>
      </div>
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-md bg-brand px-3 py-1 text-sm font-semibold text-brand-fg"
      >
        +{swap.points} points
      </motion.span>
    </div>
  );
}
