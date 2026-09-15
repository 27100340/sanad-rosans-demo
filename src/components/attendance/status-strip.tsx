"use client";

/**
 * The marking control: every status as a coded key, always visible, one tap
 * each. No dropdown and no cycling, because a teacher marking thirty children
 * between periods should never need two gestures for one mark or have to read
 * a menu to find "bunk".
 *
 * The code letters double as keyboard shortcuts, so a register can be taken
 * down the class list with P, A, L, B and the arrow keys and never touched with
 * a mouse.
 */
import type { Ref } from "react";
import { ATTENDANCE_CODE, ATTENDANCE_LABEL, ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/domain/attendance";
import { cn } from "@/lib/utils";
import { statusFill, statusTitle } from "./status-codes";

const KEY_TO_STATUS = new Map<string, AttendanceStatus>(ATTENDANCE_STATUSES.map((s) => [ATTENDANCE_CODE[s].toLowerCase(), s]));

export function StatusStrip({
  value,
  disabled,
  rowLabel,
  stripRef,
  onPick,
  onMove,
}: {
  value: AttendanceStatus | null;
  disabled?: boolean;
  /** Whose row this is, so a screen reader announces the student with the status. */
  rowLabel: string;
  stripRef?: Ref<HTMLDivElement>;
  onPick: (status: AttendanceStatus) => void;
  /** +1 for the next student, -1 for the previous. Undefined disables row jumping. */
  onMove?: (delta: number) => void;
}) {
  return (
    <div
      ref={stripRef}
      role="radiogroup"
      aria-label={`Attendance for ${rowLabel}`}
      className="grid w-full grid-cols-8 gap-1 sm:w-auto sm:shrink-0"
      onKeyDown={(e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const picked = KEY_TO_STATUS.get(e.key.toLowerCase());
        if (picked && !disabled) {
          e.preventDefault();
          onPick(picked);
          onMove?.(1);
          return;
        }
        if (!onMove) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          onMove(1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          onMove(-1);
        }
      }}
    >
      {ATTENDANCE_STATUSES.map((status) => {
        const on = status === value;
        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={ATTENDANCE_LABEL[status]}
            title={statusTitle(status)}
            disabled={disabled}
            onClick={() => onPick(status)}
            className={cn(
              "num h-9 rounded-lg text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-8",
              on ? statusFill(status) : "bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink",
            )}
          >
            {ATTENDANCE_CODE[status]}
          </button>
        );
      })}
    </div>
  );
}
