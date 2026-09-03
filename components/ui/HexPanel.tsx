import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** White hex-pattern surface the slab photos sit on. */
export function HexPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bg-hex overflow-hidden rounded-xl", className)}>{children}</div>;
}
