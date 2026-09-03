import type { Metadata } from "next";
import { MachinePage } from "@/components/claw/MachinePage";
import { MACHINES, findMachine } from "@/lib/data/machines";

/** Unknown slugs 404 instead of rendering; the four machines are the allow-list. */
export const dynamicParams = false;

export function generateStaticParams() {
  return MACHINES.map((machine) => ({ slug: machine.slug }));
}

export async function generateMetadata({ params }: PageProps<"/claw/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const machine = findMachine(slug);
  return machine
    ? { title: machine.name, description: machine.description }
    : { title: "Machine not found" };
}

export default async function ClawMachinePage({ params }: PageProps<"/claw/[slug]">) {
  const { slug } = await params;
  return <MachinePage slug={slug} />;
}
