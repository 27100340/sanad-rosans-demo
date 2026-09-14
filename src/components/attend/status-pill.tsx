"use client";

import type { Tone } from "@/components/ui/primitives";
import { ATTENDANCE_LABEL, ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/domain/attendance";
import { cn } from "@/lib/utils";
import { statusTone } from "./lesson-list";

const PILL_CLASS: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  gold: "bg-gold-soft text-gold",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-surface-2 text-ink-2",
};

const NOT_MARKED = "Not marked";

/**
 * The one-thumb control: a wide button that shows the current status and
 * advances to the next one on tap. Big enough to hit on a 390px phone.
 */
export function StatusPill({ status, disabled, onCycle }: { status: AttendanceStatus | null; disabled?: boolean; onCycle: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onCycle}
      aria-label={`Status: ${status ? ATTENDANCE_LABEL[status] : NOT_MARKED}. Tap to change.`}
      className={cn(
        "min-w-24 shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        PILL_CLASS[statusTone(status)],
      )}
    >
      {status ? ATTENDANCE_LABEL[status] : NOT_MARKED}
    </button>
  );
}

/** Direct pick for wider screens: every status in one segmented row. */
export function StatusPicker({ status, disabled, onPick }: { status: AttendanceStatus | null; disabled?: boolean; onPick: (next: AttendanceStatus) => void }) {
  return (
    <div role="radiogroup" aria-label="Attendance status" className="hidden items-center gap-1 rounded-full bg-surface-2 p-0.5 sm:flex">
      {ATTENDANCE_STATUSES.map((s) => {
        const on = s === status;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onPick(s)}
            className={cn(
              "rounded-full px-2.5 py-1 text-2xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              on ? PILL_CLASS[statusTone(s)] : "text-ink-3 hover:text-ink",
            )}
          >
            {ATTENDANCE_LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}
