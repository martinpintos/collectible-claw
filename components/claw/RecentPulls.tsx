import { Skeleton } from "@/components/ui/Skeleton";
import { getRecentPulls } from "@/lib/data/repository";
import { money } from "@/lib/domain/format";
import { SlabCard } from "./SlabCard";

export async function RecentPulls() {
  const pulls = await getRecentPulls(12);
  return (
    <ul className="space-y-3">
      {pulls.map((pull) => (
        <li
          key={pull.id}
          className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-control p-2.5 pr-3 sm:gap-4 sm:pr-4"
        >
          <div className="w-14 shrink-0 overflow-hidden rounded-lg">
            <SlabCard name={pull.itemName} grade="" imageSrc={pull.imageSrc} sizes="56px" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-fg">{pull.itemName}</p>
            <p className="text-sm text-fg-secondary">{pull.user}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] text-fg-secondary">~FMV</div>
            <div className="text-lg font-semibold leading-tight text-fg">{money(pull.price)}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function RecentPullsSkeleton() {
  return (
    <div className="space-y-3" aria-busy>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-[76px] rounded-xl" />
      ))}
    </div>
  );
}
