import type { CSSProperties } from "react";
import { formatOdds } from "@/lib/domain/odds";
import { valueRange } from "@/lib/domain/format";
import { TIER_LINE_VAR, TIER_TEXT_CLASS } from "@/lib/domain/tier-style";
import type { RarityTier } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";

export function TierChip({ tier }: { tier: RarityTier }) {
  const line = TIER_LINE_VAR[tier.id];
  return (
    <div
      className="relative min-w-0 overflow-hidden rounded-chip bg-chip px-2 py-1.5 sm:px-2.5 sm:py-2"
      style={
        {
          borderLeft: `1px solid ${line}`,
          backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${line} 9%, transparent), transparent)`,
        } as CSSProperties
      }
    >
      <div className={cn("flex items-baseline gap-1 text-[11px] font-medium sm:text-xs", TIER_TEXT_CLASS[tier.id])}>
        <span className="min-w-0 flex-1 truncate">{tier.label}</span>
        <span className="shrink-0 tabular-nums">{formatOdds(tier.oddsBps)}</span>
      </div>
      <div className="mt-0.5 truncate text-[10px] text-fg-secondary sm:text-[11px]">{valueRange(tier.minValue, tier.maxValue)}</div>
    </div>
  );
}
