"use client";

import { Wallet } from "lucide-react";
import { Money } from "@/components/ui/Money";

/** Server passes the cookie-backed balance; it animates whenever an action re-renders the route. */
export function WalletChip({ balance }: { balance: number }) {
  return (
    <div
      className="flex h-10 items-center gap-2 rounded-control border border-border bg-control px-3 text-sm font-medium text-fg"
      aria-label="Beezie wallet balance"
    >
      <Wallet className="size-4 text-fg-secondary" aria-hidden />
      <Money value={balance} />
    </div>
  );
}
