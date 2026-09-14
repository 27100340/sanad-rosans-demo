import { Chip, EmptyState, LinkButton, type Tone } from "@/components/ui/primitives";
import { fmtDay } from "@/components/teach/helpers";
import { ATTENDANCE_LABEL, ATTENDANCE_STATUSES, attendancePercent, isAttendanceStatus, summarise, type AttendanceStatus, type LessonStatus } from "@/lib/domain/attendance";

/* ------------------------------------------------------------------ */
/* Shared attendance vocabulary for the UI. Server-safe: no mock data.  */
/* ------------------------------------------------------------------ */

export const LESSON_STATUS: Record<LessonStatus, { label: string; tone: Tone; action: string }> = {
  scheduled: { label: "Not opened", tone: "neutral", action: "Open register" },
  open: { label: "Register open", tone: "warn", action: "Continue" },
  closed: { label: "Closed", tone: "ok", action: "View" },
};

const STATUS_TONE: Record<AttendanceStatus, Tone> = {
  present: "ok",
  late: "warn",
  online: "info",
  absent: "danger",
  excused: "neutral",
  leave: "neutral",
  exempt: "neutral",
};

export function statusTone(status: string | null): Tone {
  return status && isAttendanceStatus(status) ? STATUS_TONE[status] : "neutral";
}

/** "12 present · 1 late · 1 absent" — only the non-zero statuses, in cycle order. */
export function summaryLine(statuses: string[]): string {
  const counts = summarise(statuses.filter(isAttendanceStatus).map((status) => ({ status })));
  return ATTENDANCE_STATUSES.filter((s) => counts[s] > 0)
    .map((s) => `${counts[s]} ${ATTENDANCE_LABEL[s].toLowerCase()}`)
    .join(" · ");
}

export function attendanceLine(statuses: string[]): string {
  const pct = attendancePercent(statuses);
  return pct === null ? "Attendance —" : `Attendance ${pct}%`;
}

export interface LessonRow {
  id: string;
  period: number;
  subject: string;
  className: string;
  room: string;
  date: string;
  status: LessonStatus;
  /** Present when the register is closed. */
  summary?: string;
}

export function LessonList({ rows, showDate = false, emptyTitle = "No lessons", emptyBody }: { rows: LessonRow[]; showDate?: boolean; emptyTitle?: string; emptyBody?: string }) {
  if (!rows.length) return <EmptyState title={emptyTitle} body={emptyBody} />;
  return (
    <div className="card divide-y divide-line">
      {rows.map((r) => {
        const st = LESSON_STATUS[r.status];
        return (
          <div key={r.id} className="flex items-center gap-3 p-4">
            <span className="tile-neutral num text-sm font-semibold">P{r.period}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {r.subject} <span className="font-normal text-ink-3">· {r.className}</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-3">
                {showDate ? `${fmtDay(r.date)} · ` : ""}Room {r.room}
                {r.summary ? ` · ${r.summary}` : ""}
              </p>
              <div className="mt-1.5 sm:hidden">
                <Chip tone={st.tone}>{st.label}</Chip>
              </div>
            </div>
            <Chip tone={st.tone} className="hidden sm:inline-flex">
              {st.label}
            </Chip>
            <LinkButton href={`/portal/teach/attendance/${r.id}`} variant={r.status === "closed" ? "outline" : "primary"} className="btn-sm shrink-0">
              {st.action}
            </LinkButton>
          </div>
        );
      })}
    </div>
  );
}
