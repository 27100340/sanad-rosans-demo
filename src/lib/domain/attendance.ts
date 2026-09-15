/**
 * Attendance vocabulary and maths, declared once. Ported from the reference
 * exam-lab project (lib/edu/attendance.ts) so every register, KPI and
 * early-warning consumer agrees on what counts.
 *
 *   present / late / online  -> attended
 *   absent / bunk            -> counts against attendance
 *   excused / leave / exempt -> removed from the denominator; never an absence
 *
 * "bunk" is deliberately separate from "absent": the child signed in and is
 * somewhere on the premises but not in this period. It costs the same
 * attendance percentage as an absence, but it is a supervision incident rather
 * than a home matter, so the roll-ups surface it first and the register asks
 * where the student was.
 */

/** Order drives the tap-to-cycle order in the register and the summary row. */
export const ATTENDANCE_STATUSES = ["present", "late", "online", "absent", "bunk", "excused", "leave", "exempt"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDED_STATUSES: readonly AttendanceStatus[] = ["present", "late", "online"];
export const EXCLUDED_STATUSES: readonly AttendanceStatus[] = ["excused", "leave", "exempt"];
/** Not attended and not authorised: the two that cost attendance. */
export const UNAUTHORISED_STATUSES: readonly AttendanceStatus[] = ["absent", "bunk"];

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  online: "Online",
  absent: "Absent",
  bunk: "Bunk",
  excused: "Excused",
  leave: "Leave",
  exempt: "Exempt",
};

/**
 * Single-letter register codes. They label the dense marking strip and double
 * as its keyboard shortcuts, so every letter must stay unique.
 */
export const ATTENDANCE_CODE: Record<AttendanceStatus, string> = {
  present: "P",
  late: "L",
  online: "O",
  absent: "A",
  bunk: "B",
  excused: "E",
  leave: "V",
  exempt: "X",
};

/** One line each, shown in the register legend and given to the marking agent as vocabulary. */
export const ATTENDANCE_HINT: Record<AttendanceStatus, string> = {
  present: "In the room for this period.",
  late: "Arrived after the register opened; still counts as attended.",
  online: "Joined the period remotely.",
  absent: "Not in school at all today, as far as this period knows.",
  bunk: "In school but skipped this period. Counts against attendance and needs following up on site.",
  excused: "Away with the school's permission; removed from the attendance denominator.",
  leave: "Approved leave; removed from the attendance denominator.",
  exempt: "Formally exempt from this period; an official reason is required.",
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
const UNAUTHORISED = new Set<string>(UNAUTHORISED_STATUSES);

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return typeof value === "string" && ALL.has(value);
}

export function isAttended(status: string): boolean {
  return ATTENDED.has(status);
}

export function isExcludedFromAttendance(status: string): boolean {
  return EXCLUDED.has(status);
}

/** Absent or bunk: the marks a percentage is actually lost to. */
export function isUnauthorised(status: string): boolean {
  return UNAUTHORISED.has(status);
}

/**
 * Anything a teacher or the office may still have to act on. Present and
 * online need nobody; everything else earns a line in the exceptions list.
 */
export function isException(status: string): boolean {
  return isAttendanceStatus(status) && status !== "present" && status !== "online";
}

/** An official reason is mandatory for a lesson exemption. */
export function requiresReason(status: string): boolean {
  return status === "exempt";
}

/**
 * A reason is kept only for these, so moving a student back to present cannot
 * leave a stale reason. Bunk carries one because "where was he" is the whole
 * point of the mark; unlike exempt it is not mandatory, since the teacher
 * often does not know yet.
 */
export function allowsReason(status: string): boolean {
  return status === "exempt" || status === "leave" || status === "bunk";
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
