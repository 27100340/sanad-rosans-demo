import { CalendarCheck, ClipboardCheck, Percent, UserX } from "lucide-react";
import { LESSON_STATUS } from "@/components/attend/lesson-list";
import { ATTENDANCE_DANGER, attendanceClass } from "@/components/attend/roster-table";
import { canSeeBranchStaff, SeatDenied } from "@/components/leadership/seat-guard";
import { fmtDay } from "@/components/teach/helpers";
import { Avatar, Chip, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { attendancePctFor, lessonsForClass, marksForLesson, marksForStudent } from "@/lib/data/mock/attendance";
import { STUDENTS, studentById, teacherById } from "@/lib/data/mock/people";
import { classesForBranch } from "@/lib/data/repo";
import { attendancePercent, isExcludedFromAttendance, summarise, type Lesson } from "@/lib/domain/attendance";
import { cn, todayISO } from "@/lib/utils";

const DEMO_BRANCH: BranchId = "gulberg";
const CONCERN_THRESHOLD = 85;
const ABSENT_NAMES_MAX = 5;
const REASON_CHIPS_MAX = 2;

function absentNames(lesson: Lesson): string[] {
  return marksForLesson(lesson.id)
    .filter((m) => m.status === "absent")
    .map((m) => studentById.get(m.studentId)?.firstName ?? m.studentId);
}

/** Notes attached to the student's most recent leave / exempt marks, newest first. */
function recentReasons(studentId: string): string[] {
  return marksForStudent(studentId)
    .filter((m) => isExcludedFromAttendance(m.status) && m.note)
    .sort((a, b) => b.markedAt.localeCompare(a.markedAt))
    .slice(0, REASON_CHIPS_MAX)
    .map((m) => m.note);
}

function ClassRegister({ name, lessons }: { name: string; lessons: Lesson[] }) {
  return (
    <section>
      <SectionTitle title={name} hint={lessons.length ? `${lessons.length} lesson${lessons.length === 1 ? "" : "s"} today` : undefined} />
      {lessons.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Status</th>
                <th className="text-right">Present</th>
                <th className="text-right">Late</th>
                <th className="text-right">Absent</th>
                <th>Absent students</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => {
                const st = LESSON_STATUS[l.status];
                const counts = summarise(marksForLesson(l.id));
                const names = absentNames(l);
                return (
                  <tr key={l.id}>
                    <td className="num">P{l.period}</td>
                    <td className="whitespace-nowrap font-medium">{l.subject}</td>
                    <td className="whitespace-nowrap text-ink-2">{teacherById.get(l.teacherId)?.name ?? l.teacherId}</td>
                    <td><Chip tone={st.tone}>{st.label}</Chip></td>
                    <td className="num text-right">{counts.present + counts.online}</td>
                    <td className={cn("num text-right", counts.late && "text-warn")}>{counts.late}</td>
                    <td className={cn("num text-right", counts.absent && "text-danger")}>{counts.absent}</td>
                    <td>
                      <span className="flex flex-wrap gap-1">
                        {names.slice(0, ABSENT_NAMES_MAX).map((n, i) => <Chip key={`${n}-${i}`} tone="danger">{n}</Chip>)}
                        {names.length > ABSENT_NAMES_MAX ? <Chip tone="neutral">+{names.length - ABSENT_NAMES_MAX}</Chip> : null}
                        {!names.length ? <span className="text-xs text-ink-3">—</span> : null}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="card-quiet px-4 py-3 text-xs text-ink-3">No lessons timetabled today.</p>
      )}
    </section>
  );
}

export default async function PrincipalAttendancePage() {
  const viewer = await getViewer();
  if (!canSeeBranchStaff(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const today = todayISO();

  const classes = classesForBranch(branchId).map((c) => ({ id: c.id, name: c.name, lessons: lessonsForClass(c.id).filter((l) => l.date === today) }));
  const todays = classes.flatMap((c) => c.lessons);
  const closed = todays.filter((l) => l.status === "closed").length;
  const marks = todays.flatMap((l) => marksForLesson(l.id));
  const pct = attendancePercent(marks.map((m) => m.status));
  const absent = new Set(marks.filter((m) => m.status === "absent").map((m) => m.studentId)).size;

  const concerns = STUDENTS.filter((s) => s.branchId === branchId)
    .map((s) => ({ student: s, attendance: attendancePctFor(s.id), reasons: recentReasons(s.id), className: classes.find((c) => c.id === s.classId)?.name ?? "" }))
    .filter((r) => r.attendance < CONCERN_THRESHOLD)
    .sort((a, b) => a.attendance - b.attendance || a.student.name.localeCompare(b.student.name));

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow={`Principal · ${branchName(branchId)}`} title="Attendance today" description={`${fmtDay(today)} · ${todays.length} lesson${todays.length === 1 ? "" : "s"} across ${classes.length} classes. Registers are read-only here; teachers mark them.`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Lessons today" value={todays.length} icon={<CalendarCheck size={18} />} tone="accent" />
        <Stat label="Registers closed" value={closed} trend={`of ${todays.length}`} icon={<ClipboardCheck size={18} />} tone={closed === todays.length && todays.length ? "ok" : "warn"} />
        <Stat label="Attendance today" value={pct === null ? "—" : `${pct}%`} trend="across closed and open registers" icon={<Percent size={18} />} tone="info" />
        <Stat label="Absent today" value={absent} trend="distinct students" icon={<UserX size={18} />} tone={absent ? "danger" : "ok"} />
      </div>

      {classes.map((c) => <ClassRegister key={c.id} name={c.name} lessons={c.lessons} />)}

      <section>
        <SectionTitle title={`Students under ${CONCERN_THRESHOLD}% this term`} hint="Lowest first; the latest recorded leave or exemption reason is shown where one exists." />
        {concerns.length ? (
          <div className="card divide-y divide-line">
            {concerns.map((r) => (
              <div key={r.student.id} className="flex items-center gap-3 p-4">
                <Avatar name={r.student.name} size="sm" tone={r.attendance < ATTENDANCE_DANGER ? "danger" : "warn"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{r.student.name}</p>
                  <p className="truncate text-xs text-ink-3">{r.className || "Hifz"}</p>
                  {r.reasons.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {r.reasons.map((n) => <Chip key={n} tone="neutral">{n}</Chip>)}
                    </div>
                  ) : null}
                </div>
                <span className={cn("num text-base font-semibold", attendanceClass(r.attendance))}>{r.attendance}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="card-quiet px-4 py-3 text-xs text-ink-3">Nobody is under {CONCERN_THRESHOLD}% this term.</p>
        )}
      </section>
    </div>
  );
}
