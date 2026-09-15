import { CalendarCheck, ClipboardList, DoorOpen, Percent, UserX } from "lucide-react";
import { LessonList, summaryLine, type LessonRow } from "@/components/attend/lesson-list";
import { Denied } from "@/components/teach/guard";
import { PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { lessonsForTeacher, marksForLesson } from "@/lib/data/mock/attendance";
import { classById } from "@/lib/data/mock/people";
import { attendancePercent, type Lesson } from "@/lib/domain/attendance";
import { daysAgoISO, todayISO } from "@/lib/utils";

const RECENT_LIMIT = 15;

function toRow(lesson: Lesson): LessonRow {
  return {
    id: lesson.id,
    period: lesson.period,
    subject: lesson.subject,
    className: classById.get(lesson.classId)?.name ?? lesson.classId,
    room: lesson.room,
    date: lesson.date,
    status: lesson.status,
    summary: lesson.status === "closed" ? summaryLine(marksForLesson(lesson.id).map((m) => m.status)) : undefined,
  };
}

/** ISO date of this week's Monday (today when it is Monday). */
function weekStartISO(): string {
  const day = new Date().getDay();
  return daysAgoISO((day + 6) % 7);
}

export default async function TeacherAttendancePage() {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;

  const today = todayISO();
  const all = lessonsForTeacher(viewer.personId);
  const todays = all.filter((l) => l.date === today);
  const recent = all
    .filter((l) => l.date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.period - a.period)
    .slice(0, RECENT_LIMIT);

  const pending = todays.filter((l) => l.status !== "closed").length;
  const weekStart = weekStartISO();
  const weekPct = attendancePercent(all.filter((l) => l.status === "closed" && l.date >= weekStart).flatMap((l) => marksForLesson(l.id).map((m) => m.status)));
  const marksToday = todays.flatMap((l) => marksForLesson(l.id));
  const absentToday = new Set(marksToday.filter((m) => m.status === "absent").map((m) => m.studentId)).size;
  const bunkToday = new Set(marksToday.filter((m) => m.status === "bunk").map((m) => m.studentId)).size;

  return (
    <>
      <PageHeader eyebrow="Teacher" title="Attendance" description={`${todays.length} lesson${todays.length === 1 ? "" : "s"} today · ${pending} register${pending === 1 ? "" : "s"} still to close.`} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
        <Stat label="Lessons today" value={todays.length} icon={<CalendarCheck size={18} />} tone="accent" />
        <Stat label="Registers open" value={pending} trend="not yet closed today" icon={<ClipboardList size={18} />} tone={pending ? "warn" : "ok"} />
        <Stat label="This week" value={weekPct === null ? "—" : `${weekPct}%`} trend="attendance across closed lessons" icon={<Percent size={18} />} tone="info" />
        <Stat label="Absent today" value={absentToday} trend="not in school at all" icon={<UserX size={18} />} tone={absentToday ? "danger" : "ok"} />
        <Stat label="Bunked today" value={bunkToday} trend="in school, not in the room" icon={<DoorOpen size={18} />} tone={bunkToday ? "gold" : "ok"} />
      </div>

      <section>
        <SectionTitle title="Today" hint="Open a register at the start of the period; close it before the next one." />
        <LessonList rows={todays.map(toRow)} emptyTitle="No lessons today" emptyBody="Nothing timetabled for you today. Recent registers stay available below." />
      </section>

      <section>
        <SectionTitle title="Recent" hint={`Last ${recent.length} lessons, newest first.`} />
        <LessonList rows={recent.map(toRow)} showDate emptyTitle="No recent lessons" />
      </section>
    </>
  );
}
