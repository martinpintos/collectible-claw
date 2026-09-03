import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-1.5 text-brand", className)}
      aria-label="Beezie home"
    >
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden fill="currentColor">
        <path d="M12 2.2 20.5 7v10L12 21.8 3.5 17V7L12 2.2Zm0 2.3L5.5 8.2v7.6L12 19.5l6.5-3.7V8.2L12 4.5Z" />
        <path d="M12 7.4 16 9.7v4.6L12 16.6 8 14.3V9.7l4-2.3Z" opacity="0.9" />
      </svg>
      {!compact ? <span className="text-2xl font-bold tracking-tight">beezie</span> : null}
    </Link>
  );
}
