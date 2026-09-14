import { Avatar, Chip, EmptyState, Trend, type Tone } from "@/components/ui/primitives";
import { ATTENDANCE_LABEL, type AttendanceStatus } from "@/lib/domain/attendance";
import type { RiskLevel } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { statusTone } from "./lesson-list";

export interface RosterRow {
  studentId: string;
  name: string;
  attendance: number;
  trend: number;
  avgMark: number;
  /** Mean mastery across this space's syllabus codes; null when nothing assessed yet. */
  mastery: number | null;
  risk: RiskLevel | null;
  /** Oldest to newest, at most RECENT_MARKS entries. */
  recent: AttendanceStatus[];
}

export const RECENT_MARKS = 8;
export const ATTENDANCE_WARN = 90;
export const ATTENDANCE_DANGER = 80;

const LEVEL_TONE: Record<RiskLevel, Tone> = { high: "danger", medium: "warn", watch: "neutral" };
const LEVEL_LABEL: Record<RiskLevel, string> = { high: "High", medium: "Medium", watch: "Watch" };

const SQUARE_CLASS: Record<Tone, string> = {
  accent: "bg-accent",
  gold: "bg-gold",
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-surface-3",
};

export function attendanceClass(pct: number): string {
  if (pct < ATTENDANCE_DANGER) return "text-danger";
  if (pct < ATTENDANCE_WARN) return "text-warn";
  return "text-ink";
}

function RecentStrip({ marks }: { marks: AttendanceStatus[] }) {
  if (!marks.length) return <span className="text-xs text-ink-3">—</span>;
  return (
    <div className="flex items-center gap-1" aria-label={`Last ${marks.length} marks`}>
      {marks.map((m, i) => (
        <span key={i} title={ATTENDANCE_LABEL[m]} className={cn("h-3 w-3 rounded-[3px]", SQUARE_CLASS[statusTone(m)])} />
      ))}
    </div>
  );
}

export function RosterTable({ rows }: { rows: RosterRow[] }) {
  if (!rows.length) return <EmptyState title="No students in this class yet" />;
  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Student</th>
            <th className="text-right">Attendance</th>
            <th className="text-right">Trend</th>
            <th className="text-right">Avg mark</th>
            <th className="text-right">Mastery</th>
            <th>Risk</th>
            <th>Recent register</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.studentId}>
              <td>
                <span className="inline-flex items-center gap-2.5">
                  <Avatar name={r.name} size="sm" tone={r.risk ? LEVEL_TONE[r.risk] : "accent"} />
                  <span className="whitespace-nowrap font-medium">{r.name}</span>
                </span>
              </td>
              <td className={cn("num text-right font-semibold", attendanceClass(r.attendance))}>{r.attendance}%</td>
              <td className="text-right">
                <Trend value={r.trend} />
              </td>
              <td className="num text-right">{r.avgMark}%</td>
              <td className="num text-right">{r.mastery === null ? <span className="text-ink-3">—</span> : `${r.mastery}%`}</td>
              <td>{r.risk ? <Chip tone={LEVEL_TONE[r.risk]}>{LEVEL_LABEL[r.risk]}</Chip> : <span className="text-xs text-ink-3">—</span>}</td>
              <td>
                <RecentStrip marks={r.recent} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
