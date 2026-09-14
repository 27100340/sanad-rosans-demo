import { cn } from "@/lib/utils";

/**
 * Tiny inline-SVG sparkline. Stroke follows `currentColor`, so the caller
 * sets the tone with a text colour class. Scales to its container width.
 */
export function Sparkline({
  values,
  className,
  height = 36,
  width = 120,
  label,
}: {
  values: number[];
  className?: string;
  height?: number;
  width?: number;
  label?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;
  const step = (width - pad * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (height - pad * 2) * (1 - (v - min) / span);
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${path} L${points[points.length - 1][0].toFixed(1)} ${height} L${pad} ${height} Z`;
  const [lastX, lastY] = points[points.length - 1];
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("block h-9 w-full", className)}
      role="img"
      aria-label={label ?? "trend"}
    >
      <path d={area} fill="currentColor" fillOpacity={0.08} stroke="none" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lastX} cy={lastY} r={2.25} fill="currentColor" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
