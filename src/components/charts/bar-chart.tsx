import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
}

/**
 * Horizontal bar chart drawn with one inline SVG per row so labels stay
 * real text. Handles negative values by drawing from a zero line. The bar
 * colour follows `currentColor`; highlight the max/min with tones.
 */
export function BarChart({
  bars,
  unit = "",
  title,
  className,
  highlight = "max",
}: {
  bars: BarDatum[];
  unit?: string;
  title?: string;
  className?: string;
  highlight?: "max" | "min" | "none";
}) {
  if (bars.length === 0) return null;
  const values = bars.map((b) => b.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const zero = ((0 - min) / span) * 100;
  const target = highlight === "max" ? Math.max(...values) : highlight === "min" ? Math.min(...values) : null;
  const fmt = (n: number) => `${n > 0 && min < 0 ? "+" : ""}${Number.isInteger(n) ? n : n.toFixed(1)}${unit}`;
  return (
    <figure className={cn("space-y-2", className)}>
      {title ? <figcaption className="text-xs font-medium text-ink-3">{title}</figcaption> : null}
      <ul className="space-y-1.5">
        {bars.map((b) => {
          const start = b.value >= 0 ? zero : ((b.value - min) / span) * 100;
          const width = (Math.abs(b.value) / span) * 100;
          const isTarget = target !== null && b.value === target;
          const tone = isTarget ? (b.value < 0 ? "text-danger" : "text-accent") : "text-ink-3";
          return (
            <li key={b.label} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-xs sm:grid-cols-[minmax(0,10rem)_1fr_auto]">
              <span className="truncate text-ink-2">{b.label}</span>
              <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={cn("h-2.5 w-full", tone)} aria-hidden="true">
                <rect x={0} y={0} width={100} height={8} fill="currentColor" fillOpacity={0.08} rx={1} />
                <rect x={start} y={0} width={width} height={8} fill="currentColor" rx={1} />
                {min < 0 ? <rect x={zero - 0.25} y={0} width={0.5} height={8} fill="currentColor" fillOpacity={0.5} /> : null}
              </svg>
              <span className={cn("num w-14 text-right font-medium", isTarget ? "text-ink" : "text-ink-2")}>{fmt(b.value)}</span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
