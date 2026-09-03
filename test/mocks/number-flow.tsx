/** Plain-text stand-in for @number-flow/react (web components are not available in jsdom). */
export default function NumberFlow({
  value,
  prefix = "",
  suffix = "",
  format,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  format?: Intl.NumberFormatOptions;
  className?: string;
}) {
  return (
    <span className={className}>
      {prefix}
      {new Intl.NumberFormat("en-US", format).format(value)}
      {suffix}
    </span>
  );
}
