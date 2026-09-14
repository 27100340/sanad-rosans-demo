import { Progress, Trend } from "@/components/ui/primitives";
import { masteryTone } from "@/components/teach/helpers";

export interface MasteryItem {
  code: string;
  title: string;
  value: number;
  trend?: number;
}

export function MasteryList({ items }: { items: MasteryItem[] }) {
  return (
    <div className="card divide-y divide-line">
      {items.map((m) => (
        <div key={m.code} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-medium text-ink">
              <span className="num mr-2 text-2xs font-semibold uppercase text-ink-3">{m.code}</span>
              {m.title}
            </p>
            <p className="num shrink-0 text-sm font-semibold text-ink">
              {m.value}%{m.trend !== undefined ? <Trend value={m.trend} suffix="" invert={false} /> : null}
            </p>
          </div>
          <Progress value={m.value} tone={masteryTone(m.value)} className="mt-2" />
        </div>
      ))}
    </div>
  );
}

export function TrendBars({ weeks, marks }: { weeks: string[]; marks: number[] }) {
  const max = Math.max(...marks, 1);
  const min = Math.min(...marks, max - 1);
  return (
    <div className="card p-5">
      <div className="flex h-28 items-end gap-2">
        {marks.map((m, i) => {
          const height = 30 + ((m - min) / Math.max(1, max - min)) * 70;
          return (
            <div key={weeks[i]} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="num text-2xs text-ink-3">{m}</span>
              <div className={i === marks.length - 1 ? "w-full rounded-t-md bg-accent" : "w-full rounded-t-md bg-accent/35"} style={{ height: `${height}%` }} />
              <span className="num text-2xs text-ink-3">{weeks[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
