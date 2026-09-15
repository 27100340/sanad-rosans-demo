import Link from "next/link";
import { ArrowRight, CircleAlert, HelpCircle, Lightbulb, ShieldCheck, Sparkles } from "lucide-react";
import { Card, Chip } from "@/components/ui/primitives";
import type { AnswerStatus, GuidedAnswer, HelpMode, StudioAnswer } from "@/lib/domain/physics";
import { HELP_LABEL, STATUS_LABEL } from "@/lib/domain/physics";
import { topicGroup } from "@/content/physics/topics";

/**
 * The provenance label. Everything in the Physics section that shows an answer
 * shows this, and it reads only from `status` — an answer cannot be made to
 * look teacher-verified by any other route.
 */
export function ProvenanceBadge({ status, reviewerName }: { status: AnswerStatus; reviewerName?: string }) {
  if (status === "teacher-verified") {
    return (
      <Chip tone="ok">
        <ShieldCheck size={12} />
        {reviewerName ? `Verified by ${reviewerName}` : STATUS_LABEL[status]}
      </Chip>
    );
  }
  if (status === "review-requested") {
    return (
      <Chip tone="warn">
        <HelpCircle size={12} />
        {STATUS_LABEL[status]}
      </Chip>
    );
  }
  return (
    <Chip tone="neutral">
      <Sparkles size={12} />
      {STATUS_LABEL[status]}
    </Chip>
  );
}

export function TopicChip({ topic }: { topic: string }) {
  return (
    <Chip tone="accent">
      {topicGroup(topic)} · {topic}
    </Chip>
  );
}

export function ModeChip({ mode }: { mode: HelpMode }) {
  return <Chip tone="info">{HELP_LABEL[mode]}</Chip>;
}

/** The guided answer itself. Identical wherever it appears, so a verified answer and an unreviewed one differ only by their label. */
export function GuidedAnswerView({ answer }: { answer: GuidedAnswer }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-accent-soft/60 p-4">
        <p className="eyebrow mb-1">The idea</p>
        <p className="text-sm leading-6 text-ink">{answer.idea}</p>
      </div>

      <div>
        <p className="eyebrow mb-2">Working it through</p>
        <ol className="space-y-2.5">
          {answer.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="num mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-surface-2 text-2xs font-semibold text-ink-2">{i + 1}</span>
              <p className="min-w-0 text-sm leading-6 text-ink-2">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {answer.pitfall ? (
        <div className="flex gap-3 rounded-xl border border-line bg-surface-2/60 p-4">
          <CircleAlert size={16} className="mt-0.5 shrink-0 text-warn" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink">Where this usually goes wrong</p>
            <p className="mt-1 text-sm leading-6 text-ink-2">{answer.pitfall}</p>
          </div>
        </div>
      ) : null}

      <div className="flex gap-3 rounded-xl border border-dashed border-line-strong/70 p-4">
        <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink">Your turn</p>
          <p className="mt-1 text-sm leading-6 text-ink-2">{answer.check}</p>
        </div>
      </div>
    </div>
  );
}

/** The teacher's own words at review. Kept visually separate from the AI body; never merged into it. */
export function ReviewNote({ note, reviewerName, reviewedAt }: { note: string; reviewerName?: string; reviewedAt?: string }) {
  return (
    <div className="rounded-xl border border-ok/30 bg-ok-soft/50 p-4">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <ShieldCheck size={14} className="text-ok" />
        <p className="text-xs font-semibold text-ink">{reviewerName ?? "Teacher"} checked this</p>
        {reviewedAt ? <span className="num text-2xs text-ink-3">{reviewedAt.slice(0, 10)}</span> : null}
      </div>
      <p className="text-sm leading-6 text-ink-2">{note}</p>
    </div>
  );
}

/** One row in a list of answers: the library, a student's own history, the review queue. */
export function AnswerRow({ answer, href }: { answer: StudioAnswer; href: string }) {
  return (
    <Card hover className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <TopicChip topic={answer.topic} />
        <ModeChip mode={answer.mode} />
        <ProvenanceBadge status={answer.status} reviewerName={answer.reviewerName} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-6 text-ink">{answer.question}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-3">{answer.answer.idea}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3">
        <p className="num text-2xs text-ink-3">
          {answer.studentName} · {(answer.reviewedAt ?? answer.askedAt).slice(0, 10)}
        </p>
        <Link href={href} className="btn-ghost btn-sm">
          Read <ArrowRight size={13} />
        </Link>
      </div>
    </Card>
  );
}
