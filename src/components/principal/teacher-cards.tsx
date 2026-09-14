"use client";

import { useState } from "react";
import { Avatar, Card, Chip, KeyValue, type Tone } from "@/components/ui/primitives";

export interface TeacherCardRow {
  id: string;
  name: string;
  tone: Tone;
  subjects: string[];
  spaces: { id: string; label: string }[];
  backlog: number;
  periods: number;
  pending: number;
}

const HEAVY_BACKLOG = 10;

/** One card per teacher. "Approve" clears pending resource approvals in local state only. */
export function TeacherCards({ rows }: { rows: TeacherCardRow[] }) {
  const [approved, setApproved] = useState<Record<string, number>>({});
  const pendingFor = (t: TeacherCardRow) => Math.max(0, t.pending - (approved[t.id] ?? 0));
  const approve = (t: TeacherCardRow) => setApproved((a) => ({ ...a, [t.id]: (a[t.id] ?? 0) + 1 }));

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((t) => {
        const pending = pendingFor(t);
        return (
          <Card key={t.id} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={t.name} tone={t.tone} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
                <p className="truncate text-xs text-ink-3">{t.subjects.join(", ")}</p>
              </div>
            </div>
            <KeyValue
              items={[
                { k: "Periods / week", v: t.periods },
                { k: "Marking backlog", v: <span className={t.backlog >= HEAVY_BACKLOG ? "text-warn" : undefined}>{t.backlog}</span> },
                { k: "Approvals pending", v: pending },
              ]}
            />
            <div className="flex min-h-6 flex-wrap gap-1.5">
              {t.spaces.length ? t.spaces.map((s) => <Chip key={s.id} tone="accent">{s.label}</Chip>) : <Chip tone="gold">Halaqa</Chip>}
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="text-xs text-ink-3">{pending ? `${pending} resource${pending > 1 ? "s" : ""} awaiting approval` : "Nothing awaiting approval"}</span>
              <button type="button" className="btn-soft btn-sm" onClick={() => approve(t)} disabled={pending === 0}>
                Approve
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
