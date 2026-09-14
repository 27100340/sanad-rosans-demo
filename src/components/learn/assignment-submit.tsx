"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Send, X } from "lucide-react";
import { AiPill, Chip } from "@/components/ui/primitives";
import type { MarkPoint, Submission } from "@/lib/domain/types";
import { SUBMISSION_STATUS } from "@/components/teach/helpers";

interface Out {
  submission?: Submission;
  live?: boolean;
  error?: string;
}

function Points({ points }: { points: MarkPoint[] }) {
  return (
    <ul className="space-y-1.5">
      {points.map((p, i) => (
        <li key={i} className="flex items-start gap-2 text-xs">
          <span className={p.earned ? "mt-0.5 text-ok" : "mt-0.5 text-danger"}>{p.earned ? <Check size={13} /> : <X size={13} />}</span>
          <span className="min-w-0">
            <span className="font-medium text-ink">{p.label}</span>
            <span className="text-ink-3"> · {p.evidence}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Answer box for one assignment; after submitting, the AI marking shows with the evidence for every point. */
export function AssignmentSubmit({ assignmentId, maxMarks, initial, dueLabel, overdue }: { assignmentId: string; maxMarks: number; initial: Submission | null; dueLabel: string; overdue: boolean }) {
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(initial);
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const marked = submission && submission.status !== "pending";

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assignments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assignmentId, answer }) });
      const out = (await res.json().catch(() => ({}))) as Out;
      if (!res.ok || !out.submission) {
        setError(out.error ?? "Could not submit.");
        return;
      }
      setSubmission(out.submission);
      setLive(Boolean(out.live));
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  if (marked && submission) {
    const st = SUBMISSION_STATUS[submission.status];
    return (
      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Chip tone={st.tone}>{st.label}</Chip>
            {live !== null ? <AiPill live={live} /> : null}
          </div>
          <p className="num text-xl font-semibold text-ink">
            {submission.awarded ?? 0}
            <span className="text-sm font-normal text-ink-3"> / {maxMarks}</span>
          </p>
        </div>
        <pre className="whitespace-pre-wrap rounded-xl bg-surface-2 p-3 font-mono text-xs leading-relaxed text-ink">{submission.answer}</pre>
        {submission.points?.length ? <Points points={submission.points} /> : null}
        {submission.feedback ? <p className="border-l-2 border-accent pl-3 text-sm text-ink-2">{submission.feedback}</p> : null}
        <p className="text-xs text-ink-3">{submission.status === "teacher-approved" ? "Your teacher has approved this mark." : "Marked by AI with the evidence for each point; your teacher checks and may adjust it."}</p>
      </div>
    );
  }

  return (
    <form
      className="card space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy && answer.trim().length >= 3) void submit();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={overdue ? "danger" : "warn"}>{overdue ? `Was due ${dueLabel}` : `Due ${dueLabel}`}</Chip>
        {submission ? <Chip tone="info">Saved draft; resubmit to replace</Chip> : null}
      </div>
      <div>
        <label className="label" htmlFor="answer">Your answer</label>
        <textarea id="answer" className="input min-h-40 font-mono text-xs leading-relaxed" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={"Show every step on its own line, for example:\n3(x + 4) = 27\n3x + 12 = 27\n3x = 15\nx = 5\nCheck: 3(5 + 4) = 27"} maxLength={6000} />
        <p className="help">Method marks need the steps written out; a bare final answer earns only the answer mark.</p>
      </div>
      {error ? <p className="chip-danger">{error}</p> : null}
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={busy || answer.trim().length < 3}>
          <Send size={14} /> {busy ? "Marking" : "Submit for marking"}
        </button>
      </div>
    </form>
  );
}
