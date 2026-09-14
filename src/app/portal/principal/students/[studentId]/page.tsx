import { LockKeyhole } from "lucide-react";
import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { StudentDetailView } from "@/components/students/student-detail";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { restrictionFor } from "@/lib/data/mock/access";
import { studentDetail } from "@/lib/data/student-detail";

export default async function PrincipalStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer)) return <SeatDenied home={viewer.home} />;

  const d = studentDetail(studentId);
  if (!d || (viewer.branchId && d.student.branchId !== viewer.branchId)) {
    return (
      <>
        <PageHeader eyebrow="Students" title="Not in your branch" />
        <EmptyState title="This student is at another campus" action={<LinkButton href="/portal/principal/students" variant="soft">All students</LinkButton>} />
      </>
    );
  }
  const restriction = restrictionFor({ personId: d.student.id, classId: d.student.classId, branchId: d.student.branchId, role: "student" });
  return (
    <div className="space-y-8">
      <StudentDetailView d={d} basePath="/portal/principal/students" messagesHref={null} spaceIdForTasks={null} restriction={restriction ? { mode: restriction.mode, message: restriction.message } : null} />
      <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink">Portal access</p>
          <p className="text-xs text-ink-3">{restriction ? `Currently ${restriction.mode}. Release it from the Access page.` : "Active. Lock or suspend from the Access page with a message the student will see."}</p>
        </div>
        <LinkButton href={`/portal/principal/access?scope=person&key=${encodeURIComponent(d.student.id)}`} variant={restriction ? "outline" : "primary"}>
          <LockKeyhole size={14} /> {restriction ? "Manage access" : "Lock access"}
        </LinkButton>
      </div>
    </div>
  );
}
