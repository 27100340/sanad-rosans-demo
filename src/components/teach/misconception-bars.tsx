import { Progress } from "@/components/ui/primitives";
import type { SubjectSpace } from "@/lib/domain/types";
import { humanTag } from "./helpers";

export function MisconceptionBars({ items }: { items: SubjectSpace["misconceptions"] }) {
  const top = [...items].sort((a, b) => b.count - a.count).slice(0, 5);
  const max = top[0]?.count ?? 1;
  if (!top.length) return <p className="text-sm text-ink-3">No misconceptions recorded yet.</p>;
  return (
    <div className="card divide-y divide-line">
      {top.map((m, i) => (
        <div key={m.tag} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium capitalize text-ink">
              <span className="num mr-2 text-ink-3">{i + 1}.</span>
              {humanTag(m.tag)}
            </p>
            <p className="num text-sm font-semibold text-ink">{m.count}</p>
          </div>
          <Progress value={(m.count / max) * 100} tone={i === 0 ? "danger" : i === 1 ? "warn" : "accent"} className="mt-2" />
          <p className="mt-2 font-mono text-xs text-ink-3">{m.example}</p>
        </div>
      ))}
    </div>
  );
}
