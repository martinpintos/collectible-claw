import Image from "next/image";
import Link from "next/link";
import { DEFAULT_MACHINE_SLUG } from "@/lib/data/machines";
import { money } from "@/lib/domain/format";
import type { Machine } from "@/lib/domain/types";

export function machineHref(slug: string): string {
  return slug === DEFAULT_MACHINE_SLUG ? "/" : `/claw/${slug}`;
}

export function MoreMachines({ machines, current }: { machines: Machine[]; current: Machine }) {
  const others = machines.filter((m) => m.slug !== current.slug).slice(0, 3);
  return (
    <section aria-labelledby="more-machines-heading">
      <h3 id="more-machines-heading" className="text-lg font-semibold text-white">
        More Claw Machines
      </h3>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {others.map((machine) => (
          <li key={machine.slug}>
            <Link
              href={machineHref(machine.slug)}
              className="flex h-[104px] flex-col items-center justify-center gap-1 rounded-control border border-control-border bg-control text-center transition-colors hover:border-brand/60"
            >
              <Image
                src={machine.media.icon}
                alt=""
                width={40}
                height={40}
                className="size-10 object-contain drop-shadow-lg"
              />
              <span className="text-base font-semibold leading-tight text-fg">{money(machine.price)}</span>
              <span className="text-xs text-fg-secondary">{machine.shortName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
