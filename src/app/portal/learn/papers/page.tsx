import { Award, CalendarDays, CheckCircle2, FileText } from "lucide-react";
import { PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { spacesForClass } from "@/lib/data/mock/spaces";
import { paperAttemptsForStudent } from "@/lib/data/mock/papers";
import { codeForSubject, listPapers } from "@/lib/data/pastpapers";
import { subjectIdForSpace } from "@/lib/ai/assess";
import { paperTotal, pctOf } from "@/lib/domain/assessment";
import { Denied, isLearner } from "@/components/teach/guard";
import { PapersHub, type HubAttempt } from "@/components/papers/papers-hub";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function PapersPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const papers = listPapers();
  const ownCodes = [...new Set(spacesForClass(student.classId).map((s) => codeForSubject(subjectIdForSpace(s))).filter((c): c is string => Boolean(c)))];
  const questionsOf = new Map(papers.map((p) => [`${p.code}/${p.paperKey}`, p.questions]));

  const raw = paperAttemptsForStudent(student.id);
  const attempts: HubAttempt[] = raw.map((a) => ({
    id: a.id,
    code: a.code,
    paperKey: a.paperKey,
    total: paperTotal(a),
    maxMarks: a.maxMarks,
    finishedAt: a.finishedAt,
    answered: a.answers.length,
    questions: questionsOf.get(`${a.code}/${a.paperKey}`) ?? 0,
  }));

  const finished = attempts.filter((a) => a.finishedAt);
  const best = finished.reduce((m, a) => Math.max(m, pctOf(a.total, a.maxMarks)), 0);
  const since = Date.now() - WEEK_MS;
  const thisWeek = raw.reduce((n, a) => n + a.answers.filter((x) => new Date(x.answeredAt).getTime() >= since).length, 0);

  return (
    <>
      <PageHeader eyebrow="Past papers" title="Cambridge O Level papers" description="Genuine papers, marked question by question against the official scheme." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Papers available" value={papers.length} icon={<FileText size={18} />} tone="accent" />
        <Stat label="Sittings finished" value={finished.length} trend={attempts.length - finished.length ? `${attempts.length - finished.length} in progress` : undefined} icon={<CheckCircle2 size={18} />} tone="ok" />
        <Stat label="Best score" value={finished.length ? `${best}%` : "—"} trend="of finished sittings" icon={<Award size={18} />} tone="gold" />
        <Stat label="Answered this week" value={thisWeek} trend="questions" icon={<CalendarDays size={18} />} tone="info" />
      </div>

      <PapersHub papers={papers} ownCodes={ownCodes} attempts={attempts} />
    </>
  );
}
