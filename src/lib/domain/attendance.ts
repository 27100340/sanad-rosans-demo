/**
 * Attendance vocabulary and maths, declared once. Ported from the reference
 * exam-lab project (lib/edu/attendance.ts) so every register, KPI and
 * early-warning consumer agrees on what counts.
 *
 *   present / late / online  -> attended
 *   absent                   -> counts against attendance
 *   excused / leave / exempt -> removed from the denominator; never an absence
 */

/** Order drives the tap-to-cycle order in the register and the summary row. */
export const ATTENDANCE_STATUSES = ["present", "late", "online", "absent", "excused", "leave", "exempt"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDED_STATUSES: readonly AttendanceStatus[] = ["present", "late", "online"];
export const EXCLUDED_STATUSES: readonly AttendanceStatus[] = ["excused", "leave", "exempt"];

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  online: "Online",
  absent: "Absent",
  excused: "Excused",
  leave: "Leave",
  exempt: "Exempt",
};

export const ATTENDANCE_NOTE_MAX = 500;

export type LessonStatus = "scheduled" | "open" | "closed";

export interface Lesson {
  id: string;
  classId: string;
  spaceId?: string; // subject space when the period maps to one
  teacherId: string;
  subject: string;
  date: string; // ISO date
  period: number;
  room: string;
  status: LessonStatus;
  openedAt?: string;
  closedAt?: string;
}

export interface AttendanceMark {
  lessonId: string;
  studentId: string;
  status: AttendanceStatus;
  note: string; // mandatory official reason for "exempt", optional for "leave"
  markedAt: string;
  markedBy: string;
}

const ALL = new Set<string>(ATTENDANCE_STATUSES);
const ATTENDED = new Set<string>(ATTENDED_STATUSES);
const EXCLUDED = new Set<string>(EXCLUDED_STATUSES);

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return typeof value === "string" && ALL.has(value);
}

export function isAttended(status: string): boolean {
  return ATTENDED.has(status);
}

export function isExcludedFromAttendance(status: string): boolean {
  return EXCLUDED.has(status);
}

/** An official reason is mandatory for a lesson exemption. */
export function requiresReason(status: string): boolean {
  return status === "exempt";
}

/** A reason is kept only for these, so moving a student back to present cannot leave a stale reason. */
export function allowsReason(status: string): boolean {
  return status === "exempt" || status === "leave";
}

export function normaliseReason(note: unknown): string {
  return typeof note === "string" ? note.trim().slice(0, ATTENDANCE_NOTE_MAX) : "";
}

export function nextStatus(current: AttendanceStatus): AttendanceStatus {
  const i = ATTENDANCE_STATUSES.indexOf(current);
  return ATTENDANCE_STATUSES[(i + 1) % ATTENDANCE_STATUSES.length];
}

export function countedStatuses(statuses: string[]): string[] {
  return statuses.filter((s) => !isExcludedFromAttendance(s));
}

/** attended / (all marks minus excused, leave, exempt); null when nothing counts. */
export function attendancePercent(statuses: string[]): number | null {
  const counted = countedStatuses(statuses);
  if (!counted.length) return null;
  return Math.round((counted.filter(isAttended).length / counted.length) * 100);
}

export function summarise(marks: Pick<AttendanceMark, "status">[]): Record<AttendanceStatus, number> {
  const out = Object.fromEntries(ATTENDANCE_STATUSES.map((s) => [s, 0])) as Record<AttendanceStatus, number>;
  for (const m of marks) out[m.status] += 1;
  return out;
}

/** Validates one register row; returns the error to show, or null when it may be saved. */
export function validateMark(status: string, note: string): string | null {
  if (!isAttendanceStatus(status)) return "Unknown attendance status.";
  if (requiresReason(status) && !normaliseReason(note)) return "An official reason is required for an exemption.";
  return null;
}
