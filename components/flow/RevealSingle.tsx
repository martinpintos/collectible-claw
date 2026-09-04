"use client";

import { X } from "lucide-react";
import { motion } from "motion/react";
import { SlabCard } from "@/components/claw/SlabCard";
import { Button } from "@/components/ui/Button";
import { HexPanel } from "@/components/ui/HexPanel";
import { Money } from "@/components/ui/Money";
import type { PulledItem } from "@/lib/domain/types";

export function RevealSingle({
  item,
  pending,
  error,
  expired,
  onSwap,
  onKeep,
  onClose,
}: {
  item: PulledItem;
  pending: boolean;
  error: string | null;
  expired: boolean;
  onSwap: () => void;
  onKeep: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-y-auto">
      {/* Padding matches the content column so the glyph sits on the card's edge line. */}
      <div className="sticky top-0 z-10 flex justify-end px-4 pb-1 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-8 sm:pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Close"
          title="Close"
          onClick={onClose}
          disabled={pending}
          className="-mr-2 inline-flex size-9 items-center justify-center rounded-full text-fg-secondary transition-colors hover:bg-white/10 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 disabled:opacity-50"
        >
          <X className="size-5" strokeWidth={1.5} />
        </button>
      </div>
      <div className="mx-auto grid w-full max-w-[1180px] flex-1 items-center gap-3 px-4 pb-4 sm:gap-8 sm:px-8 sm:pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.05 }}
          className="mx-auto w-full sm:max-w-[440px] lg:max-w-[480px]"
        >
          <HexPanel className="rounded-2xl">
            <SlabCard
              name={item.name}
              grade={item.grade}
              grader={item.grader}
              set={item.set}
              imageSrc={item.imageSrc}
              sizes="(min-width: 1024px) 480px, (min-width: 640px) 440px, 100vw"
              priority
            />
          </HexPanel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
          className="flex flex-col gap-3 sm:gap-6"
        >
          <div>
            <h2 className="text-balance text-lg font-semibold leading-snug text-fg sm:text-[34px]">{item.name}</h2>
          </div>
          <div>
            <p className="text-xs text-fg-secondary sm:text-sm">Swap Value</p>
            <Money value={item.swapValue} className="text-3xl font-bold text-brand sm:text-5xl" />
          </div>
          {error ? (
            <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
          {expired ? (
            <p className="rounded-input bg-control px-3 py-2 text-sm text-fg-secondary">
              The swap window closed. This item stays in your vault.
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:gap-3">
            <Button size="lg" fullWidth pending={pending} disabled={expired} onClick={onSwap} className="h-11 text-sm sm:h-12 sm:text-[15px]">
              Swap Now
            </Button>
            <Button
              size="lg"
              fullWidth
              variant="secondary"
              disabled={pending}
              onClick={onKeep}
              className="h-11 text-sm sm:h-12 sm:text-[15px]"
            >
              Keep Item
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
