import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { assignmentsForSpace } from "@/lib/data/mock/spaces";
import { classById } from "@/lib/data/mock/people";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { AssignmentTable } from "@/components/teach/assignment-table";

export default async function AssignmentsPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const assignments = assignmentsForSpace(space.id);
  const className = classById.get(space.classId)?.name ?? "";

  return (
    <>
      <PageHeader eyebrow={`${space.subject} · ${className}`} title="Assignments" description="AI marks against the mark scheme; you approve or override every mark." />
      {assignments.length ? <AssignmentTable spaceId={space.id} assignments={assignments} /> : <EmptyState title="No assignments yet" body="Create one from the syllabus map." />}
    </>
  );
}
