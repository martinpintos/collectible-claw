"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  label,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  label: string;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid h-12 rounded-control border border-border bg-control p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative rounded-[8px] text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/70",
              active ? "text-brand-fg" : "text-fg hover:text-white",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`${id}-thumb`}
                className="absolute inset-0 rounded-[8px] bg-brand"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
