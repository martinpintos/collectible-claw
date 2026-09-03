"use client";

import { CircleCheck, CirclePlus } from "lucide-react";
import { motion } from "motion/react";
import { SlabCard } from "@/components/claw/SlabCard";
import { Button } from "@/components/ui/Button";
import { money } from "@/lib/domain/format";
import type { PulledItem } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";

export function RevealCard({
  item,
  selected,
  disabled,
  pending,
  onToggle,
  onSwap,
}: {
  item: PulledItem;
  selected: boolean;
  disabled: boolean;
  pending: boolean;
  onToggle: () => void;
  onSwap: () => void;
}) {
  return (
    <motion.li
      layout
      variants={{ hidden: { opacity: 0, y: 24, scale: 0.94 }, show: { opacity: 1, y: 0, scale: 1 } }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-control transition-colors",
        selected ? "border-brand" : "border-border",
      )}
    >
      <div className="relative">
        <SlabCard
          name={item.name}
          grade={item.grade}
          grader={item.grader}
          set={item.set}
          imageSrc={item.imageSrc}
          sizes="(min-width: 1024px) 300px, 45vw"
          priority
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-pressed={selected}
          aria-label={selected ? `Deselect ${item.name}` : `Select ${item.name}`}
          className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full text-white drop-shadow-md transition-transform hover:scale-105 disabled:opacity-40"
        >
          {selected ? (
            <CircleCheck className="size-8 fill-brand text-brand-fg" />
          ) : (
            <CirclePlus className="size-8 fill-black/80 text-white" />
          )}
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-fg">{item.name}</p>
        <Button
          size="md"
          fullWidth
          onClick={onSwap}
          disabled={disabled}
          pending={pending}
          className={cn("mt-auto", selected && "bg-brand/45 text-brand-fg/80 hover:brightness-100")}
        >
          Swap for {money(item.swapValue)}
        </Button>
      </div>
    </motion.li>
  );
}
