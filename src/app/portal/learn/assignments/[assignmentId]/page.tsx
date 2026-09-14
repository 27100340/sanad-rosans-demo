import { AssignmentSubmit } from "@/components/learn/assignment-submit";
import { Denied, isLearner } from "@/components/teach/guard";
import { fmtDay } from "@/components/teach/helpers";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById, teacherById } from "@/lib/data/mock/people";
import { ASSIGNMENTS, spaceById, spacesForClass } from "@/lib/data/mock/spaces";
import { todayISO } from "@/lib/utils";

export default async function StudentAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const assignment = ASSIGNMENTS.find((a) => a.id === assignmentId);
  const space = assignment ? spaceById.get(assignment.spaceId) : undefined;
  if (!assignment || !space || !spacesForClass(student.classId).some((s) => s.id === space.id)) {
    return (
      <>
        <PageHeader eyebrow="Assignments" title="Not found" />
        <EmptyState title="This assignment is not in one of your spaces" action={<LinkButton href="/portal/learn" variant="soft">Back to Today</LinkButton>} />
      </>
    );
  }

  const submission = assignment.submissions.find((s) => s.studentId === student.id) ?? null;
  const teacher = teacherById.get(space.teacherId)?.name ?? "";
  const overdue = !submission && assignment.dueDate < todayISO();

  return (
    <>
      <PageHeader eyebrow={`${space.subject} · ${assignment.topicCode}`} title={assignment.title} description={`${assignment.maxMarks} mark${assignment.maxMarks === 1 ? "" : "s"} · set by ${teacher} · due ${fmtDay(assignment.dueDate)}`} actions={<LinkButton href={`/portal/learn/tutor?space=${encodeURIComponent(space.id)}`} variant="outline">Ask the tutor for a hint</LinkButton>} />

      <div className="card p-5">
        <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Question</p>
        <p className="mt-2 text-sm leading-relaxed text-ink">{assignment.question}</p>
        {assignment.instructions ? <p className="mt-2 text-xs text-ink-2">{assignment.instructions}</p> : null}
      </div>

      <AssignmentSubmit assignmentId={assignment.id} maxMarks={assignment.maxMarks} initial={submission} dueLabel={fmtDay(assignment.dueDate)} overdue={overdue} />
    </>
  );
}
