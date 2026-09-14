import { ClipboardCheck, Send } from "lucide-react";
import { EmptyState, LinkButton, PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { attemptsForTest, questionsOf, testById } from "@/lib/data/mock/tests";
import type { Attempt, Question, QuestionMarking } from "@/lib/domain/assessment";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { correctAnswerText } from "@/components/assess/results-summary";
import { ReviewPanel, type ReviewAttemptRow, type ReviewQuestionRow } from "@/components/assess/review-panel";

/** An answer with no marking record (student skipped it) still needs a row the teacher can mark. */
function markingFor(attempt: Attempt, q: Question): QuestionMarking {
  return attempt.marking.find((m) => m.questionId === q.id) ?? { questionId: q.id, awarded: 0, points: [], feedback: "", status: "ai-marked" };
}

function toRow(attempt: Attempt, questions: Question[]): ReviewAttemptRow {
  const rows: ReviewQuestionRow[] = questions.map((q, i) => ({
    questionId: q.id,
    number: i + 1,
    stem: q.stem,
    type: q.type,
    marks: q.marks,
    response: attempt.answers.find((a) => a.questionId === q.id)?.response ?? "",
    correctAnswer: correctAnswerText(q),
    markScheme: q.markScheme,
    marking: markingFor(attempt, q),
  }));
  return {
    attemptId: attempt.id,
    studentName: studentById.get(attempt.studentId)?.name ?? attempt.studentId,
    total: attempt.total ?? 0,
    maxMarks: attempt.maxMarks,
    guardEvents: attempt.guardEvents,
    published: attempt.marking.every((m) => m.status !== "ai-marked"),
    questions: rows,
  };
}

export default async function ReviewPage({ params }: { params: Promise<{ spaceId: string; testId: string }> }) {
  const { spaceId, testId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const test = testById.get(testId);
  if (!test || test.spaceId !== space.id) return <EmptyState title="Test not found" body="It may belong to another space." />;

  const questions = questionsOf(test);
  const rows = attemptsForTest(test.id)
    .filter((a) => a.submittedAt)
    .map((a) => toRow(a, questions))
    .sort((a, b) => Number(a.published) - Number(b.published));
  const awaiting = rows.filter((r) => !r.published).length;
  const published = rows.length - awaiting;

  return (
    <>
      <PageHeader
        eyebrow={test.title}
        title="Review"
        description="AI marks show their evidence. Edit any mark, approve, then publish to the student."
        actions={
          <LinkButton href={`/portal/teach/${space.id}/tests/${test.id}`} variant="outline">
            Back to test
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:gap-6">
        <Stat label="Awaiting review" value={awaiting} icon={<ClipboardCheck size={18} />} tone={awaiting ? "warn" : "neutral"} />
        <Stat label="Published" value={published} icon={<Send size={18} />} tone="ok" />
      </div>

      <ReviewPanel attempts={rows} />
    </>
  );
}
