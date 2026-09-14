import Link from "next/link";
import type { HifzUnit } from "@/lib/domain/types";
import { classifyUnit, retention } from "@/lib/domain/srs";
import { Chip } from "@/components/ui/primitives";
import { pct } from "@/lib/utils";
import { KIND_LABEL, KIND_TONE, STATUS_TONE, fmtDue, unitLabel } from "./derive";

function retentionTone(value: number) {
  return value >= 0.8 ? "text-ok" : value >= 0.6 ? "text-warn" : "text-danger";
}

/** Status, SRS state, and retention for each unit. Stacks to cards below sm. */
export function UnitTable({ units, today, reciteLinks = false }: { units: HifzUnit[]; today: string; reciteLinks?: boolean }) {
  const rows = [...units].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Status</th>
              <th>Kind</th>
              <th className="text-right">Ease</th>
              <th className="text-right">Interval</th>
              <th>Next due</th>
              <th className="text-right">Retention</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const r = retention(u, today);
              return (
                <tr key={u.id}>
                  <td className="font-medium">
                    {reciteLinks ? (
                      <Link href={`/portal/hifz/recite?unit=${u.id}`} className="hover:text-accent">
                        {unitLabel(u)}
                      </Link>
                    ) : (
                      unitLabel(u)
                    )}
                  </td>
                  <td>
                    <Chip tone={STATUS_TONE[u.status]}>{u.status}</Chip>
                  </td>
                  <td>
                    <Chip tone={KIND_TONE[classifyUnit(u, today)]}>{KIND_LABEL[classifyUnit(u, today)]}</Chip>
                  </td>
                  <td className="num text-right">{u.ease.toFixed(1)}</td>
                  <td className="num text-right">{u.intervalDays}d</td>
                  <td className="text-ink-2">{fmtDue(u.dueDate, today)}</td>
                  <td className={`num text-right font-medium ${retentionTone(r)}`}>{pct(r * 100)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 sm:hidden">
        {rows.map((u) => {
          const r = retention(u, today);
          return (
            <li key={u.id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink">{unitLabel(u)}</p>
                <Chip tone={STATUS_TONE[u.status]}>{u.status}</Chip>
              </div>
              <p className="num mt-1 text-xs text-ink-3">
                {KIND_LABEL[classifyUnit(u, today)]} · ease {u.ease.toFixed(1)} · {u.intervalDays}d · {fmtDue(u.dueDate, today)} ·{" "}
                <span className={`font-medium ${retentionTone(r)}`}>{pct(r * 100)}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
