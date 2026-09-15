import type { HifzSubmission } from "@/lib/domain/hifz-marking";
import { ayahLabel } from "@/lib/quran";
import { Chip } from "@/components/ui/primitives";
import { KIND_LABEL, KIND_TONE } from "./derive";
import { RubricSummary, fmtWhen } from "./rubric-summary";
import { SubmissionAudio, fmtClipLength } from "./submission-audio";

/** The student's own view: what he sent, and what his ustadh wrote back. */
export function SubmissionList({ submissions, today }: { submissions: HifzSubmission[]; today: string }) {
  return (
    <ul className="space-y-4">
      {submissions.map((submission) => (
        <li key={submission.id} className="card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-ink">{ayahLabel(submission.surah, submission.fromAyah, submission.toAyah)}</p>
            <Chip tone={KIND_TONE[submission.unitKind]}>{KIND_LABEL[submission.unitKind]}</Chip>
            <span className="num text-xs text-ink-3">
              {fmtWhen(submission.submittedAt)} · {fmtClipLength(submission.durationSeconds)}
            </span>
            <Chip tone={submission.status === "marked" ? "ok" : "neutral"} className="ml-auto">
              {submission.status === "marked" ? "Marked" : "With the ustadh"}
            </Chip>
          </div>

          <div className="mt-3">
            <SubmissionAudio submission={submission} />
          </div>

          {submission.mark ? (
            <div className="mt-4 border-t border-line pt-4">
              <RubricSummary mark={submission.mark} unit={submission.unitAfterMark} today={today} />
            </div>
          ) : (
            <p className="mt-3 text-xs text-ink-3">Waiting for your ustadh to hear it. Nothing has been scored — no mark exists until he writes one.</p>
          )}
        </li>
      ))}
    </ul>
  );
}
