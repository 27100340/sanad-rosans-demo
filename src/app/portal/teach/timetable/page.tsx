import { CalendarDays, CalendarPlus, ClipboardList, Users } from "lucide-react";
import { LessonList, summaryLine, type LessonRow } from "@/components/attend/lesson-list";
import { Denied } from "@/components/teach/guard";
import { WeekGrid, type WeekCell, type WeekDay } from "@/components/teach/week-grid";
import { PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { lessonById, lessonId, lessonsForTeacher, marksForLesson } from "@/lib/data/mock/attendance";
import { TIMETABLE_G8B } from "@/lib/data/mock/comms";
import { classById } from "@/lib/data/mock/people";
import type { TimetableEntry } from "@/lib/domain/types";
import { daysAgoISO, todayISO } from "@/lib/utils";

const WEEKDAYS: TimetableEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** Mon to Fri of the current week (the coming week when opened at the weekend). */
function thisWeek(): WeekDay[] {
  const today = todayISO();
  const dow = new Date().getDay(); // 0 = Sunday
  const mondayBack = dow === 0 ? -1 : dow === 6 ? -2 : dow - 1;
  return WEEKDAYS.map((day, i) => {
    const date = daysAgoISO(mondayBack - i);
    const label = new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    return { day, date, label, today: date === today };
  });
}

export default async function TeacherTimetablePage() {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;

  const days = thisWeek();
  const dateOf = new Map(days.map((d) => [d.day, d.date]));
  const entries = TIMETABLE_G8B.filter((t) => t.teacherId === viewer.personId);
  const cells: WeekCell[] = entries.map((e) => {
    const lesson = lessonById.get(lessonId(e.classId, dateOf.get(e.day) ?? "", e.period));
    return { day: e.day, period: e.period, subject: e.subject, className: classById.get(e.classId)?.name ?? e.classId, room: e.room, lessonId: lesson?.id, status: lesson?.status };
  });

  const today = todayISO();
  const todays: LessonRow[] = lessonsForTeacher(viewer.personId, today).map((l) => ({
    id: l.id,
    period: l.period,
    subject: l.subject,
    className: classById.get(l.classId)?.name ?? l.classId,
    room: l.room,
    date: l.date,
    status: l.status,
    summary: l.status === "closed" ? summaryLine(marksForLesson(l.id).map((m) => m.status)) : undefined,
  }));
  const classes = new Set(entries.map((e) => e.classId)).size;
  const open = todays.filter((l) => l.status !== "closed").length;

  return (
    <>
      <PageHeader
        eyebrow="Teacher"
        title="Timetable"
        description="Your week, period by period. Cells with a register link straight to it."
        actions={
          <a href="/api/calendar" className="btn-outline" download="sanad.ics">
            <CalendarPlus size={14} /> Add to calendar (.ics)
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Periods a week" value={entries.length} icon={<CalendarDays size={18} />} tone="accent" />
        <Stat label="Classes" value={classes} trend="on your timetable" icon={<Users size={18} />} tone="info" />
        <Stat label="Lessons today" value={todays.length} icon={<ClipboardList size={18} />} tone="neutral" />
        <Stat label="Registers open" value={open} trend="still to close today" icon={<ClipboardList size={18} />} tone={open ? "warn" : "ok"} />
      </div>

      <section>
        <SectionTitle title="This week" hint="The calendar feed carries the next fourteen days and the exact register links." />
        <WeekGrid days={days} cells={cells} />
      </section>

      <section>
        <SectionTitle title="Today" hint="Open a register at the start of the period; close it before the next one." />
        <LessonList rows={todays} emptyTitle="No lessons today" emptyBody="Nothing timetabled for you today." />
      </section>
    </>
  );
}
