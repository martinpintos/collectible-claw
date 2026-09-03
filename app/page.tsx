import type { Metadata } from "next";
import { MachinePage } from "@/components/claw/MachinePage";
import { DEFAULT_MACHINE_SLUG, findMachine } from "@/lib/data/machines";

const machine = findMachine(DEFAULT_MACHINE_SLUG)!;

export const metadata: Metadata = {
  title: `${machine.name} · Beezie Claw`,
  description: machine.description,
};

export default function HomePage() {
  return <MachinePage slug={DEFAULT_MACHINE_SLUG} />;
}
