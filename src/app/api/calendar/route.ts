/**
 * ICS feed for the viewer. Teachers get one event per lesson over the next
 * fourteen days; students get their class timetable over the same window plus
 * a window event per allocated test. Pure string building, Asia/Karachi local
 * times: period n starts 08:00 + (n - 1) x 45 min and runs 40 min.
 */
import { getViewer } from "@/lib/auth/viewer";
import { lessonsForTeacher } from "@/lib/data/mock/attendance";
import { TIMETABLE_G8B } from "@/lib/data/mock/comms";
import { classById, studentById, teacherById } from "@/lib/data/mock/people";
import { allocationsForStudent, testById } from "@/lib/data/mock/tests";
import { spaceById } from "@/lib/data/mock/spaces";
import type { TimetableEntry } from "@/lib/domain/types";

const TZ = "Asia/Karachi";
const DAYS_AHEAD = 14;
const PERIOD_START_MIN = 8 * 60;
const PERIOD_STEP_MIN = 45;
const PERIOD_LENGTH_MIN = 40;
const WEEKDAYS: TimetableEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

interface Event {
  uid: string;
  start: string; // local ICS datetime YYYYMMDDTHHMMSS
  end: string;
  summary: string;
  location?: string;
  description?: string;
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function localStamp(isoDate: string, minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${isoDate.replace(/-/g, "")}T${pad(h)}${pad(m)}00`;
}

function periodEvent(uid: string, date: string, period: number, summary: string, location: string, description?: string): Event {
  const start = PERIOD_START_MIN + (period - 1) * PERIOD_STEP_MIN;
  return { uid, start: localStamp(date, start), end: localStamp(date, start + PERIOD_LENGTH_MIN), summary, location, description };
}

function isoAddDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(iso: string): TimetableEntry["day"] | null {
  const d = new Date(`${iso}T00:00:00`).getDay();
  return d >= 1 && d <= 5 ? WEEKDAYS[d - 1] : null;
}

function upcomingDates(): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = 0; i < DAYS_AHEAD; i += 1) out.push(isoAddDays(now, i));
  return out;
}

function teacherEvents(teacherId: string): Event[] {
  const dates = new Set(upcomingDates());
  const events = lessonsForTeacher(teacherId)
    .filter((l) => dates.has(l.date))
    .map((l) => periodEvent(`${l.id}@sanad`, l.date, l.period, `${l.subject} · ${classById.get(l.classId)?.name ?? l.classId}`, l.room, `Period ${l.period}. Register: /portal/teach/attendance/${l.id}`));
  if (events.length) return events;
  return timetableEvents(TIMETABLE_G8B.filter((t) => t.teacherId === teacherId), (t) => `${t.subject} · ${classById.get(t.classId)?.name ?? t.classId}`);
}

function timetableEvents(entries: TimetableEntry[], summary: (t: TimetableEntry) => string): Event[] {
  const out: Event[] = [];
  for (const date of upcomingDates()) {
    const day = weekdayOf(date);
    if (!day) continue;
    for (const t of entries.filter((e) => e.day === day)) {
      out.push(periodEvent(`${t.classId}-${date}-p${t.period}@sanad`, date, t.period, summary(t), t.room, `Period ${t.period}${teacherById.get(t.teacherId) ? ` with ${teacherById.get(t.teacherId)?.name}` : ""}`));
    }
  }
  return out;
}

function testStamp(iso: string, endOfDay: boolean): string {
  const date = iso.slice(0, 10);
  const time = iso.length > 10 ? iso.slice(11, 16) : endOfDay ? "23:59" : "00:00";
  const [h, m] = time.split(":").map((x) => Number.parseInt(x, 10));
  return localStamp(date, h * 60 + m);
}

function studentEvents(studentId: string): Event[] {
  const student = studentById.get(studentId);
  if (!student) return [];
  const timetable = timetableEvents(TIMETABLE_G8B.filter((t) => t.classId === student.classId), (t) => t.subject);
  const tests = allocationsForStudent(studentId).flatMap((a) => {
    const test = testById.get(a.testId);
    if (!test) return [];
    const space = spaceById.get(test.spaceId);
    return [{
      uid: `${test.id}-${studentId}@sanad`,
      start: testStamp(test.opensAt, false),
      end: testStamp(test.closesAt, true),
      summary: `${test.title}${space ? ` · ${space.subject}` : ""}`,
      description: `Test window (${test.mode}). Status: ${a.status}. Open it at /portal/learn/tests`,
    }];
  });
  return [...timetable, ...tests];
}

function buildCalendar(name: string, events: Event[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sanad//School portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    `X-WR-TIMEZONE:${TZ}`,
  ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}`, `DTSTAMP:${now}`, `DTSTART;TZID=${TZ}:${e.start}`, `DTEND;TZID=${TZ}:${e.end}`, `SUMMARY:${escapeText(e.summary)}`);
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export async function GET() {
  const viewer = await getViewer();
  let events: Event[] = [];
  let name = "Sanad";
  if (viewer.role === "teacher") {
    events = teacherEvents(viewer.personId);
    name = `Sanad · ${teacherById.get(viewer.personId)?.name ?? "Lessons"}`;
  } else if (viewer.role === "student" && viewer.studentId) {
    events = studentEvents(viewer.studentId);
    name = `Sanad · ${classById.get(studentById.get(viewer.studentId)?.classId ?? "")?.name ?? "Timetable"}`;
  } else {
    return Response.json({ error: "No calendar for this seat." }, { status: 403 });
  }
  return new Response(buildCalendar(name, events), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'attachment; filename="sanad.ics"',
      "cache-control": "no-store",
    },
  });
}
