import { CalendarCheck, ClipboardList, Flame, LineChart, MessageSquareText } from "lucide-react";
import { LinkButton, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { classById, studentById } from "@/lib/data/mock/people";
import { AHMED_NUDGE, AHMED_STREAK_DAYS } from "@/lib/data/mock/learn-extra";
import { Denied, isLearner } from "@/components/teach/guard";
import { todayWeekday } from "@/components/teach/helpers";
import { TodayTasks, tasksForStudent } from "@/components/learn/today-tasks";
import { TimetableToday, timetableFor } from "@/components/learn/timetable-today";

export default async function LearnTodayPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const className = classById.get(student.classId)?.name ?? "";
  const tasks = tasksForStudent(student);
  const due = tasks.filter((t) => t.state === "due").length;
  const day = todayWeekday();
  const periods = timetableFor(student.classId, day);

  return (
    <>
      <PageHeader eyebrow={`Today · ${className}`} title={`Assalamu alaikum, ${student.firstName}`} description="Tasks, today's periods and one nudge from your tutor." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Attendance" value={`${student.attendancePct}%`} trend="this term" icon={<CalendarCheck size={18} />} tone="ok" />
        <Stat label="Average" value={`${student.avgMark}%`} trend={`${student.markTrend > 0 ? "+" : ""}${student.markTrend} since last term`} icon={<LineChart size={18} />} tone="accent" />
        <Stat label="Streak" value={`${AHMED_STREAK_DAYS} days`} trend="tutor sessions" icon={<Flame size={18} />} tone="gold" />
        <Stat label="Tasks due" value={due} trend={`${tasks.length} in total`} icon={<ClipboardList size={18} />} tone={due ? "warn" : "ok"} />
      </div>

      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="tile-accent">
            <MessageSquareText size={18} />
          </span>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-accent">From your Mathematics tutor</p>
            <p className="mt-1 text-sm text-ink">{AHMED_NUDGE}</p>
          </div>
        </div>
        <LinkButton href="/portal/learn/tutor" variant="soft" className="shrink-0">
          Start the drill
        </LinkButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Tasks" hint="Across all your subject spaces." />
          <TodayTasks tasks={tasks} />
        </section>
        <section>
          <SectionTitle title={`Timetable · ${day}`} hint="Periods for today." />
          <TimetableToday rows={periods} />
        </section>
      </div>
    </>
  );
}
