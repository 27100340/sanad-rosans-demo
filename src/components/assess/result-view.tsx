import { Award, Check, CheckCircle2, ClipboardCheck, Percent, ShieldAlert, X } from "lucide-react";
import { Chip, LinkButton, PageHeader, Stat } from "@/components/ui/primitives";
import type { MarkPoint } from "@/lib/domain/types";
import type { MarkingStatus, QuestionType } from "@/lib/domain/assessment";
import { pctOf } from "@/lib/domain/assessment";
import { fmtDay } from "@/components/teach/helpers";
import { MARKING_STATUS, QUESTION_TYPE } from "./labels";

/** One question as the student may see it after submission. Built on the server; never carries a hidden answer. */
export interface ResultRow {
  questionId: string;
  number: number;
  type: QuestionType;
  stem: string;
  marks: number;
  yourAnswer: string;
  /** Present only when the student may see this question's marking. */
  marking?: { awarded: number; status: MarkingStatus; points: MarkPoint[]; feedback: string };
  /** Present only once the teacher has published. */
  correct?: string;
}

export interface ResultViewProps {
  title: string;
  subject: string;
  submittedAt: string;
  questionCount: number;
  published: boolean;
  total: number;
  maxMarks: number;
  guardEvents: number;
  rows: ResultRow[];
  tutorHref: string;
}

function QuestionResult({ row }: { row: ResultRow }) {
  const m = row.marking;
  return (
    <div className="card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="num text-xs font-semibold text-ink-3">Question {row.number}</span>
        <span className="text-xs text-ink-3">· {QUESTION_TYPE[row.type]}</span>
        {m ? (
          <>
            <span className="num text-xs font-semibold text-ink">
              {m.awarded}/{row.marks}
            </span>
            <Chip tone={MARKING_STATUS[m.status].tone}>{MARKING_STATUS[m.status].label}</Chip>
          </>
        ) : (
          <Chip tone="neutral">{row.marks} marks</Chip>
        )}
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{row.stem}</p>
      <div>
        <p className="label">Your answer</p>
        <pre className="whitespace-pre-wrap rounded-xl bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-ink">{row.yourAnswer || "No answer"}</pre>
      </div>
      {m && m.points.length ? (
        <ul className="space-y-1">
          {m.points.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              {p.earned ? <Check size={14} className="mt-0.5 shrink-0 text-ok" /> : <X size={14} className="mt-0.5 shrink-0 text-danger" />}
              <span className="text-ink-2">
                <span className="font-medium text-ink">{p.label}</span> · {p.evidence}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {m?.feedback ? <p className="border-l-2 border-accent pl-3 text-sm text-ink-2">{m.feedback}</p> : null}
      {row.correct !== undefined ? (
        <p className="text-xs text-ink-3">
          <span className="font-medium">{row.type === "short" || row.type === "structured" ? "Model answer" : "Correct answer"}:</span> <span className="whitespace-pre-line">{row.correct}</span>
        </p>
      ) : null}
    </div>
  );
}

export function ResultView({ title, subject, submittedAt, questionCount, published, total, maxMarks, guardEvents, rows, tutorHref }: ResultViewProps) {
  const visible = rows.filter((r) => r.marking);
  const fullyRight = visible.filter((r) => r.marking && r.marking.awarded === r.marks).length;

  return (
    <>
      <PageHeader eyebrow={`Result · ${subject}`} title={title} description={`Submitted ${fmtDay(submittedAt.slice(0, 10))} · ${questionCount} ${questionCount === 1 ? "question" : "questions"}`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {published ? (
          <>
            <Stat label="Score" value={`${total}/${maxMarks}`} icon={<Award size={18} />} tone="accent" />
            <Stat label="Percentage" value={`${pctOf(total, maxMarks)}%`} icon={<Percent size={18} />} tone="ok" />
            <Stat label="Fully right" value={`${fullyRight}/${questionCount}`} trend="questions" icon={<CheckCircle2 size={18} />} tone="info" />
            {guardEvents > 0 ? <Stat label="Guard warnings" value={guardEvents} trend="recorded during the test" icon={<ShieldAlert size={18} />} tone="warn" /> : null}
          </>
        ) : (
          <>
            <Stat label="Submitted" value={fmtDay(submittedAt.slice(0, 10))} icon={<ClipboardCheck size={18} />} tone="accent" />
            <Stat label="Auto-marked right" value={`${fullyRight}/${visible.length}`} trend="of the auto-marked questions" icon={<CheckCircle2 size={18} />} tone="ok" />
            <Stat label="Status" value={<Chip tone="info">Awaiting review</Chip>} icon={<Award size={18} />} tone="info" />
          </>
        )}
      </div>

      <div className="space-y-4">
        {visible.map((r) => (
          <QuestionResult key={r.questionId} row={r} />
        ))}
        {!published ? (
          <div className="card-quiet px-5 py-4">
            <p className="text-sm text-ink-2">Your teacher is reviewing the written answers. You will see the marks and feedback here once approved.</p>
          </div>
        ) : null}
      </div>

      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink">Practise what you lost marks on</p>
          <p className="mt-1 text-xs text-ink-3">The tutor will quiz you on the topics from this test, a step at a time.</p>
        </div>
        <LinkButton href={tutorHref} variant="soft" className="shrink-0">
          Quiz me with the tutor
        </LinkButton>
      </div>
    </>
  );
}
