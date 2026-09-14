import { AttendanceHeatmap } from "@/components/principal/attendance-heatmap";
import { Card, EmptyState, LinkButton, SectionTitle } from "@/components/ui/primitives";
import { branchName, type BranchId } from "@/lib/config/school";
import { ATTENDANCE_HEAT_GULBERG } from "@/lib/data/mock/comms";
import { LEADERS } from "@/lib/data/mock/people";

/** Expanded panel for one branch. Gulberg has full mock data; the others are placeholders. */
export function BranchDetail({ branchId }: { branchId: BranchId }) {
  const principal = LEADERS.find((p) => p.role === "principal" && p.branchId === branchId);
  const name = branchName(branchId);
  if (branchId !== "gulberg") {
    return (
      <section>
        <SectionTitle title={name} hint={principal?.name} />
        <EmptyState title={`${name} detail available in the full build`} body="This demo carries class-level registers for Gulberg only. The branch view for every campus is identical once the school's data is connected." />
      </section>
    );
  }
  return (
    <section>
      <SectionTitle title={`${name} · attendance by class`} hint={`${principal?.name} · last seven days`} action={<LinkButton href="/portal/principal" variant="ghost" className="btn-sm">Open branch view</LinkButton>} />
      <Card className="p-0 sm:p-2">
        <AttendanceHeatmap rows={ATTENDANCE_HEAT_GULBERG} />
      </Card>
    </section>
  );
}
