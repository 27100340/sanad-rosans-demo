import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { spaceById } from "@/lib/data/mock/spaces";
import { allocationsForStudent, attemptById, questionsOf, testById } from "@/lib/data/mock/tests";
import type { Attempt, Question } from "@/lib/domain/assessment";
import { forStudent, secondsLeft } from "@/lib/domain/assessment";
import { Denied, isLearner } from "@/components/teach/guard";
import { Runner } from "@/components/assess/runner";
import { ResultView, type ResultRow } from "@/components/assess/result-view";

function correctAnswerOf(q: Question): string {
  if (q.type === "mcq") return q.options?.[Number(q.answer)] ?? q.answer;
  return q.answer;
}

/** Builds what the student may see. Marking is hidden until published unless it was auto-marked; answers only once published. */
function resultRows(questions: Question[], attempt: Attempt, published: boolean): ResultRow[] {
  return questions.map((q, i) => {
    const m = attempt.marking.find((x) => x.questionId === q.id);
    const response = attempt.answers.find((a) => a.questionId === q.id)?.response ?? "";
    const yourAnswer = q.type === "mcq" && response !== "" ? (q.options?.[Number(response)] ?? response) : response;
    const visible = m && (published || m.status === "auto");
    return {
      questionId: q.id,
      number: i + 1,
      type: q.type,
      stem: q.stem,
      marks: q.marks,
      yourAnswer,
      marking: visible && m ? { awarded: m.awarded, status: m.status, points: m.points, feedback: m.feedback } : undefined,
      correct: published ? correctAnswerOf(q) : undefined,
    };
  });
}

export default async function AttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const { attemptId } = await params;
  const attempt = attemptById.get(attemptId);
  const test = attempt ? testById.get(attempt.testId) : undefined;
  if (!attempt || !test || attempt.studentId !== student.id) {
    return (
      <>
        <PageHeader eyebrow="Tests" title="Not your attempt" />
        <EmptyState title="Not your attempt" body="This attempt belongs to another student or no longer exists." />
      </>
    );
  }

  const questions = questionsOf(test);
  const subject = spaceById.get(test.spaceId)?.subject ?? "";
  const status = allocationsForStudent(student.id).find((a) => a.testId === test.id)?.status;

  if (!attempt.submittedAt) {
    return (
      <>
        <PageHeader eyebrow={`Test · ${subject}`} title={test.title} description={test.durationMin ? `${test.durationMin} minutes. Your answers save as you go.` : "Untimed. Your answers save as you go."} />
        <Runner
          attemptId={attempt.id}
          title={test.title}
          subject={subject}
          durationMin={test.durationMin}
          questions={questions.map(forStudent)}
          initialAnswers={attempt.answers}
          initialSecondsLeft={secondsLeft(attempt, test.durationMin, new Date())}
          initialGuardEvents={attempt.guardEvents}
        />
      </>
    );
  }

  const published = status === "published";
  return (
    <ResultView
      title={test.title}
      subject={subject}
      submittedAt={attempt.submittedAt}
      questionCount={questions.length}
      published={published}
      total={attempt.total ?? 0}
      maxMarks={attempt.maxMarks}
      guardEvents={attempt.guardEvents}
      rows={resultRows(questions, attempt, published)}
      tutorHref={`/portal/learn/tutor?space=${encodeURIComponent(test.spaceId)}&quiz=1`}
    />
  );
}
