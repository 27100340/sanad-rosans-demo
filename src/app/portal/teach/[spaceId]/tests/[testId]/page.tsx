import Link from "next/link";
import { Chip, EmptyState, LinkButton, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { allocationsForTest, attemptById, attemptsForTest, questionsOf, testById } from "@/lib/data/mock/tests";
import type { Allocation, Attempt } from "@/lib/domain/assessment";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { fmtDay } from "@/components/teach/helpers";
import { ALLOCATION_STATUS, TEST_MODE } from "@/components/assess/labels";
import { QuestionPreview, type PreviewQuestion } from "@/components/assess/question-preview";
import { ResultsSummary, correctAnswerText, optionLabel } from "@/components/assess/results-summary";

interface AllocationRow {
  studentId: string;
  studentName: string;
  status: Allocation["status"];
  attempt?: Attempt;
}

function AllocationTable({ rows, reviewHref }: { rows: AllocationRow[]; reviewHref: string }) {
  if (!rows.length) return <EmptyState title="Nobody is allocated yet" />;
  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Status</th>
            <th className="text-right">Score</th>
            <th className="text-right">Guard events</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = ALLOCATION_STATUS[row.status];
            const scored = row.attempt?.submittedAt ? row.attempt : undefined;
            const reviewable = scored && (row.status === "submitted" || row.status === "published");
            return (
              <tr key={row.studentId}>
                <td className="font-medium">{row.studentName}</td>
                <td>
                  <Chip tone={status.tone}>{status.label}</Chip>
                </td>
                <td className="num text-right">{scored ? `${scored.total ?? 0} / ${scored.maxMarks}` : "–"}</td>
                <td className="num text-right">{scored ? scored.guardEvents : "–"}</td>
                <td className="text-right">
                  {reviewable ? (
                    <Link href={`${reviewHref}#${scored.id}`} className="btn-ghost btn-sm">
                      {row.status === "published" ? "View" : "Review"}
                    </Link>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function TestDetailPage({ params }: { params: Promise<{ spaceId: string; testId: string }> }) {
  const { spaceId, testId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const test = testById.get(testId);
  if (!test || test.spaceId !== space.id) return <EmptyState title="Test not found" body="It may belong to another space." />;

  const questions = questionsOf(test);
  const allocations = allocationsForTest(test.id);
  const attempts = attemptsForTest(test.id);
  const awaiting = attempts.filter((a) => a.submittedAt && a.marking.some((m) => m.status === "ai-marked")).length;
  const reviewHref = `/portal/teach/${space.id}/tests/${test.id}/review`;
  const mode = TEST_MODE[test.mode];

  const preview: PreviewQuestion[] = questions.map((q, i) => ({
    id: q.id,
    number: i + 1,
    type: q.type,
    topicCode: q.topicCode,
    marks: q.marks,
    stem: q.stem,
    options: q.options?.map((text, idx) => optionLabel(idx, text)),
    correctAnswer: correctAnswerText(q),
    markScheme: q.markScheme,
  }));

  const allocationRows: AllocationRow[] = allocations.map((a) => ({
    studentId: a.studentId,
    studentName: studentById.get(a.studentId)?.name ?? a.studentId,
    status: a.status,
    attempt: a.attemptId ? attemptById.get(a.attemptId) : undefined,
  }));

  const windowText = `${fmtDay(test.opensAt)} – ${fmtDay(test.closesAt)}`;
  const durationText = test.durationMin ? `${test.durationMin} min` : "untimed";
  const attemptsText = `${test.attemptsAllowed} ${test.attemptsAllowed === 1 ? "attempt" : "attempts"} allowed`;

  return (
    <>
      <PageHeader
        eyebrow={`${mode.label} · ${space.subject}`}
        title={test.title}
        description={`${windowText} · ${durationText} · ${attemptsText}`}
        actions={
          <>
            <Chip tone="neutral">{test.proctored ? "Proctored" : "Proctoring off"}</Chip>
            <LinkButton href={reviewHref} variant={awaiting ? "primary" : "soft"}>
              Review queue{awaiting ? ` (${awaiting})` : ""}
            </LinkButton>
          </>
        }
      />

      <ResultsSummary allocated={allocations.length} attempts={attempts} questions={questions} />

      <QuestionPreview questions={preview} />

      <section>
        <SectionTitle title="Allocations" hint={`${allocations.length} students · scores appear once an attempt is submitted`} />
        <AllocationTable rows={allocationRows} reviewHref={reviewHref} />
      </section>
    </>
  );
}
