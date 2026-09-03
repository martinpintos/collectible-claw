import type { CSSProperties } from "react";
import { TIER_COLOR_VAR, TIER_LABEL } from "@/lib/domain/tier-style";
import type { TierId } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";

export function TierBadge({ tier, className }: { tier: TierId; className?: string }) {
  const color = TIER_COLOR_VAR[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        className,
      )}
      style={
        {
          color,
          borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
        } as CSSProperties
      }
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {TIER_LABEL[tier]}
    </span>
  );
}
