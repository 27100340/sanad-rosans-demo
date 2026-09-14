"use client";

import { useState } from "react";
import { Activity, CalendarClock, History, Radio } from "lucide-react";
import { Chip, type Tone } from "@/components/ui/primitives";
import type { ActivityItem } from "@/lib/data/student-detail";

type Tab = "past" | "present" | "future";

const KIND_TONE: Record<ActivityItem["kind"], Tone> = {
  practice: "accent",
  attendance: "ok",
  result: "gold",
  submission: "accent",
  assignment: "warn",
  lesson: "neutral",
  test: "info",
  task: "accent",
  tarbiyah: "gold",
};

const EMPTY: Record<Tab, string> = {
  past: "No past activity recorded yet.",
  present: "Nothing in progress right now.",
  future: "No upcoming lessons, tests or deadlines.",
};

export function ActivityTimeline({ data, when }: { data: Record<Tab, ActivityItem[]>; when: Record<Tab, string[]> }) {
  const [tab, setTab] = useState<Tab>("present");
  const tabs: [Tab, string, React.ReactNode][] = [
    ["past", "Past", <History key="p" size={13} />],
    ["present", "Present", <Radio key="n" size={13} />],
    ["future", "Future", <CalendarClock key="f" size={13} />],
  ];
  const items = data[tab];
  return (
    <section className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">
          <Activity size={13} className="text-accent" /> Activity
        </h2>
        <div className="flex gap-1">
          {tabs.map(([v, l, icon]) => (
            <button key={v} type="button" onClick={() => setTab(v)} className={tab === v ? "btn-soft btn-sm" : "btn-ghost btn-sm"}>
              {icon} {l} ({data[v].length})
            </button>
          ))}
        </div>
      </div>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={`${it.kind}-${i}`} className="flex items-start gap-3 rounded-lg bg-surface-2 px-3 py-2">
              <Chip tone={KIND_TONE[it.kind]} className="mt-0.5 w-24 shrink-0 justify-center capitalize">{it.kind}</Chip>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-ink">{it.title}</p>
                <p className="truncate text-2xs text-ink-3">{it.detail}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-2xs text-ink-3">{when[tab][i]}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-ink-3">{EMPTY[tab]}</p>
      )}
    </section>
  );
}
