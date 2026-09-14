import { Gauge } from "lucide-react";
import { KpiStudentView } from "@/components/learn/kpi-view";
import { Denied, isLearner } from "@/components/teach/guard";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, school } from "@/lib/config/school";
import { buildKpi } from "@/lib/data/kpi";
import { studentById } from "@/lib/data/mock/people";

export default async function MyRankingPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const table = buildKpi(student.branchId);
  const me = table.students.find((s) => s.studentId === student.id);

  return (
    <>
      <PageHeader
        eyebrow="My ranking"
        title={
          <span className="flex items-center gap-2.5">
            <Gauge size={22} className="text-accent" /> Performance Index
          </span>
        }
        description="A transparent 0 to 100 score across six pillars, weighted toward what actually improves your results. Every pillar shows exactly how it was scored."
        actions={<LinkButton href="/portal/learn/leaderboard" variant="soft">Leaderboard</LinkButton>}
      />
      {me ? <KpiStudentView me={me} branchName={branchName(student.branchId)} schoolName={school.shortName} computedAt={table.computedAt} /> : <EmptyState title="No ranking yet" body="Your index appears once you sit a quiz, submit work or attend a lesson." />}
    </>
  );
}
