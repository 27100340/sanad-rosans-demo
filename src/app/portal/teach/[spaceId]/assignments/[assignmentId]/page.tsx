import { Chip, EmptyState, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { assignmentsForSpace } from "@/lib/data/mock/spaces";
import { studentById } from "@/lib/data/mock/people";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { fmtDay } from "@/components/teach/helpers";
import { SubmissionList, type SubmissionRow } from "@/components/teach/submission-list";

export default async function AssignmentDetailPage({ params }: { params: Promise<{ spaceId: string; assignmentId: string }> }) {
  const { spaceId, assignmentId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const assignment = assignmentsForSpace(space.id).find((a) => a.id === assignmentId);
  if (!assignment) return <EmptyState title="Assignment not found" body="It may belong to another space." />;

  const rows: SubmissionRow[] = assignment.submissions.map((s) => ({ ...s, studentName: studentById.get(s.studentId)?.name ?? s.studentId }));
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageHeader
        eyebrow={`${space.subject} · ${assignment.topicCode}`}
        title={assignment.title}
        description={`Due ${fmtDay(assignment.dueDate)} · ${assignment.maxMarks} marks`}
        actions={pending ? <Chip tone="warn">{pending} awaiting marking</Chip> : <Chip tone="ok">All marked</Chip>}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Question</p>
          <p className="mt-2 text-sm leading-relaxed text-ink">{assignment.question}</p>
        </div>
        <div className="card p-5">
          <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Mark scheme</p>
          <ol className="mt-2 space-y-1.5">
            {assignment.markScheme.map((line, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink">
                <span className="num w-5 shrink-0 text-ink-3">{i + 1}.</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <section>
        <SectionTitle title="Submissions" hint="Mark with AI shows the evidence for every point. Edit the awarded mark, then approve." />
        <SubmissionList assignmentId={assignment.id} maxMarks={assignment.maxMarks} submissions={rows} />
      </section>
    </>
  );
}
