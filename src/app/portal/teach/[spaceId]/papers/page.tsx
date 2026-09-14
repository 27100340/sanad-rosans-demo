import { FileText, Percent, Users, ClipboardList } from "lucide-react";
import { EmptyState, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { classById } from "@/lib/data/mock/people";
import { paperAttemptsForPaper } from "@/lib/data/mock/papers";
import { SUBJECT_BY_CODE, codeForSubject, listPapers, questionsForPaper } from "@/lib/data/pastpapers";
import { subjectIdForSpace } from "@/lib/ai/assess";
import { paperTotal, pctOf } from "@/lib/domain/assessment";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { PaperAnalytics, type HardQuestion, type PaperClassRow } from "@/components/papers/paper-analytics";

const HARDEST_COUNT = 3;

export default async function SpacePapersPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const className = classById.get(space.classId)?.name ?? space.classId;
  const code = codeForSubject(subjectIdForSpace(space));
  if (!code) {
    const available = Object.entries(SUBJECT_BY_CODE)
      .map(([c, s]) => `${s.name} ${c}`)
      .join(", ");
    return (
      <>
        <PageHeader eyebrow={`${space.subject} · ${className}`} title="Past papers" description="What the class has sat and where marks are lost." />
        <EmptyState title="No Cambridge papers for this subject yet" body={`Papers exist for ${available}.`} />
      </>
    );
  }

  const classStudents = new Set(classById.get(space.classId)?.studentIds ?? []);
  const papers = listPapers(code).sort((a, b) => a.code.localeCompare(b.code) || b.year - a.year || a.paper.localeCompare(b.paper));
  const sat = new Set<string>();
  let sittings = 0;
  const pcts: number[] = [];

  const rows: PaperClassRow[] = papers.map((paper) => {
    const attempts = paperAttemptsForPaper(paper.code, paper.paperKey).filter((a) => classStudents.has(a.studentId));
    const scored = attempts.filter((a) => a.answers.length > 0);
    for (const a of attempts) sat.add(a.studentId);
    sittings += attempts.length;
    const paperPcts = scored.map((a) => pctOf(paperTotal(a), a.maxMarks));
    pcts.push(...paperPcts);

    const questions = questionsForPaper(paper.code, paper.paperKey);
    const hardest: HardQuestion[] = questions
      .map((q) => {
        const awarded = attempts.flatMap((a) => a.answers.filter((x) => x.questionId === q.id).map((x) => x.awarded));
        if (!awarded.length || q.marks === 0) return null;
        return { qnum: q.qnum, marks: q.marks, meanFraction: awarded.reduce((s, n) => s + n, 0) / awarded.length / q.marks, sample: awarded.length };
      })
      .filter((h): h is HardQuestion => h !== null)
      .sort((a, b) => a.meanFraction - b.meanFraction)
      .slice(0, HARDEST_COUNT);

    return {
      paper,
      sittings: attempts.length,
      meanPct: paperPcts.length ? Math.round(paperPcts.reduce((s, n) => s + n, 0) / paperPcts.length) : undefined,
      hardest,
      previewImg: questions[0]?.img[0],
    };
  });

  const meanPct = pcts.length ? Math.round(pcts.reduce((s, n) => s + n, 0) / pcts.length) : undefined;

  return (
    <>
      <PageHeader eyebrow={`${space.subject} · ${className}`} title="Past papers" description="What the class has sat and where marks are lost." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Papers available" value={papers.length} trend={`${SUBJECT_BY_CODE[code].name} ${code}`} icon={<FileText size={18} />} tone="accent" />
        <Stat label="Class sittings" value={sittings} icon={<ClipboardList size={18} />} tone="info" />
        <Stat label="Mean score" value={meanPct === undefined ? "—" : `${meanPct}%`} trend="across scored sittings" icon={<Percent size={18} />} tone={meanPct !== undefined && meanPct < 50 ? "warn" : "ok"} />
        <Stat label="Students who sat" value={`${sat.size}/${classStudents.size}`} icon={<Users size={18} />} tone="neutral" />
      </div>

      <section>
        <SectionTitle title="Papers" hint="Class mean per paper and the questions where the most marks are lost." />
        <PaperAnalytics rows={rows} />
      </section>
    </>
  );
}
