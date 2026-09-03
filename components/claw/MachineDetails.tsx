import { money, pointsLabel } from "@/lib/domain/format";
import type { Machine } from "@/lib/domain/types";
import { MoreMachines } from "./MoreMachines";
import { OddsTable } from "./OddsTable";
import { PromoCode } from "./PromoCode";
import { PurchasePanel } from "./PurchasePanel";

export function MachineDetails({
  machine,
  machines,
  averageValue,
}: {
  machine: Machine;
  machines: Machine[];
  averageValue: number;
}) {
  return (
    <section aria-labelledby="machine-heading" className="panel flex min-w-0 flex-col gap-5 p-4">
      <div>
        <h1 id="machine-heading" className="text-2xl font-semibold leading-tight text-fg">
          {machine.name}
        </h1>
        {/* The description is desktop-only; the mobile frame leads straight with the price. */}
        <p className="mt-1.5 hidden text-sm text-fg-secondary lg:block">{machine.description}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[32px] font-bold leading-none tracking-tight text-fg">
          {money(machine.price)}
        </span>
        <span className="text-sm font-bold leading-none text-brand">
          {pointsLabel(machine.pointsPerPull)}
        </span>
      </div>

      <PurchasePanel />
      <PromoCode />

      <hr className="border-border" />
      <OddsTable tiers={machine.tiers} averageValue={averageValue} />

      <hr className="border-border" />
      <MoreMachines machines={machines} current={machine} />
    </section>
  );
}
