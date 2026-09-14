import Link from "next/link";
import { LESSON_STATUS } from "@/components/attend/lesson-list";
import { Card, EmptyState } from "@/components/ui/primitives";
import { TIMETABLE_PERIODS } from "@/lib/data/mock/leadership-extra";
import type { LessonStatus } from "@/lib/domain/attendance";
import type { TimetableEntry } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export interface WeekDay {
  day: TimetableEntry["day"];
  date: string; // ISO
  label: string; // "Mon 14 Sep"
  today: boolean;
}

export interface WeekCell {
  day: TimetableEntry["day"];
  period: number;
  subject: string;
  className: string;
  room: string;
  /** Set when a lesson record exists for that date, so the cell links to its register. */
  lessonId?: string;
  status?: LessonStatus;
}

/** The teacher's own week: periods as rows, Mon to Fri as columns; today's column is highlighted. */
export function WeekGrid({ days, cells }: { days: WeekDay[]; cells: WeekCell[] }) {
  if (!cells.length) return <EmptyState title="No periods timetabled" body="The demo carries the Grade 8-B timetable. Your week fills in once the school's timetable is imported." />;
  const lookup = new Map(cells.map((c) => [`${c.day}-${c.period}`, c]));
  return (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="table min-w-[44rem]">
          <thead>
            <tr>
              <th className="w-16">Period</th>
              {days.map((d) => (
                <th key={d.day} className={cn(d.today && "text-accent")}>
                  {d.label}
                  {d.today ? <span className="ml-1.5 normal-case tracking-normal text-2xs font-medium">· today</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMETABLE_PERIODS.map((p) => (
              <tr key={p}>
                <td className="num font-medium text-ink-3">{p}</td>
                {days.map((d) => {
                  const cell = lookup.get(`${d.day}-${p}`);
                  if (!cell) return <td key={d.day} className={cn("text-xs text-ink-3", d.today && "bg-accent-soft/30")}>Free</td>;
                  const st = cell.status ? LESSON_STATUS[cell.status] : null;
                  const inner = (
                    <>
                      <p className="text-sm font-medium text-ink">{cell.subject}</p>
                      <p className="text-xs text-ink-3">
                        {cell.className} · {cell.room}
                      </p>
                      {st ? <p className={cn("mt-1 text-2xs font-semibold", st.tone === "ok" ? "text-ok" : st.tone === "warn" ? "text-warn" : "text-ink-3")}>{st.label}</p> : null}
                    </>
                  );
                  return (
                    <td key={d.day} className={cn(d.today && "bg-accent-soft/30")}>
                      {cell.lessonId ? (
                        <Link href={`/portal/teach/attendance/${cell.lessonId}`} className="block rounded-lg -m-1 p-1 transition-colors hover:bg-surface-2">
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
