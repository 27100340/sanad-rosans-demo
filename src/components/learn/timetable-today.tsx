import type { TimetableEntry } from "@/lib/domain/types";
import { TIMETABLE_G8B } from "@/lib/data/mock/comms";
import { teacherById } from "@/lib/data/mock/people";

export interface PeriodRow {
  period: number;
  subject: string;
  teacherName: string;
  room: string;
}

export function timetableFor(classId: string, day: TimetableEntry["day"]): PeriodRow[] {
  return TIMETABLE_G8B.filter((e) => e.classId === classId && e.day === day)
    .sort((a, b) => a.period - b.period)
    .map((e) => ({ period: e.period, subject: e.subject, teacherName: teacherById.get(e.teacherId)?.name ?? "", room: e.room }));
}

export function TimetableToday({ rows }: { rows: PeriodRow[] }) {
  if (!rows.length) return <p className="text-sm text-ink-3">No periods scheduled.</p>;
  return (
    <div className="card divide-y divide-line">
      {rows.map((r) => (
        <div key={r.period} className="flex items-center gap-4 px-4 py-3">
          <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-semibold text-ink-2">{r.period}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{r.subject}</p>
            <p className="truncate text-xs text-ink-3">{r.teacherName}</p>
          </div>
          <span className="shrink-0 text-xs text-ink-3">{r.room}</span>
        </div>
      ))}
    </div>
  );
}
