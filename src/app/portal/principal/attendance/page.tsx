import { CalendarCheck, ClipboardCheck, DoorOpen, Percent, UserX } from "lucide-react";
import { ATTENDANCE_DANGER, attendanceClass } from "@/components/attend/roster-table";
import { ClassTable, ExceptionTable, PeriodTable, UnclosedList } from "@/components/attendance/branch-rollup";
import { StatusLegend } from "@/components/attendance/status-codes";
import { canSeeBranchStaff, SeatDenied } from "@/components/leadership/seat-guard";
import { fmtDay } from "@/components/teach/helpers";
import { Avatar, Chip, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { branchRollup } from "@/lib/data/attendance-register";
import { attendancePctFor, marksForStudent } from "@/lib/data/mock/attendance";
import { STUDENTS } from "@/lib/data/mock/people";
import { isExcludedFromAttendance } from "@/lib/domain/attendance";
import { cn, todayISO } from "@/lib/utils";

const DEMO_BRANCH: BranchId = "gulberg";
const CONCERN_THRESHOLD = 85;
const REASON_CHIPS_MAX = 2;

/** Notes attached to the student's most recent leave / exempt marks, newest first. */
function recentReasons(studentId: string): string[] {
  return marksForStudent(studentId)
    .filter((m) => isExcludedFromAttendance(m.status) && m.note)
    .sort((a, b) => b.markedAt.localeCompare(a.markedAt))
    .slice(0, REASON_CHIPS_MAX)
    .map((m) => m.note);
}

export default async function PrincipalAttendancePage() {
  const viewer = await getViewer();
  if (!canSeeBranchStaff(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const today = todayISO();
  const rollup = branchRollup(branchId, today);

  const classNames = new Map(rollup.classes.map((c) => [c.classId, c.className]));
  const concerns = STUDENTS.filter((s) => s.branchId === branchId)
    .map((s) => ({ student: s, attendance: attendancePctFor(s.id), reasons: recentReasons(s.id), className: classNames.get(s.classId) ?? "" }))
    .filter((r) => r.attendance < CONCERN_THRESHOLD)
    .sort((a, b) => a.attendance - b.attendance || a.student.name.localeCompare(b.student.name));

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow={`Principal · ${branchName(branchId)}`}
        title="Attendance today"
        description={`${fmtDay(today)} · ${rollup.lessons} lesson${rollup.lessons === 1 ? "" : "s"} across ${rollup.classes.length} classes. Registers are read-only here; teachers mark them.`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
        <Stat label="Lessons today" value={rollup.lessons} icon={<CalendarCheck size={18} />} tone="accent" />
        <Stat
          label="Registers closed"
          value={rollup.closed}
          trend={`of ${rollup.lessons}`}
          icon={<ClipboardCheck size={18} />}
          tone={rollup.closed === rollup.lessons && rollup.lessons ? "ok" : "warn"}
        />
        <Stat label="Attendance today" value={rollup.pct === null ? "—" : `${rollup.pct}%`} trend="across closed and open registers" icon={<Percent size={18} />} tone="info" />
        <Stat label="Absent today" value={rollup.absentStudents} trend="not in school at all" icon={<UserX size={18} />} tone={rollup.absentStudents ? "danger" : "ok"} />
        <Stat label="Bunked today" value={rollup.bunkStudents} trend="in school, not in the room" icon={<DoorOpen size={18} />} tone={rollup.bunkStudents ? "gold" : "ok"} />
      </div>

      <section>
        <SectionTitle title="Needs action" hint="Bunks first, then repeat absence, then repeat lateness. Every row opens the register it came from." />
        <ExceptionTable rows={rollup.exceptions} />
      </section>

      <section>
        <SectionTitle title="By period" hint="A campus can average well and still lose one period of the day." />
        <PeriodTable rows={rollup.periods} />
      </section>

      <section>
        <SectionTitle title="By class" hint="Today only. Percentages count present, late and online against everything except approved leave." />
        <ClassTable rows={rollup.classes} />
      </section>

      <section>
        <SectionTitle title="Registers still open" hint="Nobody has closed these yet; the teacher who owns the period is named." />
        <UnclosedList rows={rollup.unclosed} />
      </section>

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
                      {r.reasons.map((n) => (
                        <Chip key={n} tone="neutral">
                          {n}
                        </Chip>
                      ))}
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

      <section>
        <SectionTitle title="Register codes" hint="The same codes teachers mark with." />
        <div className="card-quiet p-4">
          <StatusLegend />
        </div>
      </section>
    </div>
  );
}
