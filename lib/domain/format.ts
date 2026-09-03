const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$14,200" for whole amounts, "$42.30" when cents are present (or forced). */
export function money(value: number, options?: { cents?: boolean }): string {
  const wantsCents = options?.cents ?? !Number.isInteger(value);
  return (wantsCents ? usdCents : usdWhole).format(value);
}

export function pointsLabel(points: number): string {
  return `+${points.toLocaleString("en-US")} ${points === 1 ? "point" : "points"}`;
}

/** "14 min 29 sec" — clamps at zero. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} min ${seconds} sec`;
}

export function valueRange(min: number, max: number | null): string {
  return max === null ? `${money(min)}+` : `${money(min)} - ${money(max)}`;
}
