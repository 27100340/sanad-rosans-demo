import { Award, CheckCircle2, Clock, Percent } from "lucide-react";
import { Chip, LinkButton, PageHeader, Progress, SectionTitle, Stat, type Tone } from "@/components/ui/primitives";
import type { PaperAnswerStatus } from "@/lib/domain/assessment";
import { pctOf } from "@/lib/domain/assessment";
import { fmtClock } from "@/components/assess/labels";
import { fmtDay } from "@/components/teach/helpers";

export const PAPER_STATUS: Record<PaperAnswerStatus, { label: string; tone: Tone }> = {
  auto: { label: "Auto-marked", tone: "ok" },
  "ai-marked": { label: "AI marked", tone: "info" },
  unanswered: { label: "No answer", tone: "neutral" },
};

/** One question row of a finished sitting. Built on the server; the key and scheme are not needed here. */
export interface SummaryRow {
  questionId: string;
  qnum: number;
  marks: number;
  /** Absent when the question was never opened. */
  awarded?: number;
  secondsUsed: number;
  status?: PaperAnswerStatus;
  feedback: string;
}

export interface PaperSummaryProps {
  subject: string;
  label: string;
  finishedAt: string;
  total: number;
  maxMarks: number;
  rows: SummaryRow[];
}

function rowTone(awarded: number, marks: number): Tone {
  const pct = pctOf(awarded, marks);
  return pct >= 70 ? "ok" : pct >= 40 ? "warn" : "danger";
}

export function PaperSummary({ subject, label, finishedAt, total, maxMarks, rows }: PaperSummaryProps) {
  const answered = rows.filter((r) => r.status && r.status !== "unanswered").length;
  const seconds = rows.reduce((a, r) => a + r.secondsUsed, 0);

  return (
    <>
      <PageHeader eyebrow={`Past paper · ${subject}`} title={label} description={`Finished ${fmtDay(finishedAt.slice(0, 10))} · ${rows.length} ${rows.length === 1 ? "question" : "questions"}`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Score" value={`${total}/${maxMarks}`} icon={<Award size={18} />} tone="accent" />
        <Stat label="Percentage" value={`${pctOf(total, maxMarks)}%`} icon={<Percent size={18} />} tone="ok" />
        <Stat label="Answered" value={`${answered}/${rows.length}`} trend="questions" icon={<CheckCircle2 size={18} />} tone="info" />
        <Stat label="Time used" value={fmtClock(seconds)} trend="across answered questions" icon={<Clock size={18} />} tone="neutral" />
      </div>

      <section>
        <SectionTitle title="Question by question" hint="Marks against the official scheme, and how long each one took." />
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Q</th>
                <th className="min-w-36">Marks</th>
                <th>Time</th>
                <th>Status</th>
                <th className="min-w-56">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const awarded = r.awarded ?? 0;
                const status = r.status ?? "unanswered";
                return (
                  <tr key={r.questionId}>
                    <td className="num font-semibold">{r.qnum}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="num w-10 shrink-0 text-xs font-medium">
                          {awarded}/{r.marks}
                        </span>
                        <Progress value={pctOf(awarded, r.marks)} tone={status === "unanswered" ? "neutral" : rowTone(awarded, r.marks)} className="w-20" />
                      </div>
                    </td>
                    <td className="num text-xs text-ink-2">{r.secondsUsed ? fmtClock(r.secondsUsed) : "—"}</td>
                    <td>
                      <Chip tone={PAPER_STATUS[status].tone}>{PAPER_STATUS[status].label}</Chip>
                    </td>
                    <td className="max-w-xs">
                      <p className="truncate text-xs text-ink-2" title={r.feedback}>
                        {r.feedback || "—"}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink">Sit another paper</p>
          <p className="mt-1 text-xs text-ink-3">Every sitting is marked question by question against the official scheme.</p>
        </div>
        <LinkButton href="/portal/learn/papers" variant="soft" className="shrink-0">
          Back to past papers
        </LinkButton>
      </div>
    </>
  );
}
