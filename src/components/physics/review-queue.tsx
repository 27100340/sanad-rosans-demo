"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Loader2, ShieldCheck } from "lucide-react";
import { Card, Chip, EmptyState } from "@/components/ui/primitives";
import { GuidedAnswerView, ModeChip, ProvenanceBadge, TopicChip } from "./answer-card";
import type { StudioAnswer } from "@/lib/domain/physics";

interface ReviewResponse {
  answer?: StudioAnswer;
  error?: string;
}

const MIN_NOTE_CHARS = 10;

function VerifyForm({ answer, onVerified }: { answer: StudioAnswer; onVerified: (a: StudioAnswer) => void }) {
  const [note, setNote] = useState("");
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy || note.trim().length < MIN_NOTE_CHARS) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/physics/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: answer.id, note: note.trim(), publish }),
      });
      const out = (await res.json().catch(() => ({}))) as ReviewResponse;
      if (!res.ok || !out.answer) {
        setError(out.error ?? "Could not save that review.");
        return;
      }
      onVerified(out.answer);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <div>
        <label htmlFor={`note-${answer.id}`} className="mb-1.5 block text-xs font-semibold text-ink">
          Your note to {answer.studentName.split(" ")[0]}
        </label>
        <textarea
          id={`note-${answer.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="What you checked, and the one thing to fix for the exam."
          className="input resize-y"
        />
        <p className="mt-1 text-2xs text-ink-3">Shown above the answer under your name. It is never merged into the AI body.</p>
      </div>
      <label className="flex items-center gap-2 text-xs text-ink-2">
        <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="h-4 w-4 rounded border-line-strong accent-accent" />
        Publish to the verified library so the whole class can read it
      </label>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <button type="button" onClick={submit} disabled={busy || note.trim().length < MIN_NOTE_CHARS} className="btn-primary btn-sm">
        {busy ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
        Verify {publish ? "and publish" : "only"}
      </button>
    </div>
  );
}

function QueueCard({ answer, onVerified }: { answer: StudioAnswer; onVerified: (a: StudioAnswer) => void }) {
  const [open, setOpen] = useState(false);
  const verified = answer.status === "teacher-verified";

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <TopicChip topic={answer.topic} />
        <ModeChip mode={answer.mode} />
        <ProvenanceBadge status={answer.status} reviewerName={answer.reviewerName} />
        {answer.live ? <Chip tone="info">Written live</Chip> : <Chip tone="neutral">Scripted</Chip>}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold leading-6 text-ink">{answer.question}</p>
        <p className="num mt-1 text-2xs text-ink-3">
          {answer.studentName} · asked {answer.askedAt.slice(0, 10)}
        </p>
      </div>

      <button type="button" onClick={() => setOpen((o) => !o)} className="btn-ghost btn-sm self-start">
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {open ? "Hide the answer" : "Read the answer"}
      </button>

      {open ? <GuidedAnswerView answer={answer.answer} /> : null}

      {verified ? (
        <div className="flex items-start gap-2 border-t border-line pt-3">
          <Check size={14} className="mt-0.5 shrink-0 text-ok" />
          <p className="text-xs leading-5 text-ink-2">
            Verified{answer.inLibrary ? " and published to the library" : ", not published"}. {answer.reviewNote}
          </p>
        </div>
      ) : (
        <VerifyForm answer={answer} onVerified={onVerified} />
      )}
    </Card>
  );
}

export function ReviewQueue({ pending }: { pending: StudioAnswer[] }) {
  const [rows, setRows] = useState(pending);

  const onVerified = (updated: StudioAnswer) => setRows((r) => r.map((a) => (a.id === updated.id ? updated : a)));

  if (!rows.length) {
    return <EmptyState title="Nothing waiting" body="When a student sends a Physics Studio answer for review it appears here, oldest first." />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2 lg:gap-6">
      {rows.map((a) => (
        <QueueCard key={a.id} answer={a} onVerified={onVerified} />
      ))}
    </div>
  );
}
