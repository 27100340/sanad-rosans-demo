import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Card, Chip, PageHeader } from "@/components/ui/primitives";
import { Denied, isLearner } from "@/components/teach/guard";
import { PaperRunner } from "@/components/physics/paper-runner";
import { QuestionCard, type SchemeRow } from "@/components/physics/question-card";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { allocationById, attemptForAllocation, paperById, physicsQuestions } from "@/lib/data/physics";
import { ALLOCATION_MODE_LABEL, forRunner, helpAllowed, pct, resultsImmediate, scoreTone } from "@/lib/domain/physics";

export default async function PhysicsAssignmentPage({ params }: { params: Promise<{ allocationId: string }> }) {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const { allocationId } = await params;
  const allocation = allocationById(allocationId);
  if (!allocation || !allocation.studentIds.includes(student.id)) notFound();

  const paper = paperById(allocation.paperId);
  if (!paper) notFound();

  const questions = physicsQuestions(paper.questionIds);
  const attempt = attemptForAllocation(allocation.id, student.id);
  const released = Boolean(attempt) && (resultsImmediate(allocation.mode) || Boolean(allocation.publishedAt));

  // The mark scheme only leaves the server when the sitting allows it, or once
  // the marks are released. In closed-book and test modes it is never sent.
  const maySeeScheme = helpAllowed(allocation.mode) || released;
  const scheme: Record<string, SchemeRow> | null = maySeeScheme
    ? Object.fromEntries(questions.map((q) => [q.id, { id: q.id, ans: q.ans, scheme: q.scheme }]))
    : null;

  const back = (
    <Link href="/portal/physics/assignments" className="btn-ghost btn-sm -mb-2 self-start">
      <ArrowLeft size={13} /> Papers set for you
    </Link>
  );

  /* ---- Already sat: show the marked script, or say why it is sealed ---- */
  if (attempt) {
    return (
      <>
        {back}
        <PageHeader
          eyebrow={`Physics · ${ALLOCATION_MODE_LABEL[allocation.mode]}`}
          title={allocation.title}
          description={`Submitted ${new Date(attempt.ts).toISOString().slice(0, 10)}. ${attempt.qCount} questions, ${attempt.total} marks available.`}
          actions={
            released ? (
              <Chip tone={scoreTone(pct(attempt.score, attempt.total))}>
                <span className="num">
                  {attempt.score}/{attempt.total}
                </span>
                {" · "}
                {pct(attempt.score, attempt.total)}%
              </Chip>
            ) : (
              <Chip tone="neutral">
                <Lock size={12} /> Marks sealed
              </Chip>
            )
          }
        />

        {!released ? (
          <Card className="flex items-start gap-3">
            <Lock size={18} className="mt-0.5 shrink-0 text-ink-3" />
            <div>
              <p className="text-sm font-medium text-ink">This was sat under test conditions.</p>
              <p className="mt-1 text-xs leading-6 text-ink-2">
                Your script has been marked and stored. {allocation.createdByName} decides when the marks and the mark scheme are released, so your answers are
                shown below without them.
              </p>
            </div>
          </Card>
        ) : null}

        <div className="space-y-4">
          {questions.map((q, index) => {
            const marked = attempt.questions.find((m) => m.id === q.id);
            return (
              <QuestionCard
                key={q.id}
                index={index}
                question={forRunner(q)}
                scheme={scheme?.[q.id]}
                showScheme={released}
                marked={released ? marked : undefined}
                response={marked?.response ?? ""}
                onRespond={() => undefined}
                disabled
              />
            );
          })}
        </div>
      </>
    );
  }

  /* ---- Not sat yet: the runner ---- */
  return (
    <>
      {back}
      <PageHeader
        eyebrow={`Physics · ${ALLOCATION_MODE_LABEL[allocation.mode]}`}
        title={allocation.title}
        description={`Set by ${allocation.createdByName}${allocation.dueAt ? `, due ${allocation.dueAt}` : ""}. Answer every question you can, then submit.`}
      />
      <PaperRunner
        allocationId={allocation.id}
        title={allocation.title}
        mode={allocation.mode}
        instructions={allocation.instructions}
        durationMin={allocation.durationMin ?? paper.durationMin}
        questions={questions.map(forRunner)}
        scheme={helpAllowed(allocation.mode) ? scheme : null}
        totalMarks={paper.totalMarks}
      />
    </>
  );
}
