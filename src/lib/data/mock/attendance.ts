/**
 * Lessons and attendance marks. Lessons are the timetable unrolled over the
 * last ten school days plus today; past lessons carry a register that follows
 * each student's attendance profile in people.ts, so the class percentages,
 * the early-warning engine and the register agree. Single write path for the
 * attendance API. Production replaces this with edu_lessons / edu_attendance.
 */
import type { AttendanceMark, AttendanceStatus, Lesson } from "@/lib/domain/attendance";
import { allowsReason, attendancePercent, normaliseReason } from "@/lib/domain/attendance";
import type { TimetableEntry } from "@/lib/domain/types";
import { daysAgoISO } from "@/lib/utils";
import { singleton } from "../store";
import { TIMETABLE_G8B } from "./comms";
import { STUDENTS, studentsInClass } from "./people";
import { SPACES } from "./spaces";

const DAYS: TimetableEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SCHOOL_DAYS_BACK = 10;

function weekdayOf(iso: string): TimetableEntry["day"] | null {
  const d = new Date(`${iso}T00:00:00`).getDay();
  return d >= 1 && d <= 5 ? DAYS[d - 1] : null;
}

/** ISO dates of the last N school days, oldest first, ending today (if a weekday). */
export function recentSchoolDays(count = SCHOOL_DAYS_BACK): string[] {
  const out: string[] = [];
  for (let back = 0; out.length < count && back < count * 2; back += 1) {
    const iso = daysAgoISO(back);
    if (weekdayOf(iso)) out.unshift(iso);
  }
  return out;
}

function spaceFor(classId: string, subject: string): string | undefined {
  const key = subject.toLowerCase().replace(/[^a-z]/g, "");
  return SPACES.find((s) => s.classId === classId && (key.includes(s.subject.toLowerCase().replace(/[^a-z]/g, "")) || s.subject.toLowerCase().replace(/[^a-z]/g, "").includes(key)))?.id;
}

export function lessonId(classId: string, date: string, period: number): string {
  return `${classId}-${date}-p${period}`;
}

function seedLessons(): Lesson[] {
  const today = daysAgoISO(0);
  const out: Lesson[] = [];
  for (const date of recentSchoolDays(SCHOOL_DAYS_BACK + 1)) {
    const day = weekdayOf(date);
    if (!day) continue;
    for (const slot of TIMETABLE_G8B.filter((t) => t.day === day)) {
      const past = date < today;
      out.push({
        id: lessonId(slot.classId, date, slot.period),
        classId: slot.classId,
        spaceId: spaceFor(slot.classId, slot.subject),
        teacherId: slot.teacherId,
        subject: slot.subject,
        date,
        period: slot.period,
        room: slot.room,
        status: past ? "closed" : "scheduled",
        openedAt: past ? `${date}T08:${String(slot.period * 7).padStart(2, "0")}:00` : undefined,
        closedAt: past ? `${date}T08:${String(slot.period * 7 + 5).padStart(2, "0")}:00` : undefined,
      });
    }
  }
  return out;
}

/** Deterministic pseudo-random in [0,1) from a string, so registers are stable between renders. */
function hash01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Bands of the absent allowance, in the order they are tested. A bunk is rarer
 * than a plain absence and never happens in the first period of the day, which
 * is what makes it read as "signed in, then drifted".
 */
const BAND_ABSENT = 0.55;
const BAND_BUNK = 0.7;
const BAND_LATE = 0.85;
const BAND_EXCUSED = 0.95;
const FIRST_PERIOD = 1;

function seedMarks(lessons: Lesson[]): AttendanceMark[] {
  const out: AttendanceMark[] = [];
  // Local, because `lessonById` below is built from the same singleton this
  // function seeds and does not exist yet while it runs.
  const dateOf = new Map(lessons.map((l) => [l.id, l.date]));
  for (const lesson of lessons) {
    if (lesson.status !== "closed") continue;
    for (const s of studentsInClass(lesson.classId)) {
      const r = hash01(`${lesson.id}:${s.id}`);
      const absentBand = 1 - s.attendancePct / 100;
      let status: AttendanceStatus = "present";
      let note = "";
      if (r < absentBand * BAND_ABSENT) status = "absent";
      else if (r < absentBand * BAND_BUNK) {
        // A student already recorded absent earlier today cannot also be bunking.
        const bunkable = lesson.period > FIRST_PERIOD && !out.some((m) => m.studentId === s.id && m.status === "absent" && dateOf.get(m.lessonId) === lesson.date);
        status = bunkable ? "bunk" : "absent";
        if (bunkable) note = "Signed in this morning; not in the room";
      } else if (r < absentBand * BAND_LATE) status = "late";
      else if (r < absentBand * BAND_EXCUSED) status = "excused";
      else if (r < absentBand) {
        status = "leave";
        note = "Family travel, approved by the principal";
      }
      out.push({ lessonId: lesson.id, studentId: s.id, status, note, markedAt: lesson.closedAt ?? `${lesson.date}T09:00:00`, markedBy: lesson.teacherId });
    }
  }
  return out;
}

export const LESSONS: Lesson[] = singleton("lessons", seedLessons);
export const ATTENDANCE: AttendanceMark[] = singleton("attendance", () => seedMarks(LESSONS));
export const lessonById: Map<string, Lesson> = singleton("lessonById", () => new Map(LESSONS.map((l) => [l.id, l])));

export function lessonsForTeacher(teacherId: string, date?: string): Lesson[] {
  return LESSONS.filter((l) => l.teacherId === teacherId && (!date || l.date === date)).sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period);
}

export function lessonsForClass(classId: string): Lesson[] {
  return LESSONS.filter((l) => l.classId === classId).sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period);
}

export function marksForLesson(lessonId: string): AttendanceMark[] {
  return ATTENDANCE.filter((m) => m.lessonId === lessonId);
}

/** One pass for a whole day or a whole branch; the per-lesson filter is O(marks) each time. */
export function marksForLessons(lessonIds: Iterable<string>): Map<string, AttendanceMark[]> {
  const wanted = new Set(lessonIds);
  const out = new Map<string, AttendanceMark[]>();
  for (const id of wanted) out.set(id, []);
  for (const mark of ATTENDANCE) out.get(mark.lessonId)?.push(mark);
  return out;
}

export function marksForStudent(studentId: string): AttendanceMark[] {
  return ATTENDANCE.filter((m) => m.studentId === studentId);
}

/** Percent from the recorded register; falls back to the profile figure when no lessons are marked. */
export function attendancePctFor(studentId: string): number {
  const pct = attendancePercent(marksForStudent(studentId).map((m) => m.status));
  return pct ?? STUDENTS.find((s) => s.id === studentId)?.attendancePct ?? 0;
}

export function openLesson(lesson: Lesson, now: string): void {
  if (lesson.status === "scheduled") {
    lesson.status = "open";
    lesson.openedAt = now;
  }
  if (!marksForLesson(lesson.id).length) {
    for (const s of studentsInClass(lesson.classId)) ATTENDANCE.push({ lessonId: lesson.id, studentId: s.id, status: "present", note: "", markedAt: now, markedBy: lesson.teacherId });
  }
}

export function closeLesson(lesson: Lesson, now: string): void {
  lesson.status = "closed";
  lesson.closedAt = now;
}

export function reopenLesson(lesson: Lesson): void {
  lesson.status = "open";
  lesson.closedAt = undefined;
}

export function setMark(lesson: Lesson, studentId: string, status: AttendanceStatus, note: string, by: string, now: string): AttendanceMark {
  const clean = allowsReason(status) ? normaliseReason(note) : "";
  const existing = ATTENDANCE.find((m) => m.lessonId === lesson.id && m.studentId === studentId);
  if (existing) {
    existing.status = status;
    existing.note = clean;
    existing.markedAt = now;
    existing.markedBy = by;
    return existing;
  }
  const mark: AttendanceMark = { lessonId: lesson.id, studentId, status, note: clean, markedAt: now, markedBy: by };
  ATTENDANCE.push(mark);
  return mark;
}

/** Bulk: every student in the lesson to one status (the "all present" shortcut). */
export function setAll(lesson: Lesson, status: AttendanceStatus, by: string, now: string): void {
  for (const s of studentsInClass(lesson.classId)) setMark(lesson, s.id, status, "", by, now);
}
