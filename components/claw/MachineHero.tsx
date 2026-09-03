import type { Machine } from "@/lib/domain/types";
import { MachineStage } from "./MachineStage";

export function MachineHero({ machine }: { machine: Machine }) {
  return (
    <section aria-label={`${machine.name} machine`} className="panel min-w-0 overflow-hidden lg:flex lg:flex-col">
      <MachineStage media={machine.media} name={machine.name} />
    </section>
  );
}
