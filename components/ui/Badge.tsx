import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: ReactNode;
  tone?: "brand" | "neutral" | "positive";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        tone === "brand" && "bg-brand text-brand-fg",
        tone === "neutral" && "bg-control text-fg-secondary border border-border",
        tone === "positive" && "bg-positive/15 text-positive",
        className,
      )}
    >
      {children}
    </span>
  );
}
