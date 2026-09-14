import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { AttendanceHeatmap } from "@/components/principal/attendance-heatmap";
import { BranchStatRow } from "@/components/principal/branch-stat-row";
import { ExceptionsList } from "@/components/principal/exceptions-list";
import { TeacherLoadTable } from "@/components/principal/teacher-load-table";
import { OnlineNow } from "@/components/portal/online-now";
import { Card, LinkButton, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { ATTENDANCE_HEAT_GULBERG } from "@/lib/data/mock/comms";
import { STUDENTS, TEACHERS } from "@/lib/data/mock/people";

const DEMO_BRANCH: BranchId = "gulberg";

export default async function PrincipalOverview() {
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow={`Principal · ${branchName(branchId)}`}
        title="Branch overview"
        description="Attendance by class, teacher load and today's exceptions."
        actions={
          <>
            <LinkButton href="/portal/principal/at-risk" variant="primary">At-risk students</LinkButton>
            <LinkButton href="/portal/principal/inbox" variant="outline">Parent inbox</LinkButton>
          </>
        }
      />
      <BranchStatRow branchId={branchId} />
      <section>
        <SectionTitle title="Attendance by class" hint="Percent present, last seven days" />
        <Card className="p-0 sm:p-2">
          <AttendanceHeatmap rows={ATTENDANCE_HEAT_GULBERG} />
        </Card>
      </section>
      <section className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TeacherLoadTable branchId={branchId} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <ExceptionsList branchId={branchId} />
          <OnlineNow personIds={[...STUDENTS.filter((s) => s.branchId === branchId).map((s) => s.id), ...TEACHERS.filter((t) => t.branchId === branchId).map((t) => t.id)]} hint="Students and staff seen in the last 90 seconds." />
        </div>
      </section>
    </div>
  );
}
