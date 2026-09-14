/**
 * Branch-level aggregates and cross-branch comparisons. In production these
 * are SQL views; here they are typed constants plus a few pure helpers that
 * the Ask-the-School feature reads from.
 */
import type { BranchId } from "@/lib/config/school";
import type { BranchStats } from "@/lib/domain/types";
import { daysAgoISO } from "@/lib/utils";

export const BRANCH_STATS: BranchStats[] = [
  { branchId: "gulberg", students: 612, teachers: 41, attendanceToday: 92.4, attendanceTrend: -1.6, avgMark: 71.8, feeCollectedPct: 78, feeCollectedPKR: 14_650_000, atRisk: 23, hifzStudents: 58, markingBacklog: 63 },
  { branchId: "lakecity", students: 438, teachers: 29, attendanceToday: 94.1, attendanceTrend: 0.4, avgMark: 74.2, feeCollectedPct: 84, feeCollectedPKR: 10_900_000, atRisk: 11, hifzStudents: 32, markingBacklog: 21 },
  { branchId: "paragon", students: 355, teachers: 24, attendanceToday: 90.7, attendanceTrend: -2.9, avgMark: 68.9, feeCollectedPct: 71, feeCollectedPKR: 7_400_000, atRisk: 19, hifzStudents: 20, markingBacklog: 38 },
];

export const branchStats = (id: BranchId) => BRANCH_STATS.find((b) => b.branchId === id)!;

export function schoolTotals() {
  const t = BRANCH_STATS.reduce(
    (acc, b) => {
      acc.students += b.students;
      acc.teachers += b.teachers;
      acc.atRisk += b.atRisk;
      acc.hifz += b.hifzStudents;
      acc.fee += b.feeCollectedPKR;
      acc.attW += b.attendanceToday * b.students;
      acc.markW += b.avgMark * b.students;
      acc.backlog += b.markingBacklog;
      return acc;
    },
    { students: 0, teachers: 0, atRisk: 0, hifz: 0, fee: 0, attW: 0, markW: 0, backlog: 0 },
  );
  return {
    ...t,
    attendance: +(t.attW / t.students).toFixed(1),
    avgMark: +(t.markW / t.students).toFixed(1),
    feePct: Math.round(BRANCH_STATS.reduce((a, b) => a + b.feeCollectedPct * b.students, 0) / t.students),
  };
}

/** Same subject, same grade, every branch. Used by Ask the School and the cockpit comparison. */
export const SUBJECT_COMPARISON: { subject: string; grade: number; byBranch: Record<BranchId, { avg: number; trend: number; teacher: string }> }[] = [
  { subject: "Mathematics", grade: 8, byBranch: { gulberg: { avg: 64, trend: -6, teacher: "Ms. Hina Raza" }, lakecity: { avg: 73, trend: 2, teacher: "Mr. Danish Aslam" }, paragon: { avg: 66, trend: -1, teacher: "Ms. Kiran Butt" } } },
  { subject: "English Language", grade: 8, byBranch: { gulberg: { avg: 70, trend: 1, teacher: "Ms. Sara Malik" }, lakecity: { avg: 75, trend: 3, teacher: "Ms. Mahvish Ali" }, paragon: { avg: 67, trend: -2, teacher: "Mr. Adeel Hussain" } } },
  { subject: "Science", grade: 8, byBranch: { gulberg: { avg: 70, trend: 0, teacher: "Mr. Usman Tariq" }, lakecity: { avg: 72, trend: 1, teacher: "Ms. Sadia Noor" }, paragon: { avg: 65, trend: -4, teacher: "Mr. Kamran Shah" } } },
  { subject: "Islamiyat", grade: 8, byBranch: { gulberg: { avg: 82, trend: 2, teacher: "Ms. Ayesha Khan" }, lakecity: { avg: 80, trend: 0, teacher: "Mr. Hamid Raza" }, paragon: { avg: 78, trend: 1, teacher: "Ms. Bushra Iqbal" } } },
  { subject: "Urdu", grade: 8, byBranch: { gulberg: { avg: 68, trend: -3, teacher: "Mr. Bilal Ahmed" }, lakecity: { avg: 74, trend: 1, teacher: "Ms. Nazia Rehman" }, paragon: { avg: 70, trend: 0, teacher: "Mr. Zafar Khan" } } },
];

/** Weekly enrolment movement, for the "where are we losing students" question. */
export const ENROLMENT_MOVEMENT: { branchId: BranchId; joined: number; left: number; reasons: Record<string, number> }[] = [
  { branchId: "gulberg", joined: 9, left: 4, reasons: { "relocation": 2, "fees": 1, "transport": 1 } },
  { branchId: "lakecity", joined: 12, left: 1, reasons: { "relocation": 1 } },
  { branchId: "paragon", joined: 4, left: 7, reasons: { "fees": 3, "transport": 2, "academic concern": 2 } },
];

export interface ActivityItem {
  id: string;
  when: string; // ISO date
  branchId: BranchId | null;
  kind: "attendance" | "marking" | "hifz" | "parent" | "risk" | "resource";
  text: string;
}

export const ACTIVITY: ActivityItem[] = [
  { id: "ac-1", when: daysAgoISO(0), branchId: "gulberg", kind: "hifz", text: "Musa Rafiq completed Juz 25 manzil with 100% (Halaqa 2)." },
  { id: "ac-2", when: daysAgoISO(0), branchId: "paragon", kind: "risk", text: "Early-warning: 3 new high-risk students in Grade 6 (attendance)." },
  { id: "ac-3", when: daysAgoISO(0), branchId: "gulberg", kind: "marking", text: "AI marked 28 submissions for Grade 8-B Mathematics; 4 awaiting teacher approval." },
  { id: "ac-4", when: daysAgoISO(0), branchId: "lakecity", kind: "attendance", text: "Attendance 94.1% today, highest of the term." },
  { id: "ac-5", when: daysAgoISO(1), branchId: "gulberg", kind: "parent", text: "6 parent messages triaged: 3 urgent, 2 routine, 1 praise." },
  { id: "ac-6", when: daysAgoISO(1), branchId: "paragon", kind: "resource", text: "Grade 9 Chemistry resource pack approved by the Principal." },
];

export const BRANCH_TREND_WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6"];
export const ATTENDANCE_TREND: Record<BranchId, number[]> = {
  gulberg: [94.8, 94.5, 94.0, 93.6, 93.1, 92.4],
  lakecity: [93.0, 93.4, 93.7, 93.9, 94.0, 94.1],
  paragon: [93.5, 93.0, 92.6, 92.0, 91.4, 90.7],
};
