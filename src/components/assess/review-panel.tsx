"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Send, ShieldAlert, X } from "lucide-react";
import { Chip } from "@/components/ui/primitives";
import type { MarkPoint } from "@/lib/domain/types";
import type { QuestionMarking, QuestionType } from "@/lib/domain/assessment";
import { MARKING_STATUS, QUESTION_TYPE } from "./labels";

export interface ReviewQuestionRow {
  questionId: string;
  number: number;
  stem: string;
  type: QuestionType;
  marks: number;
  response: string;
  correctAnswer: string;
  markScheme: string[];
  marking: QuestionMarking;
}

export interface ReviewAttemptRow {
  attemptId: string;
  studentName: string;
  total: number;
  maxMarks: number;
  guardEvents: number;
  published: boolean;
  questions: ReviewQuestionRow[];
}

interface ReviewBody {
  attemptId: string;
  questionId?: string;
  awarded?: number;
  approve?: boolean;
  publish?: boolean;
}

interface ReviewResponse {
  total?: number;
  maxMarks?: number;
  marking?: QuestionMarking[];
  published?: boolean;
  error?: string;
}

const JSON_HEADERS = { "content-type": "application/json" };

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

function MarkingChips({ marking }: { marking: QuestionMarking }) {
  const status = MARKING_STATUS[marking.status];
  return (
    <>
      <Chip tone={status.tone}>{status.label}</Chip>
      {marking.overridden ? <Chip tone="gold">edited</Chip> : null}
    </>
  );
}

function AwardedInput({ q, disabled, onChange, onCommit }: { q: ReviewQuestionRow; disabled: boolean; onChange: (n: number) => void; onCommit: () => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-ink-3">
      Awarded
      <input
        type="number"
        min={0}
        max={q.marks}
        value={q.marking.awarded}
        disabled={disabled}
        onChange={(e) => onChange(Math.max(0, Math.min(q.marks, Number(e.target.value))))}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="input num w-16 py-1 text-center text-sm"
      />
      <span className="num">/ {q.marks}</span>
    </label>
  );
}

function AutoMarkedLine({ q }: { q: ReviewQuestionRow }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-xs">
      <span className="num font-medium text-ink">Q{q.number}</span>
      <span className="text-ink-3">{QUESTION_TYPE[q.type]}</span>
      <span className="min-w-0 flex-1 truncate text-ink-2" title={q.stem}>
        {q.stem}
      </span>
      <span className="font-mono text-ink-2">{q.response || "no answer"}</span>
      <span className="num font-medium text-ink">
        {q.marking.awarded} / {q.marks}
      </span>
      <MarkingChips marking={q.marking} />
    </div>
  );
}

function QuestionReview({ q, busy, onAwarded, onCommit, onApprove }: { q: ReviewQuestionRow; busy: boolean; onAwarded: (n: number) => void; onCommit: () => void; onApprove: () => void }) {
  if (q.marking.status === "auto") return <AutoMarkedLine q={q} />;
  const approved = q.marking.status === "teacher-approved";
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="num text-sm font-medium text-ink">Q{q.number}</span>
          <span className="text-2xs text-ink-3">{QUESTION_TYPE[q.type]}</span>
          <MarkingChips marking={q.marking} />
        </div>
        <AwardedInput q={q} disabled={approved || busy} onChange={onAwarded} onCommit={onCommit} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink">{q.stem}</p>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 font-mono text-xs leading-relaxed text-ink">{q.response || "no answer"}</pre>
      <p className="mt-2 text-xs text-ink-3">Model answer: {q.correctAnswer}</p>
      {q.marking.points.length ? (
        <ul className="mt-3 space-y-1.5">
          {q.marking.points.map((p, i) => (
            <PointLine key={i} point={p} />
          ))}
        </ul>
      ) : null}
      {q.marking.feedback ? <p className="mt-3 border-l-2 border-accent pl-3 text-xs text-ink-2">{q.marking.feedback}</p> : null}
      {q.marking.status === "ai-marked" ? (
        <div className="mt-3">
          <button type="button" className="btn-soft btn-sm" disabled={busy} onClick={onApprove}>
            <Check size={14} /> Approve
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AttemptCard({ row, busy, error, onAwarded, onCommit, onApprove, onPublish }: { row: ReviewAttemptRow; busy: boolean; error?: string; onAwarded: (questionId: string, n: number) => void; onCommit: (questionId: string) => void; onApprove: (questionId: string) => void; onPublish: () => void }) {
  return (
    <div id={row.attemptId} className="card scroll-mt-24 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink">{row.studentName}</p>
          {row.published ? <Chip tone="ok">Published</Chip> : <Chip tone="info">Awaiting review</Chip>}
          {row.guardEvents > 0 ? (
            <Chip tone="warn">
              <ShieldAlert size={12} /> {row.guardEvents} guard {row.guardEvents === 1 ? "event" : "events"}
            </Chip>
          ) : null}
        </div>
        <p className="num text-sm text-ink-2">
          <span className="font-semibold text-ink">{row.total}</span> / {row.maxMarks}
        </p>
      </div>
      {error ? <p className="chip-danger mt-3">{error}</p> : null}
      <div className="mt-2 divide-y divide-line/70">
        {row.questions.map((q) => (
          <QuestionReview key={q.questionId} q={q} busy={busy} onAwarded={(n) => onAwarded(q.questionId, n)} onCommit={() => onCommit(q.questionId)} onApprove={() => onApprove(q.questionId)} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="num text-sm text-ink-2">
          Total <span className="font-semibold text-ink">{row.total}</span> / {row.maxMarks}
        </p>
        {row.published ? (
          <Chip tone="ok">Published</Chip>
        ) : (
          <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={onPublish}>
            <Send size={14} /> Publish to student
          </button>
        )}
      </div>
    </div>
  );
}

export function ReviewPanel({ attempts }: { attempts: ReviewAttemptRow[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [rows, setRows] = useState(attempts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const patchRow = (attemptId: string, fn: (row: ReviewAttemptRow) => ReviewAttemptRow) => setRows((prev) => prev.map((r) => (r.attemptId === attemptId ? fn(r) : r)));

  const applyResponse = (attemptId: string, data: ReviewResponse) =>
    patchRow(attemptId, (row) => ({
      ...row,
      total: data.total ?? row.total,
      maxMarks: data.maxMarks ?? row.maxMarks,
      published: data.published ?? row.published,
      questions: row.questions.map((q) => ({ ...q, marking: data.marking?.find((m) => m.questionId === q.questionId) ?? q.marking })),
    }));

  const send = (body: ReviewBody) =>
    start(async () => {
      setBusyId(body.attemptId);
      try {
        const res = await fetch("/api/assess/review", { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify(body) });
        const json = (await res.json().catch(() => ({}))) as ReviewResponse;
        if (!res.ok) {
          setErrors((prev) => ({ ...prev, [body.attemptId]: json.error ?? "Something went wrong." }));
          return;
        }
        setErrors((prev) => ({ ...prev, [body.attemptId]: "" }));
        applyResponse(body.attemptId, json);
        if (body.publish) router.refresh();
      } finally {
        setBusyId(null);
      }
    });

  const setAwarded = (attemptId: string, questionId: string, awarded: number) =>
    patchRow(attemptId, (row) => ({ ...row, questions: row.questions.map((q) => (q.questionId === questionId ? { ...q, marking: { ...q.marking, awarded } } : q)) }));

  const commitAwarded = (attemptId: string, questionId: string) => {
    const q = rows.find((r) => r.attemptId === attemptId)?.questions.find((x) => x.questionId === questionId);
    if (q) send({ attemptId, questionId, awarded: q.marking.awarded });
  };

  if (!rows.length) return <p className="text-sm text-ink-3">No submitted attempts yet.</p>;
  return (
    <div className="space-y-4 lg:space-y-6">
      {rows.map((row) => (
        <AttemptCard
          key={row.attemptId}
          row={row}
          busy={busyId === row.attemptId}
          error={errors[row.attemptId] || undefined}
          onAwarded={(questionId, n) => setAwarded(row.attemptId, questionId, n)}
          onCommit={(questionId) => commitAwarded(row.attemptId, questionId)}
          onApprove={(questionId) => send({ attemptId: row.attemptId, questionId, approve: true })}
          onPublish={() => send({ attemptId: row.attemptId, publish: true })}
        />
      ))}
    </div>
  );
}
