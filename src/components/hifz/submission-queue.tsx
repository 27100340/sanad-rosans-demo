"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HifzSubmission } from "@/lib/domain/hifz-marking";
import type { AyahSegment } from "@/lib/quran";
import { Chip, EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { KIND_LABEL, KIND_TONE } from "./derive";
import { CanonicalText } from "./word-diff";
import { RubricForm } from "./rubric-form";
import { RubricSummary, fmtWhen } from "./rubric-summary";
import { SubmissionAudio, fmtClipLength } from "./submission-audio";

export interface MarkRow {
  submission: HifzSubmission;
  studentName: string;
  passage: string;
  /** Canonical text resolved on the server so the verse data stays off the client. */
  segments: AyahSegment[];
}

function QueueItem({ row, active, onSelect }: { row: MarkRow; active: boolean; onSelect: () => void }) {
  const { submission } = row;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active}
        className={cn("w-full rounded-xl border px-3.5 py-3 text-left transition-colors", active ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-ink">{row.studentName}</p>
          <Chip tone={KIND_TONE[submission.unitKind]} className="ml-auto">
            {KIND_LABEL[submission.unitKind]}
          </Chip>
        </div>
        <p className="mt-0.5 truncate text-xs text-ink-2">{row.passage}</p>
        <p className="num mt-1 text-2xs text-ink-3">
          {fmtWhen(submission.submittedAt)} · {fmtClipLength(submission.durationSeconds)}
          {submission.status === "marked" && submission.mark ? ` · marked ${submission.mark.score}%` : " · unmarked"}
        </p>
      </button>
    </li>
  );
}

function Detail({ row, today, onMarked }: { row: MarkRow; today: string; onMarked: () => void }) {
  const { submission } = row;
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-ink">{row.studentName}</p>
        <span className="text-sm text-ink-2">{row.passage}</span>
        <Chip tone={KIND_TONE[submission.unitKind]}>{KIND_LABEL[submission.unitKind]}</Chip>
        <span className="num ml-auto text-xs text-ink-3">sent {fmtWhen(submission.submittedAt)}</span>
      </div>

      <div className="mt-4 rounded-2xl bg-surface-2/60 px-4 py-3">
        <p className="mb-1 text-2xs font-medium uppercase tracking-wide text-ink-3">Canonical text</p>
        {row.segments.length ? <CanonicalText segments={row.segments} /> : <p className="text-xs text-ink-3">This passage is outside the bundled verse subset.</p>}
      </div>

      <div className="mt-4">
        <SubmissionAudio submission={submission} />
      </div>

      <div className="mt-5 border-t border-line pt-5">
        {submission.mark ? (
          <RubricSummary mark={submission.mark} unit={submission.unitAfterMark} today={today} />
        ) : (
          <RubricForm submissionId={submission.id} unitKind={submission.unitKind} onMarked={onMarked} />
        )}
      </div>
    </div>
  );
}

/** The qari's marking desk: the queue on the left, the hearing and the rubric on the right. */
export function SubmissionQueue({ rows, today }: { rows: MarkRow[]; today: string }) {
  const router = useRouter();
  const firstPending = rows.find((r) => r.submission.status === "pending") ?? rows[0];
  const [selectedId, setSelectedId] = useState<string | null>(firstPending?.submission.id ?? null);
  const selected = rows.find((r) => r.submission.id === selectedId) ?? firstPending;

  if (!rows.length) {
    return (
      <EmptyState
        title="No recitations waiting"
        body="Submissions appear here when the student records a passage and sends it from Listen & recite. They are held in this server's memory and clear when it restarts."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
      <ul className="space-y-2">
        {rows.map((row) => (
          <QueueItem key={row.submission.id} row={row} active={row.submission.id === selected?.submission.id} onSelect={() => setSelectedId(row.submission.id)} />
        ))}
      </ul>
      {selected ? <Detail row={selected} today={today} onMarked={() => router.refresh()} /> : null}
    </div>
  );
}
