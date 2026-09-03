import Link from "next/link";
import { Logo } from "@/components/claw/Logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <Logo />
      <div>
        <h1 className="text-2xl font-semibold">That machine isn&apos;t on the floor.</h1>
        <p className="mt-2 text-fg-secondary">Pick one of the live claws instead.</p>
      </div>
      <Link href="/" className="rounded-input bg-brand px-5 py-3 font-semibold text-brand-fg">
        Back to the Claw
      </Link>
    </main>
  );
}
