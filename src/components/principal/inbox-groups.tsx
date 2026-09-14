"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { relativeDay } from "@/components/leadership/format";
import { AiPill, Card, Chip, SectionTitle, type Tone } from "@/components/ui/primitives";
import type { Triage, TriageResult } from "@/lib/ai/triage";

export interface InboxRow {
  id: string;
  guardianName: string;
  studentNames: string[];
  date: string;
  text: string;
  triage: Triage;
  language: "en" | "ur";
}

const ORDER: Triage[] = ["urgent", "routine", "praise"];
const TONE: Record<Triage, Tone> = { urgent: "danger", routine: "info", praise: "ok" };
const LABEL: Record<Triage, string> = { urgent: "Urgent", routine: "Routine", praise: "Praise" };

type Draft = { reply: string; live: boolean };

/** Parent messages grouped by AI triage. "Draft reply" asks the triage route for a suggested reply. */
export function InboxGroups({ rows }: { rows: InboxRow[] }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function draft(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/ai/triage", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messageId: id }) });
      const json = (await res.json()) as TriageResult | { error: string };
      if (res.ok && "reply" in json) setDrafts((d) => ({ ...d, [id]: { reply: json.reply, live: json.live } }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      {ORDER.map((triage) => {
        const group = rows.filter((r) => r.triage === triage);
        if (!group.length) return null;
        return (
          <section key={triage}>
            <SectionTitle title={<span className="flex items-center gap-2">{LABEL[triage]} <Chip tone={TONE[triage]}>{group.length}</Chip></span>} />
            <ul className="space-y-4">
              {group.map((m) => {
                const d = drafts[m.id];
                return (
                  <li key={m.id}>
                    <Card className="space-y-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">
                          {m.guardianName} <span className="font-normal text-ink-3">· {m.studentNames.join(", ")}</span>
                        </p>
                        <span className="text-xs text-ink-3">{relativeDay(m.date)}</span>
                      </div>
                      <p className="text-sm leading-6 text-ink-2">{m.text}</p>
                      {d ? (
                        <div className="space-y-2 border-t border-line pt-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-ink-3">Suggested reply{m.language === "ur" ? " · Urdu preferred" : ""}</p>
                            <AiPill live={d.live} />
                          </div>
                          <textarea className={`input min-h-28 ${m.language === "ur" && d.live ? "urdu" : ""}`} defaultValue={d.reply} />
                          <div className="flex gap-2">
                            <button type="button" className="btn-primary btn-sm">Send</button>
                            <button type="button" className="btn-ghost btn-sm" onClick={() => void draft(m.id)} disabled={busy === m.id}>Redraft</button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-line pt-3">
                          <button type="button" className="btn-soft btn-sm" onClick={() => void draft(m.id)} disabled={busy === m.id}>
                            <PenLine size={14} />
                            {busy === m.id ? "Drafting" : "Draft reply"}
                          </button>
                        </div>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
