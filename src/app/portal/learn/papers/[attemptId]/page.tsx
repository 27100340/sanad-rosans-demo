import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { paperAttemptById } from "@/lib/data/mock/papers";
import { SUBJECT_BY_CODE, forStudentPaper, listPapers, questionsForPaper } from "@/lib/data/pastpapers";
import { paperTotal } from "@/lib/domain/assessment";
import { Denied, isLearner } from "@/components/teach/guard";
import { PaperRunner, type Revealed } from "@/components/papers/paper-runner";
import { PaperSummary, type SummaryRow } from "@/components/papers/paper-summary";

export default async function PaperAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const { attemptId } = await params;
  const attempt = paperAttemptById.get(attemptId);
  const paper = attempt ? listPapers(attempt.code).find((p) => p.paperKey === attempt.paperKey) : undefined;
  if (!attempt || !paper || attempt.studentId !== student.id) {
    return (
      <>
        <PageHeader eyebrow="Past papers" title="Not your sitting" />
        <EmptyState title="Not your sitting" body="This sitting belongs to another student or no longer exists." />
      </>
    );
  }

  const questions = questionsForPaper(attempt.code, attempt.paperKey);
  const subject = SUBJECT_BY_CODE[attempt.code]?.name ?? attempt.code;
  const answered = new Map(attempt.answers.map((a) => [a.questionId, a]));

  if (!attempt.finishedAt) {
    // The key and scheme leave the server only for questions this sitting has already answered.
    const revealed: Record<string, Revealed> = {};
    for (const q of questions) {
      if (answered.has(q.id)) revealed[q.id] = { answer: q.answer, msImg: q.msImg, msRows: q.msRows };
    }
    return (
      <>
        <PageHeader eyebrow={`Past paper · ${subject}`} title={paper.label} description={attempt.pace === "paper" ? "One question at a time, each on its own clock at the exam's pace. Marked as you go." : "One question at a time, no clock. Marked as you go."} />
        <PaperRunner attemptId={attempt.id} paper={paper} pace={attempt.pace} questions={questions.map(forStudentPaper)} answers={attempt.answers} revealed={revealed} />
      </>
    );
  }

  const rows: SummaryRow[] = questions.map((q) => {
    const a = answered.get(q.id);
    return { questionId: q.id, qnum: q.qnum, marks: q.marks, awarded: a?.awarded, secondsUsed: a?.secondsUsed ?? 0, status: a?.status, feedback: a?.feedback ?? "" };
  });

  return <PaperSummary subject={subject} label={paper.label} finishedAt={attempt.finishedAt} total={paperTotal(attempt)} maxMarks={attempt.maxMarks} rows={rows} />;
}
