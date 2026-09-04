"use client";

import { Info, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Money } from "@/components/ui/Money";
import { useCountdown } from "@/hooks/use-countdown";
import { useHaptics } from "@/hooks/use-haptics";
import { formatCountdown } from "@/lib/domain/format";
import type { PulledItem } from "@/lib/domain/types";
import { RevealCard } from "./RevealCard";

export function RevealMulti({
  items,
  selectedIds,
  selectedTotal,
  expiresAt,
  expired,
  pending,
  pendingItemId,
  error,
  onToggle,
  onSelectAll,
  onClear,
  onSwapSelected,
  onSwapOne,
  onExpire,
  onClose,
}: {
  items: PulledItem[];
  selectedIds: string[];
  selectedTotal: number;
  expiresAt: string;
  expired: boolean;
  pending: boolean;
  pendingItemId: string | null;
  error: string | null;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  onSwapSelected: () => void;
  onSwapOne: (id: string) => void;
  onExpire: () => void;
  onClose: () => void;
}) {
  const haptics = useHaptics();
  const remaining = useCountdown(expiresAt);
  const allSelected = selectedIds.length === items.length;

  useEffect(() => {
    if (remaining === 0 && !expired) onExpire();
  }, [remaining, expired, onExpire]);

  useEffect(() => {
    if (remaining !== null && remaining > 0 && remaining <= 3000) haptics.fire("select");
  }, [remaining, haptics]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center justify-end px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <IconButton label="Close" onClick={onClose} disabled={pending} className="bg-black/40 backdrop-blur-md">
          <X className="size-5" />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 sm:px-8">
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
          className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {items.map((item) => (
            <RevealCard
              key={item.instanceId}
              item={item}
              selected={selectedIds.includes(item.instanceId)}
              disabled={pending || expired}
              pending={pendingItemId === item.instanceId}
              onToggle={() => {
                haptics.fire("select");
                onToggle(item.instanceId);
              }}
              onSwap={() => onSwapOne(item.instanceId)}
            />
          ))}
        </motion.ul>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-border/80 bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        {error ? (
          <p role="alert" className="mx-auto max-w-6xl px-4 pt-3 text-sm text-danger sm:px-8">
            {error}
          </p>
        ) : null}
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-8">
          <p className="text-sm text-fg-secondary">
            {expired ? (
              <span className="font-semibold text-fg">Offer expired</span>
            ) : (
              <>
                Expires in:{" "}
                <span className="font-semibold tabular-nums text-fg">
                  {remaining === null ? "—" : formatCountdown(remaining)}
                </span>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              haptics.fire("tap");
              if (allSelected) onClear();
              else onSelectAll();
            }}
            disabled={pending || expired}
            className="ml-auto text-sm font-medium text-fg hover:text-white disabled:opacity-40"
          >
            {allSelected ? "Clear" : "Select all"}
          </button>
          <Button
            size="lg"
            className="min-w-[140px] sm:min-w-[240px]"
            disabled={selectedIds.length === 0 || expired}
            pending={pending && pendingItemId === null}
            onClick={onSwapSelected}
          >
            {selectedIds.length > 0 ? (
              <>
                Swap {selectedIds.length} {selectedIds.length === 1 ? "item" : "items"} for{" "}
                <Money value={selectedTotal} />
              </>
            ) : (
              "Swap"
            )}
          </Button>
          <span
            className="hidden text-fg-secondary sm:block"
            title="Swap pays the machine's swap percentage of each item's market value, credited to your Beezie wallet."
          >
            <Info className="size-5" aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}
