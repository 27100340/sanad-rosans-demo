"use client";

import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { Chip } from "@/components/ui/primitives";
import type { MarkPoint, Submission } from "@/lib/domain/types";
import { SUBMISSION_STATUS } from "./helpers";

export type SubmissionRow = Submission & { studentName: string };

interface MarkResponse {
  awarded: number;
  points: MarkPoint[];
  feedback: string;
  live: boolean;
}

function PointLine({ point }: { point: MarkPoint }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <span className={point.earned ? "mt-0.5 text-ok" : "mt-0.5 text-danger"}>{point.earned ? <Check size={13} /> : <X size={13} />}</span>
      <span className="min-w-0">
        <span className="font-medium text-ink">{point.label}</span>
        <span className="text-ink-3"> · {point.evidence}</span>
      </span>
    </li>
  );
}

function SubmissionCard({
  row,
  maxMarks,
  busy,
  onMark,
  onApprove,
  onAwarded,
}: {
  row: SubmissionRow;
  maxMarks: number;
  busy: boolean;
  onMark: () => void;
  onApprove: () => void;
  onAwarded: (n: number) => void;
}) {
  const status = SUBMISSION_STATUS[row.status];
  const marked = row.status !== "pending";
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink">{row.studentName}</p>
          <Chip tone={status.tone}>{status.label}</Chip>
        </div>
        {marked ? (
          <label className="flex items-center gap-2 text-xs text-ink-3">
            Awarded
            <input
              type="number"
              min={0}
              max={maxMarks}
              value={row.awarded ?? 0}
              disabled={row.status === "teacher-approved"}
              onChange={(e) => onAwarded(Math.max(0, Math.min(maxMarks, Number(e.target.value))))}
              className="input num w-16 py-1 text-center text-sm"
            />
            <span className="num">/ {maxMarks}</span>
          </label>
        ) : null}
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 font-mono text-xs leading-relaxed text-ink">{row.answer}</pre>
      {row.points?.length ? (
        <ul className="mt-3 space-y-1.5">
          {row.points.map((p, i) => (
            <PointLine key={i} point={p} />
          ))}
        </ul>
      ) : null}
      {row.feedback ? <p className="mt-3 border-l-2 border-accent pl-3 text-xs text-ink-2">{row.feedback}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {row.status === "pending" ? (
          <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={onMark}>
            <Sparkles size={14} />
            {busy ? "Marking" : "Mark with AI"}
          </button>
        ) : null}
        {row.status === "ai-marked" ? (
          <button type="button" className="btn-soft btn-sm" onClick={onApprove}>
            <Check size={14} />
            Approve
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SubmissionList({ assignmentId, maxMarks, submissions }: { assignmentId: string; maxMarks: number; submissions: SubmissionRow[] }) {
  const [rows, setRows] = useState(submissions);
  const [busyId, setBusyId] = useState<string | null>(null);

  const patch = (id: string, changes: Partial<SubmissionRow>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));

  const mark = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/ai/mark", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assignmentId, submissionId: id }) });
      if (!res.ok) return;
      const out = (await res.json()) as MarkResponse;
      patch(id, { status: "ai-marked", awarded: out.awarded, points: out.points, feedback: out.feedback });
    } finally {
      setBusyId(null);
    }
  };

  if (!rows.length) return <p className="text-sm text-ink-3">No submissions yet.</p>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {rows.map((row) => (
        <SubmissionCard
          key={row.id}
          row={row}
          maxMarks={maxMarks}
          busy={busyId === row.id}
          onMark={() => mark(row.id)}
          onApprove={() => patch(row.id, { status: "teacher-approved" })}
          onAwarded={(n) => patch(row.id, { awarded: n })}
        />
      ))}
    </div>
  );
}
