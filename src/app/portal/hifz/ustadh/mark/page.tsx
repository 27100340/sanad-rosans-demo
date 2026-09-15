import { CheckCircle2, Inbox } from "lucide-react";
import { getViewer } from "@/lib/auth/viewer";
import { mayMarkHifz } from "@/app/api/hifz/submission/guards";
import { allSubmissions } from "@/lib/data/hifz-submissions";
import { studentById } from "@/lib/data/mock/people";
import { ayahLabel, segmentsFor } from "@/lib/quran";
import { todayISO } from "@/lib/utils";
import { HIFZ_RUBRIC, HIFZ_RUBRIC_TOTAL } from "@/lib/domain/hifz-marking";
import { Card, Chip, EmptyState, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { SubmissionQueue, type MarkRow } from "@/components/hifz/submission-queue";

export default async function HifzMarkPage() {
  const viewer = await getViewer();
  if (!mayMarkHifz(viewer)) {
    return (
      <EmptyState
        title="Only the ustadh hears these recitations"
        body="A submission carries a child's voice, so the marking desk is limited to the qari who teaches the halaqa. Switch to the Ustadh persona from the top bar."
      />
    );
  }

  const today = todayISO();
  const submissions = allSubmissions();
  const rows: MarkRow[] = submissions.map((submission) => ({
    submission,
    studentName: studentById.get(submission.studentId)?.name ?? submission.studentId,
    passage: ayahLabel(submission.surah, submission.fromAyah, submission.toAyah),
    segments: segmentsFor(submission.surah, submission.fromAyah, submission.toAyah),
  }));
  const pending = rows.filter((r) => r.submission.status === "pending").length;

  return (
    <>
      <PageHeader
        eyebrow="Halaqa 2"
        title="Marking desk"
        description="Hear each submitted passage against the canonical text and mark it on the Hifz rubric. Your mark is the assessment of record; it sets the score, the outcome and the next due date."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Waiting" value={pending} tone={pending ? "warn" : "neutral"} icon={<Inbox size={18} />} trend="unmarked submissions" />
        <Stat label="Marked" value={rows.length - pending} tone="ok" icon={<CheckCircle2 size={18} />} trend="this session" />
      </div>

      <section>
        <SectionTitle
          title="Rubric"
          hint={`Weighted out of ${HIFZ_RUBRIC_TOTAL}; bands are the madrasa grades from mumtaz to da'if`}
          action={<Chip tone="neutral">Human marked</Chip>}
        />
        <Card>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HIFZ_RUBRIC.map((criterion) => (
              <li key={criterion.id} className="rounded-xl bg-surface-2/60 px-3.5 py-3">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="text-sm font-medium text-ink">{criterion.label}</p>
                  <span className="quran text-[1rem] leading-none text-ink-3">{criterion.arabic}</span>
                  <span className="num ml-auto text-xs font-semibold text-ink-2">{criterion.weight}</span>
                </div>
                <p className="mt-1 text-xs text-ink-3">{criterion.hint}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <SectionTitle title="Queue" hint="Newest first; recordings are held in this server's memory only and clear on restart" />
        <SubmissionQueue rows={rows} today={today} />
      </section>
    </>
  );
}
