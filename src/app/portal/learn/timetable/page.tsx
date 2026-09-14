import { CalendarDays, CalendarPlus, ClipboardList, Users } from "lucide-react";
import { Denied, isLearner } from "@/components/teach/guard";
import { WeekGrid, type WeekCell, type WeekDay } from "@/components/teach/week-grid";
import { PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { TIMETABLE_G8B } from "@/lib/data/mock/comms";
import { classById, studentById, teacherById } from "@/lib/data/mock/people";
import { allocationsForStudent, testById } from "@/lib/data/mock/tests";
import type { TimetableEntry } from "@/lib/domain/types";
import { daysAgoISO, todayISO } from "@/lib/utils";
import { shortName } from "@/components/leadership/format";

const WEEKDAYS: TimetableEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function thisWeek(): WeekDay[] {
  const today = todayISO();
  const dow = new Date().getDay();
  const mondayBack = dow === 0 ? -1 : dow === 6 ? -2 : dow - 1;
  return WEEKDAYS.map((day, i) => {
    const date = daysAgoISO(mondayBack - i);
    return { day, date, label: new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), today: date === today };
  });
}

export default async function StudentTimetablePage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const className = classById.get(student.classId)?.name ?? student.classId;
  const entries = TIMETABLE_G8B.filter((t) => t.classId === student.classId);
  const cells: WeekCell[] = entries.map((e) => ({ day: e.day, period: e.period, subject: e.subject, className: shortName(teacherById.get(e.teacherId)?.name ?? ""), room: e.room }));
  const today = todayISO();
  const upcoming = allocationsForStudent(student.id).flatMap((a) => {
    const t = testById.get(a.testId);
    return t && (a.status === "not-started" || a.status === "in-progress") && t.closesAt >= today ? [t] : [];
  });

  return (
    <>
      <PageHeader
        eyebrow={`Timetable · ${className}`}
        title="Your week"
        description="Periods with the teacher and room. Subscribe once and every lesson and test window lands in your phone's calendar."
        actions={
          <a href="/api/calendar" className="btn-outline" download="sanad.ics">
            <CalendarPlus size={14} /> Add to calendar (.ics)
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Periods a week" value={entries.length} icon={<CalendarDays size={18} />} tone="accent" />
        <Stat label="Subjects" value={new Set(entries.map((e) => e.subject)).size} icon={<Users size={18} />} tone="info" />
        <Stat label="Tests open" value={upcoming.length} trend="in your calendar too" icon={<ClipboardList size={18} />} tone={upcoming.length ? "warn" : "ok"} />
      </div>

      <section>
        <SectionTitle title="This week" hint="Today's column is highlighted." />
        <WeekGrid days={thisWeek()} cells={cells} />
      </section>
    </>
  );
}
