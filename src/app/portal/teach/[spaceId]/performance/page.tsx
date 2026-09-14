import { Award, ClipboardCheck, LineChart, UserMinus } from "lucide-react";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { PerformanceTable, type PerformanceRow } from "@/components/teach/performance-table";
import { PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { classById, studentsInClass } from "@/lib/data/mock/people";
import { assignmentsForSpace } from "@/lib/data/mock/spaces";
import { tasksForStudent } from "@/lib/data/mock/tasks";
import { allocationsForStudent, attemptById, masteryFor, testById } from "@/lib/data/mock/tests";
import { pctOf } from "@/lib/domain/assessment";
import { pointsEarned } from "@/lib/domain/tasks";
import type { SubjectSpace } from "@/lib/domain/types";

function mean(values: number[]): number | null {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
}

function rowsFor(space: SubjectSpace): PerformanceRow[] {
  const assignments = assignmentsForSpace(space.id);
  const codes = new Set(space.syllabus.map((t) => t.code));
  return studentsInClass(space.classId)
    .map((s): PerformanceRow => {
      const a = { awarded: 0, max: 0, marked: 0, set: assignments.length };
      for (const asg of assignments) {
        const sub = asg.submissions.find((x) => x.studentId === s.id);
        if (sub?.awarded === undefined) continue;
        a.awarded += sub.awarded;
        a.max += asg.maxMarks;
        a.marked += 1;
      }
      const t = { total: 0, max: 0, published: 0 };
      for (const al of allocationsForStudent(s.id)) {
        if (al.status !== "published" || testById.get(al.testId)?.spaceId !== space.id) continue;
        const attempt = al.attemptId ? attemptById.get(al.attemptId) : undefined;
        if (!attempt) continue;
        t.total += attempt.total ?? 0;
        t.max += attempt.maxMarks;
        t.published += 1;
      }
      const tasks = tasksForStudent(s.id).filter((x) => x.spaceId === space.id);
      return {
        studentId: s.id,
        name: s.name,
        assignments: a,
        tests: t,
        mastery: mean(masteryFor(s.id).filter((m) => codes.has(m.topicCode)).map((m) => m.score)),
        effort: { earned: pointsEarned(tasks), offered: tasks.reduce((sum, x) => sum + x.points, 0) },
        avgMark: s.avgMark,
        trend: s.markTrend,
      };
    })
    .sort((x, y) => pctOf(y.assignments.awarded + y.tests.total, y.assignments.max + y.tests.max) - pctOf(x.assignments.awarded + x.tests.total, x.assignments.max + x.tests.max) || x.name.localeCompare(y.name));
}

export default async function PerformancePage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const className = classById.get(space.classId)?.name ?? space.classId;
  const rows = rowsFor(space);
  const marked = rows.filter((r) => r.assignments.max > 0);
  const classPct = marked.length ? pctOf(marked.reduce((a, r) => a + r.assignments.awarded, 0), marked.reduce((a, r) => a + r.assignments.max, 0)) : null;
  const published = rows.reduce((a, r) => a + r.tests.published, 0);
  const unmarked = rows.filter((r) => r.assignments.set > 0 && r.assignments.marked === 0).length;
  const points = rows.reduce((a, r) => a + r.effort.earned, 0);

  return (
    <>
      <PageHeader eyebrow={`${space.subject} · ${className}`} title="Performance" description="Marked work, published tests, rolling mastery and task effort for every student in this space." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Class mark" value={classPct === null ? "—" : `${classPct}%`} trend="across marked assignments" icon={<LineChart size={18} />} tone="accent" />
        <Stat label="Tests published" value={published} trend="results with the students" icon={<ClipboardCheck size={18} />} tone="info" />
        <Stat label="No marked work" value={unmarked} trend="students with nothing marked yet" icon={<UserMinus size={18} />} tone={unmarked ? "warn" : "ok"} />
        <Stat label="Task points" value={points} trend="earned in this space" icon={<Award size={18} />} tone="gold" />
      </div>

      <section>
        <SectionTitle title="Students" hint="Best marked work first. Mastery is the rolling topic score over this space's syllabus; effort is task points earned over points offered." />
        <PerformanceTable rows={rows} />
      </section>
    </>
  );
}
