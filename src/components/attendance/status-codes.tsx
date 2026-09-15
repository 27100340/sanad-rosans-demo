/**
 * The register's visual language, in one place: a filled swatch per status, the
 * single-letter code that labels it, and the legend that teaches both. Server
 * safe, so the teacher's register and the principal's roll-up render the same
 * marks without shipping the marking controls to a page that cannot mark.
 *
 * Tones come from the shared attendance vocabulary in attend/lesson-list, so a
 * status only ever has one colour across the product.
 */
import { statusTone } from "@/components/attend/lesson-list";
import type { Tone } from "@/components/ui/primitives";
import { ATTENDANCE_CODE, ATTENDANCE_HINT, ATTENDANCE_LABEL, ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/domain/attendance";
import { cn } from "@/lib/utils";

/** Solid: the mark that is set. */
export const TONE_FILL: Record<Tone, string> = {
  accent: "bg-accent text-white",
  gold: "bg-gold text-white",
  ok: "bg-ok text-white",
  warn: "bg-warn text-white",
  danger: "bg-danger text-white",
  info: "bg-info text-white",
  neutral: "bg-surface-3 text-ink",
};

/** Tinted: the mark being reported rather than chosen. */
export const TONE_SOFT: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  gold: "bg-gold-soft text-gold",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-surface-2 text-ink-2",
};

export const UNMARKED_CODE = "–";

export function statusFill(status: AttendanceStatus | null): string {
  return status ? TONE_FILL[statusTone(status)] : "bg-surface-2 text-ink-3";
}

export function statusSoft(status: AttendanceStatus | null): string {
  return status ? TONE_SOFT[statusTone(status)] : "bg-surface-2 text-ink-3";
}

export function statusCode(status: AttendanceStatus | null): string {
  return status ? ATTENDANCE_CODE[status] : UNMARKED_CODE;
}

export function statusTitle(status: AttendanceStatus | null): string {
  return status ? `${ATTENDANCE_LABEL[status]} — ${ATTENDANCE_HINT[status]}` : "Not marked yet";
}

/** One recorded mark, read-only: the code in its colour. */
export function StatusCode({ status, className }: { status: AttendanceStatus | null; className?: string }) {
  return (
    <span title={statusTitle(status)} className={cn("num grid h-6 w-6 shrink-0 place-items-center rounded-md text-2xs font-bold", statusFill(status), className)}>
      {statusCode(status)}
    </span>
  );
}

/** Code, colour and meaning for every status. Printed under any register. */
export function StatusLegend({ className }: { className?: string }) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {ATTENDANCE_STATUSES.map((status) => (
        <div key={status} className="flex items-start gap-2">
          <StatusCode status={status} />
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-ink">{ATTENDANCE_LABEL[status]}</dt>
            <dd className="text-2xs leading-snug text-ink-3">{ATTENDANCE_HINT[status]}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
