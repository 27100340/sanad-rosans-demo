import { StudentDetailView } from "@/components/students/student-detail";
import { Denied } from "@/components/teach/guard";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { restrictionFor } from "@/lib/data/mock/access";
import { studentDetail } from "@/lib/data/student-detail";
import { spacesForTeacher } from "@/lib/data/repo";

export default async function TeacherStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;

  const d = studentDetail(studentId);
  const space = d ? spacesForTeacher(viewer.personId).find((s) => s.classId === d.student.classId) : undefined;
  if (!d || !space) {
    return (
      <>
        <PageHeader eyebrow="Students" title="Not in your classes" />
        <EmptyState title="This student is not in one of your spaces" action={<LinkButton href="/portal/teach/students" variant="soft">All students</LinkButton>} />
      </>
    );
  }
  const restriction = restrictionFor({ personId: d.student.id, classId: d.student.classId, branchId: d.student.branchId, role: "student" });
  return <StudentDetailView d={d} basePath="/portal/teach/students" messagesHref="/portal/teach/messages" spaceIdForTasks={space.id} restriction={restriction ? { mode: restriction.mode, message: restriction.message } : null} />;
}
