/**
 * The principal's reading of one campus day: where attendance sits per class
 * and per period, which registers nobody has closed, and the individual marks
 * that need somebody to act. Presentation only — `branchRollup` in
 * lib/data/attendance-register does the counting.
 *
 * The per-period table is the one worth having: a class that averages well can
 * still leak a particular period, and that is what a bunk looks like from the
 * office.
 */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LESSON_STATUS } from "@/components/attend/lesson-list";
import { attendanceClass } from "@/components/attend/roster-table";
import { Chip, EmptyState } from "@/components/ui/primitives";
import type { ClassRow, ExceptionRow, PeriodRow, UnclosedRow } from "@/lib/data/attendance-register";
import { ATTENDANCE_LABEL, ATTENDANCE_STATUSES, isException, type AttendanceStatus } from "@/lib/domain/attendance";
import { cn } from "@/lib/utils";
import { StatusCode, statusSoft } from "./status-codes";

/** The four columns a register is read by; everything else is folded into "other". */
const HEADLINE_STATUSES: readonly AttendanceStatus[] = ["present", "late", "absent", "bunk"];
const OTHER_STATUSES = ATTENDANCE_STATUSES.filter((s) => !HEADLINE_STATUSES.includes(s));

function registerHref(lessonId: string): string {
  return `/portal/teach/attendance/${lessonId}`;
}

function PercentCell({ pct }: { pct: number | null }) {
  return <td className={cn("num text-right font-semibold", pct === null ? "text-ink-3" : attendanceClass(pct))}>{pct === null ? "—" : `${pct}%`}</td>;
}

function CountCells({ counts }: { counts: Record<AttendanceStatus, number> }) {
  const other = OTHER_STATUSES.reduce((sum, s) => sum + counts[s], 0);
  return (
    <>
      {HEADLINE_STATUSES.map((status) => (
        <td key={status} className={cn("num text-right", counts[status] && isException(status) ? "font-semibold" : "text-ink-3")}>
          {counts[status] || "—"}
        </td>
      ))}
      <td className="num text-right text-ink-3">{other || "—"}</td>
    </>
  );
}

function CountHeadings() {
  return (
    <>
      {HEADLINE_STATUSES.map((status) => (
        <th key={status} className="text-right" title={ATTENDANCE_LABEL[status]}>
          <span className="inline-flex items-center gap-1">
            <StatusCode status={status} />
            <span className="hidden sm:inline">{ATTENDANCE_LABEL[status]}</span>
          </span>
        </th>
      ))}
      <th className="text-right" title={OTHER_STATUSES.map((s) => ATTENDANCE_LABEL[s]).join(", ")}>
        Other
      </th>
    </>
  );
}

export function PeriodTable({ rows }: { rows: PeriodRow[] }) {
  if (!rows.length) return <EmptyState title="No periods timetabled today" />;
  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Registers</th>
            <th className="text-right">Attendance</th>
            <CountHeadings />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.period}>
              <td className="num whitespace-nowrap font-medium">P{row.period}</td>
              <td className="num whitespace-nowrap text-ink-2">
                {row.closed} of {row.lessons} closed
              </td>
              <PercentCell pct={row.pct} />
              <CountCells counts={row.counts} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClassTable({ rows }: { rows: ClassRow[] }) {
  if (!rows.length) return <EmptyState title="No classes with a timetable today" />;
  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Class</th>
            <th>Registers</th>
            <th className="text-right">Attendance</th>
            <CountHeadings />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.classId}>
              <td className="whitespace-nowrap font-medium">{row.className}</td>
              <td className="num whitespace-nowrap text-ink-2">
                {row.closed} of {row.lessons.length} closed
              </td>
              <PercentCell pct={row.pct} />
              <CountCells counts={row.counts} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExceptionTable({ rows }: { rows: ExceptionRow[] }) {
  if (!rows.length) return <p className="card-quiet px-4 py-3 text-xs text-ink-3">Nothing on today&rsquo;s registers needs following up.</p>;
  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Class</th>
            <th>Period</th>
            <th>Mark</th>
            <th>Why it is here</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="whitespace-nowrap font-medium">{row.studentName}</td>
              <td className="whitespace-nowrap text-ink-2">{row.className}</td>
              <td className="num whitespace-nowrap text-ink-2">
                P{row.period} · {row.subject}
              </td>
              <td>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-2xs font-semibold", statusSoft(row.status))}>
                  <StatusCode status={row.status} />
                  {ATTENDANCE_LABEL[row.status]}
                </span>
              </td>
              <td className="text-xs text-ink-2">{row.reason}</td>
              <td className="text-right">
                <Link href={registerHref(row.lessonId)} className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-accent">
                  Register <ArrowUpRight size={13} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UnclosedList({ rows }: { rows: UnclosedRow[] }) {
  if (!rows.length) return <p className="card-quiet px-4 py-3 text-xs text-ink-3">Every register timetabled today has been closed.</p>;
  return (
    <div className="card divide-y divide-line">
      {rows.map((row) => {
        const st = LESSON_STATUS[row.status];
        return (
          <div key={row.lessonId} className="flex items-center gap-3 p-3 sm:p-4">
            <span className="tile-neutral num text-sm font-semibold">P{row.period}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {row.subject} <span className="font-normal text-ink-3">· {row.className}</span>
              </p>
              <p className="truncate text-xs text-ink-3">{row.teacherName}</p>
            </div>
            <Chip tone={st.tone}>{st.label}</Chip>
            <Link href={registerHref(row.lessonId)} className="inline-flex shrink-0 items-center gap-1 text-xs text-accent">
              Open <ArrowUpRight size={13} />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
