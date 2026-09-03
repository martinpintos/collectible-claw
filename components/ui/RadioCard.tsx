"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function RadioCard({
  checked,
  disabled,
  onSelect,
  title,
  description,
  name,
}: {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: ReactNode;
  description: ReactNode;
  name: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-control border bg-control p-3 transition-colors",
        checked ? "border-brand" : "border-border hover:border-control-border",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <input
        type="radio"
        name={name}
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
      />
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          checked ? "border-brand" : "border-fg-secondary",
        )}
      >
        <span className={cn("size-2 rounded-full bg-brand transition-transform", checked ? "scale-100" : "scale-0")} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-fg">{title}</span>
        <span className="block text-sm text-fg-secondary">{description}</span>
      </span>
    </label>
  );
}
