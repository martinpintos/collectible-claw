import { Info } from "lucide-react";
import { money } from "@/lib/domain/format";
import { tiersInOrder } from "@/lib/domain/odds";
import type { RarityTier } from "@/lib/domain/types";
import { TierChip } from "./TierChip";

export function OddsTable({ tiers, averageValue }: { tiers: RarityTier[]; averageValue: number }) {
  return (
    <section aria-labelledby="odds-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 id="odds-heading" className="flex items-center gap-1.5 text-lg font-semibold text-white">
            Odds
            <span title="Odds are published per machine and update as inventory changes." className="text-fg-secondary">
              <Info className="size-3.5" aria-hidden />
              <span className="sr-only">Odds are published per machine and update as inventory changes.</span>
            </span>
          </h3>
          <p className="text-xs text-fg-secondary">Updates every few seconds.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-fg-secondary">Average Value:</div>
          <div className="text-2xl font-semibold leading-tight text-positive">{money(averageValue)}</div>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2" aria-label="Odds by rarity">
        {tiersInOrder(tiers).map((tier) => (
          <li key={tier.id} className="contents">
            <TierChip tier={tier} />
          </li>
        ))}
      </ul>
    </section>
  );
}
