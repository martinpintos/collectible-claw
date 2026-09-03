import { Skeleton } from "@/components/ui/Skeleton";
import { getTopItems } from "@/lib/data/repository";
import type { Machine } from "@/lib/domain/types";
import { TopItemsGallery } from "./TopItemsGallery";

export async function TopItems({ machine }: { machine: Machine }) {
  const items = await getTopItems(machine);
  return <TopItemsGallery items={items} />;
}

export function TopItemsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3" aria-busy>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
      ))}
    </div>
  );
}
