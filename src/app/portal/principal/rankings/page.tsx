import { Award, LifeBuoy, Trophy, Users } from "lucide-react";
import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { RankingsTable, type ClassRanking } from "@/components/principal/rankings-table";
import { PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { buildKpi } from "@/lib/data/kpi";
import { attendancePctFor } from "@/lib/data/mock/attendance";
import { HALAQA_2 } from "@/lib/data/mock/hifz";
import { studentsInClass } from "@/lib/data/mock/people";
import { tasksForStudent } from "@/lib/data/mock/tasks";
import { classesForBranch } from "@/lib/data/repo";
import { effortPct, rankStudents, WEIGHTS } from "@/lib/domain/rank";
import { pointsEarned } from "@/lib/domain/tasks";

const DEMO_BRANCH: BranchId = "gulberg";

export default async function RankingsPage() {
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const kpi = new Map(buildKpi(branchId).students.map((s) => [s.studentId, s]));

  const classes: ClassRanking[] = classesForBranch(branchId, true)
    .map((c) => {
      const students = studentsInClass(c.id);
      const ranked = rankStudents(
        students.map((s) => {
          const tasks = tasksForStudent(s.id);
          return { studentId: s.id, marks: s.hifz ? (HALAQA_2.find((h) => h.studentId === s.id)?.securePct ?? null) : s.avgMark, attendance: attendancePctFor(s.id), effort: effortPct(pointsEarned(tasks), tasks.reduce((a, t) => a + t.points, 0)) };
        }),
      );
      const byId = new Map(students.map((s) => [s.id, s]));
      return { id: c.id, name: c.name, hifz: c.section === "Hifz", rows: ranked.map((r) => { const s = byId.get(r.studentId); return { ...r, name: s?.name ?? r.studentId, trend: s ? (s.hifz ? s.attendanceTrend : s.markTrend) : 0, index: kpi.get(r.studentId)?.composite ?? null }; }) };
    })
    .filter((c) => c.rows.length);

  const all = classes.flatMap((c) => c.rows);
  const distinction = all.filter((r) => r.band === "distinction").length;
  const support = all.filter((r) => r.band === "support").length;

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow={`Principal · ${branchName(branchId)}`} title="Rankings" description={`Per class, on a composite of marks ${WEIGHTS.marks * 100} · attendance ${WEIGHTS.attendance * 100} · effort ${WEIGHTS.effort * 100}. Hifz classes rank on manzil secure instead of marks. The Index column is the students' own six-pillar Performance Index; the student-facing leaderboard shows effort only.`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Classes ranked" value={classes.length} icon={<Users size={18} />} tone="accent" />
        <Stat label="Students" value={all.length} icon={<Trophy size={18} />} tone="info" />
        <Stat label="Distinction" value={distinction} trend="composite 85 and above" icon={<Award size={18} />} tone="gold" />
        <Stat label="Needs support" value={support} trend="composite under 50" icon={<LifeBuoy size={18} />} tone={support ? "danger" : "ok"} />
      </div>

      <RankingsTable classes={classes} basePath="/portal/principal/students" />
    </div>
  );
}
