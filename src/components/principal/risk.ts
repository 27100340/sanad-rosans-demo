import type { BranchId } from "@/lib/config/school";
import { rankRisks, scoreRisk } from "@/lib/domain/risk";
import type { RiskFlag, Student } from "@/lib/domain/types";
import { HALAQA_2 } from "@/lib/data/mock/hifz";
import { classById, STUDENTS, teacherById } from "@/lib/data/mock/people";

export interface RiskRow {
  flag: RiskFlag;
  student: Student;
  className: string;
  ownerName: string;
}

export const TOP_NOTE_COUNT = 3;

/**
 * Early-warning rows for one campus, ranked by score. The owner is the class
 * teacher; Hifz students carry their overdue manzil count. Hifz students have
 * no academic marks in this mock (avgMark 0), so the mark rules are neutralised
 * for them rather than counting a missing mark as a failing one.
 */
export function branchRiskRows(branchId: BranchId): RiskRow[] {
  const flags = STUDENTS.filter((s) => s.branchId === branchId)
    .map((student) => {
      const klass = classById.get(student.classId);
      const ownerId = klass?.classTeacherId ?? "";
      const hifzRow = student.hifz ? HALAQA_2.find((h) => h.studentId === student.id) : undefined;
      const scored = student.hifz ? { ...student, avgMark: 100, markTrend: 0 } : student;
      return scoreRisk({ student: scored, ownerId, hifzBacklogUnits: hifzRow?.overdueManzil });
    })
    .filter((f): f is RiskFlag => f !== null);

  return rankRisks(flags).map((flag) => {
    const student = STUDENTS.find((s) => s.id === flag.studentId) as Student;
    return {
      flag,
      student,
      className: classById.get(student.classId)?.name ?? "",
      ownerName: teacherById.get(flag.ownerId)?.name ?? "Class teacher",
    };
  });
}
