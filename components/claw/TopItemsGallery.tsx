"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HexPanel } from "@/components/ui/HexPanel";
import { IconButton } from "@/components/ui/IconButton";
import { useHaptics } from "@/hooks/use-haptics";
import { money } from "@/lib/domain/format";
import type { TopItem } from "@/lib/domain/types";
import { SlabCard } from "./SlabCard";

export function TopItemsGallery({ items }: { items: TopItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const haptics = useHaptics();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openIndex !== null && !dialog.open) dialog.showModal();
    if (openIndex === null && dialog.open) dialog.close();
  }, [openIndex]);

  const current = openIndex === null ? null : items[openIndex];
  const move = (delta: number) => {
    haptics.fire("select");
    setOpenIndex((index) => (index === null ? null : (index + delta + items.length) % items.length));
  };

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {items.map((item, index) => (
          <li key={item.id} className="min-w-0">
            <button
              type="button"
              onClick={() => {
                haptics.fire("tap");
                setOpenIndex(index);
              }}
              className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-control text-left outline-none transition-colors hover:border-control-border focus-visible:ring-2 focus-visible:ring-brand/70"
            >
              <SlabCard
                name={item.name}
                grade={item.grade}
                grader={item.grader}
                imageSrc={item.imageSrc}
                className="rounded-none"
              />
              <span className="flex flex-col gap-2 p-2.5">
                {/* Fixed two-line name keeps every tile the same height across rows. */}
                <span className="line-clamp-2 h-[2.6em] text-[11px] leading-[1.3] text-fg">{item.name}</span>
                <span className="flex items-baseline gap-1 whitespace-nowrap border-t border-border pt-2 text-[11px]">
                  <span className="text-fg-secondary">FMV</span>
                  <span className="min-w-0 truncate text-[13px] font-bold text-fg">
                    {money(item.fmv)}
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setOpenIndex(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpenIndex(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") move(1);
          if (event.key === "ArrowLeft") move(-1);
        }}
        className="m-auto w-[min(92vw,600px)] rounded-panel border border-border bg-panel p-0 text-fg shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        aria-label="Item preview"
      >
        {current ? (
          <div className="relative p-4 sm:p-8">
            <IconButton label="Close" className="absolute right-2 top-2" onClick={() => setOpenIndex(null)}>
              <X className="size-5" />
            </IconButton>
            <HexPanel className="mx-auto max-w-[520px]">
              <SlabCard
                name={current.name}
                grade={current.grade}
                grader={current.grader}
                imageSrc={current.imageSrc}
                sizes="(min-width: 640px) 520px, 92vw"
                priority
              />
            </HexPanel>
            <h3 className="mt-4 text-center text-lg font-semibold">{current.name}</h3>
            <p className="mt-2 flex justify-center">
              <span className="rounded-full border border-border bg-control px-3 py-1 text-xs text-fg-secondary">
                Fair Market Value: <span className="text-fg">{money(current.fmv, { cents: true })}</span>
              </span>
            </p>
            {items.length > 1 ? (
              <>
                <IconButton
                  label="Previous item"
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50"
                  onClick={() => move(-1)}
                >
                  <ChevronLeft className="size-6" />
                </IconButton>
                <IconButton
                  label="Next item"
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50"
                  onClick={() => move(1)}
                >
                  <ChevronRight className="size-6" />
                </IconButton>
              </>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}
