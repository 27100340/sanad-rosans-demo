import { AlertTriangle, Percent, UserMinus, Users } from "lucide-react";
import { ATTENDANCE_WARN, RECENT_MARKS, RosterTable, type RosterRow } from "@/components/attend/roster-table";
import { branchRiskRows } from "@/components/principal/risk";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { attendancePctFor, lessonsForClass, marksForStudent } from "@/lib/data/mock/attendance";
import { classById, studentsInClass } from "@/lib/data/mock/people";
import { masteryFor } from "@/lib/data/mock/tests";
import type { RiskLevel, SubjectSpace } from "@/lib/domain/types";

function mean(values: number[]): number | null {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
}

function rosterRows(space: SubjectSpace): RosterRow[] {
  const codes = new Set(space.syllabus.map((t) => t.code));
  const lessonDate = new Map(lessonsForClass(space.classId).map((l) => [l.id, l.date]));
  const riskByStudent = new Map<string, RiskLevel>(branchRiskRows(space.branchId).map((r) => [r.student.id, r.flag.level]));

  return studentsInClass(space.classId)
    .map((s) => ({
      studentId: s.id,
      name: s.name,
      attendance: attendancePctFor(s.id),
      trend: s.attendanceTrend,
      avgMark: s.avgMark,
      mastery: mean(masteryFor(s.id).filter((m) => codes.has(m.topicCode)).map((m) => m.score)),
      risk: riskByStudent.get(s.id) ?? null,
      recent: marksForStudent(s.id)
        .filter((m) => lessonDate.has(m.lessonId))
        .sort((a, b) => (lessonDate.get(a.lessonId) ?? "").localeCompare(lessonDate.get(b.lessonId) ?? "") || a.markedAt.localeCompare(b.markedAt))
        .slice(-RECENT_MARKS)
        .map((m) => m.status),
    }))
    .sort((a, b) => a.attendance - b.attendance || a.name.localeCompare(b.name));
}

export default async function ClassRosterPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const className = classById.get(space.classId)?.name ?? space.classId;
  const rows = rosterRows(space);
  const classPct = mean(rows.map((r) => r.attendance));
  const below = rows.filter((r) => r.attendance < ATTENDANCE_WARN).length;
  const atRisk = rows.filter((r) => r.risk !== null).length;

  return (
    <>
      <PageHeader eyebrow={`${space.subject} · ${className}`} title="Class" description="Attendance, mastery and risk for every student in this space." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Students" value={rows.length} icon={<Users size={18} />} tone="accent" />
        <Stat label="Class attendance" value={classPct === null ? "—" : `${classPct}%`} trend="this term" icon={<Percent size={18} />} tone="info" />
        <Stat label={`Below ${ATTENDANCE_WARN}%`} value={below} trend="attendance this term" icon={<UserMinus size={18} />} tone={below ? "warn" : "ok"} />
        <Stat label="At risk" value={atRisk} trend="flagged by early warning" icon={<AlertTriangle size={18} />} tone={atRisk ? "danger" : "ok"} />
      </div>

      <section>
        <SectionTitle title="Roster" hint="Lowest attendance first. Recent register shows the last eight marks in this class, oldest to newest." />
        <RosterTable rows={rows} />
      </section>
    </>
  );
}
