"use client";

import { useState } from "react";
import { MessageSquareText, UserPlus } from "lucide-react";
import { Avatar, Card, Chip, type Tone } from "@/components/ui/primitives";
import type { RiskFlag, RiskLevel } from "@/lib/domain/types";

export interface RiskListRow {
  flag: RiskFlag;
  studentName: string;
  className: string;
  ownerName: string;
  note?: string;
}

const LEVEL_TONE: Record<RiskLevel, Tone> = { high: "danger", medium: "warn", watch: "neutral" };
const LEVEL_LABEL: Record<RiskLevel, string> = { high: "High", medium: "Medium", watch: "Watch" };

type Action = "parent" | "mentor";
const CONFIRMATION: Record<Action, (row: RiskListRow) => string> = {
  parent: (r) => `Message to ${r.studentName.split(" ")[0]}'s parent queued via ${r.ownerName}.`,
  mentor: (r) => `${r.ownerName} assigned as mentor for ${r.studentName.split(" ")[0]}.`,
};

/** Ranked early-warning list. Buttons only confirm inline; nothing is sent in the demo. */
export function RiskList({ rows }: { rows: RiskListRow[] }) {
  const [done, setDone] = useState<Record<string, string>>({});
  const act = (row: RiskListRow, action: Action) => setDone((d) => ({ ...d, [row.flag.studentId]: CONFIRMATION[action](row) }));

  return (
    <ul className="space-y-4">
      {rows.map((row, i) => {
        const { flag } = row;
        const confirmation = done[flag.studentId];
        return (
          <li key={flag.studentId}>
            <Card className="space-y-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="num w-6 shrink-0 pt-2 text-right text-xs text-ink-3">{i + 1}</span>
                <Avatar name={row.studentName} tone={LEVEL_TONE[flag.level]} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{row.studentName}</p>
                    <Chip tone={LEVEL_TONE[flag.level]}>{LEVEL_LABEL[flag.level]}</Chip>
                    <span className="num text-xs text-ink-3">score {flag.score}</span>
                  </div>
                  <p className="text-xs text-ink-3">
                    {row.className} · owner {row.ownerName}
                  </p>
                </div>
              </div>
              {row.note ? <p className="rounded-xl bg-accent-soft/60 px-4 py-3 text-sm leading-6 text-ink">{row.note}</p> : null}
              <ul className="flex flex-wrap gap-2">
                {flag.reasons.map((r) => (
                  <li key={r} className="chip-neutral font-medium">
                    {r}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <button type="button" className="btn-soft btn-sm" onClick={() => act(row, "parent")} disabled={Boolean(confirmation)}>
                  <MessageSquareText size={14} />
                  Message parent
                </button>
                <button type="button" className="btn-outline btn-sm" onClick={() => act(row, "mentor")} disabled={Boolean(confirmation)}>
                  <UserPlus size={14} />
                  Assign mentor
                </button>
                {confirmation ? <span className="text-xs text-ok animate-fade-in">{confirmation}</span> : null}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
