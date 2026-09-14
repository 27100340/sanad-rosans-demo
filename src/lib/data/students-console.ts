/**
 * Rows for the students console: one per student in a set of classes with
 * attendance, average, Performance Index, open tasks, risk and access
 * status. Shared by the teacher (their classes) and the principal (the
 * branch).
 */
import { branchRiskRows } from "@/components/principal/risk";
import type { ConsoleRow } from "@/components/students/students-console";
import { restrictionFor } from "./mock/access";
import { attendancePctFor } from "./mock/attendance";
import { buildKpi } from "./kpi";
import { classById, studentsInClass } from "./mock/people";
import { tasksForStudent } from "./mock/tasks";
import { isOverdue } from "@/lib/domain/tasks";
import type { BranchId } from "@/lib/config/school";
import { todayISO } from "@/lib/utils";

export function consoleRows(branchId: BranchId, classIds: string[]): ConsoleRow[] {
  const today = todayISO();
  const risk = new Map(branchRiskRows(branchId).map((r) => [r.student.id, r.flag.level]));
  const kpi = new Map(buildKpi(branchId).students.map((s) => [s.studentId, s]));
  return classIds.flatMap((classId) =>
    studentsInClass(classId).map((s): ConsoleRow => {
      const tasks = tasksForStudent(s.id);
      const k = kpi.get(s.id);
      return {
        id: s.id,
        name: s.name,
        classId,
        className: classById.get(classId)?.name ?? classId,
        attendance: attendancePctFor(s.id),
        avgMark: s.hifz ? null : s.avgMark,
        trend: s.hifz ? s.attendanceTrend : s.markTrend,
        index: k?.composite ?? null,
        rankClass: k?.rankClass ?? null,
        openTasks: tasks.filter((t) => t.status !== "done").length,
        overdue: tasks.filter((t) => isOverdue(t, today)).length,
        risk: risk.get(s.id) ?? null,
        restricted: restrictionFor({ personId: s.id, classId: s.classId, branchId: s.branchId, role: "student" }) !== null,
        hifz: Boolean(s.hifz),
      };
    }),
  );
}
