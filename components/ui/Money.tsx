"use client";

import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils/cn";

const wholeFormat = {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
} as const;
const centsFormat = {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

export function Money({
  value,
  cents,
  className,
}: {
  value: number;
  cents?: boolean;
  className?: string;
}) {
  const useCents = cents ?? !Number.isInteger(value);
  return (
    <NumberFlow
      value={value}
      locales="en-US"
      format={useCents ? centsFormat : wholeFormat}
      className={cn("tabular-nums", className)}
    />
  );
}

export function Points({ value, className }: { value: number; className?: string }) {
  return (
    <NumberFlow
      value={value}
      locales="en-US"
      prefix="+"
      suffix={value === 1 ? " point" : " points"}
      className={cn("tabular-nums", className)}
    />
  );
}
