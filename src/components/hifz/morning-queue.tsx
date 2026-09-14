"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Headphones } from "lucide-react";
import { Chip } from "@/components/ui/primitives";
import { scoreTone } from "./derive";

export interface MorningQueueItem {
  id: string;
  studentId: string;
  name: string;
  unitLabel: string;
  score: number;
  passed: boolean;
  omitted: number;
  substituted: number;
  note?: string;
}

type Decision = "confirmed" | "re-hear";

/** Overnight home recitations, checked already; the ustadh confirms or asks to hear it again. */
export function MorningQueue({ items }: { items: MorningQueueItem[] }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const decide = (id: string, d: Decision) => setDecisions((prev) => ({ ...prev, [id]: d }));
  return (
    <ul className="divide-y divide-line">
      {items.map((it) => {
        const d = decisions[it.id];
        return (
          <li key={it.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">
                <Link href={`/portal/hifz/ustadh/${it.studentId}`} className="hover:text-accent">
                  {it.name}
                </Link>{" "}
                <span className="text-ink-3">· {it.unitLabel}</span>
              </p>
              <p className="num mt-0.5 text-xs text-ink-3">
                {it.omitted} omitted · {it.substituted} substituted{it.note ? ` · ${it.note}` : ""}
              </p>
            </div>
            <Chip tone={scoreTone(it.score)}>{it.score}%</Chip>
            {d ? (
              <Chip tone={d === "confirmed" ? "ok" : "warn"}>{d === "confirmed" ? "Confirmed" : "Re-hear in class"}</Chip>
            ) : (
              <span className="inline-flex gap-1">
                <button type="button" onClick={() => decide(it.id, "confirmed")} className="btn-soft btn-sm">
                  <Check size={13} /> Confirm
                </button>
                <button type="button" onClick={() => decide(it.id, "re-hear")} className="btn-outline btn-sm">
                  <Headphones size={13} /> Re-hear
                </button>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
