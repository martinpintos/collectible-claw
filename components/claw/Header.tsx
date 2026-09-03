import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { WalletSnapshot } from "@/lib/domain/types";
import { Logo } from "./Logo";
import { WalletChip } from "./WalletChip";

const NAV = ["Marketplace", "Leaderboard", "Resources", "More"];

export function Header({ wallet }: { wallet: WalletSnapshot }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 w-full max-w-[1380px] items-center px-4 sm:px-6 lg:px-8">
        <div className="shrink-0">
          {/* Mobile shows the hexagon mark only, matching the mobile frame. */}
          <Logo compact className="md:hidden" />
          <Logo className="hidden md:flex" />
        </div>
        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[15px] font-medium md:flex"
        >
          <span className="text-fg-secondary/80">{NAV[0]}</span>
          <Link href="/" className="flex items-center gap-1.5 text-brand" aria-current="page">
            <Sparkles className="size-4" aria-hidden />
            Claw
          </Link>
          {NAV.slice(1).map((label) => (
            <span key={label} className="text-fg-secondary/80">
              {label}
            </span>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <WalletChip balance={wallet.balance} />
          <div
            aria-label="Account"
            className="size-10 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ff8a80,#8e24aa_60%,#1a1a1a)] ring-2 ring-border"
          />
        </div>
      </div>
    </header>
  );
}
