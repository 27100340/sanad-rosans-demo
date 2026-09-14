/**
 * Early-warning scoring. Pure and deterministic; the AI only writes the
 * one-sentence explanation on top of these reasons (see lib/ai/risk-note.ts).
 */
import type { RiskFlag, RiskLevel, Student } from "./types";

export interface RiskInputs {
  student: Student;
  hifzBacklogUnits?: number; // units overdue for revision
  tutorConfusionSignals?: number; // turns tagged "confused" in the last 14 days
  ownerId: string;
}

export function scoreRisk(input: RiskInputs): RiskFlag | null {
  const { student } = input;
  const reasons: string[] = [];
  let score = 0;

  if (student.attendancePct < 80) {
    score += 35;
    reasons.push(`Attendance ${student.attendancePct}% this term`);
  } else if (student.attendancePct < 90) {
    score += 15;
    reasons.push(`Attendance slipping to ${student.attendancePct}%`);
  }
  if (student.attendanceTrend <= -5) {
    score += 15;
    reasons.push(`Attendance down ${Math.abs(student.attendanceTrend)} points since last month`);
  }
  // Hifz students carry no academic marks in this model; only attendance and hifz backlog apply.
  if (!student.hifz && student.avgMark < 50) {
    score += 30;
    reasons.push(`Average mark ${student.avgMark}%`);
  } else if (!student.hifz && student.avgMark < 65) {
    score += 12;
    reasons.push(`Average mark ${student.avgMark}%, below the class band`);
  }
  if (!student.hifz && student.markTrend <= -8) {
    score += 15;
    reasons.push(`Marks fell ${Math.abs(student.markTrend)} points since last term`);
  }
  if ((input.hifzBacklogUnits ?? 0) >= 3) {
    score += 15;
    reasons.push(`${input.hifzBacklogUnits} Hifz units overdue for manzil`);
  }
  if ((input.tutorConfusionSignals ?? 0) >= 4) {
    score += 10;
    reasons.push(`Repeated confusion signals in tutor sessions`);
  }

  if (score < 20) return null;
  const level: RiskLevel = score >= 55 ? "high" : score >= 35 ? "medium" : "watch";
  return { studentId: student.id, level, score: Math.min(100, score), reasons, ownerId: input.ownerId };
}

export function rankRisks(flags: RiskFlag[]): RiskFlag[] {
  return [...flags].sort((a, b) => b.score - a.score);
}
