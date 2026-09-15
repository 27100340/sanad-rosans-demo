"use client";

/**
 * The class register for one period.
 *
 * Opening it marks the whole class present, so the teacher only ever corrects
 * exceptions — the marking pattern a paper register has always had. Each row
 * carries the full coded strip rather than a menu, every mark saves on its own
 * and reverts on its own if the server refuses it, and the running count at the
 * top is the number the teacher actually reports upstairs.
 */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Lock, LockOpen, Play } from "lucide-react";
import { attendanceLine } from "@/components/attend/lesson-list";
import { Avatar, Chip } from "@/components/ui/primitives";
import type { RegisterRowState } from "@/lib/data/attendance-register";
import {
  ATTENDANCE_CODE,
  ATTENDANCE_LABEL,
  ATTENDANCE_STATUSES,
  allowsReason,
  isException,
  requiresReason,
  summarise,
  type AttendanceStatus,
  type LessonStatus,
} from "@/lib/domain/attendance";
import { cn } from "@/lib/utils";
import { AgentPanel } from "./agent-panel";
import { StatusCode, StatusLegend, statusSoft } from "./status-codes";
import { StatusStrip } from "./status-strip";

const API = "/api/attendance";
const REASON_HINT = "Type the official reason, then leave the field to save.";
const NETWORK_ERROR = "Could not reach the server.";
const UNMARKED_LABEL = "Not marked";
/** Derived so the hint can never drift from the codes the strip actually listens for. */
const KEY_HINT = ATTENDANCE_STATUSES.map((s) => ATTENDANCE_CODE[s]).join(", ");

interface Row extends RegisterRowState {
  /** Last state the server accepted; the row reverts here when a save fails. */
  saved: { status: AttendanceStatus | null; note: string };
  error?: string;
}

interface Payload {
  lesson?: { status: LessonStatus };
  rows?: RegisterRowState[];
  error?: string;
}

type Action = "open" | "close" | "reopen" | "all-present";

function toRows(rows: RegisterRowState[]): Row[] {
  return rows.map((r) => ({ ...r, saved: { status: r.status, note: r.note } }));
}

async function call(method: "POST" | "PATCH", body: unknown): Promise<{ ok: boolean; json: Payload }> {
  try {
    const res = await fetch(API, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = (await res.json().catch(() => ({}))) as Payload;
    return { ok: res.ok, json: res.ok ? json : { error: json.error ?? "Something went wrong." } };
  } catch {
    return { ok: false, json: { error: NETWORK_ERROR } };
  }
}

/** The figures a teacher reports: the percentage, then every status that occurred. */
function CountBar({ rows }: { rows: Row[] }) {
  const statuses = rows.flatMap((r) => (r.status ? [r.status] : []));
  const counts = summarise(statuses.map((status) => ({ status })));
  const unmarked = rows.length - statuses.length;
  return (
    <div className="card flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
      <p className="num text-lg font-semibold text-ink">{attendanceLine(statuses)}</p>
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {ATTENDANCE_STATUSES.filter((s) => counts[s] > 0).map((s) => (
          <span key={s} className={cn("num inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-2xs font-semibold", statusSoft(s))}>
            <StatusCode status={s} />
            {counts[s]} {ATTENDANCE_LABEL[s].toLowerCase()}
          </span>
        ))}
        {unmarked ? <Chip tone="warn">{unmarked} not marked</Chip> : null}
      </div>
    </div>
  );
}

function RegisterRow({
  row,
  index,
  locked,
  stripRef,
  onPick,
  onNote,
  onSaveNote,
  onMove,
}: {
  row: Row;
  index: number;
  locked: boolean;
  stripRef: (el: HTMLDivElement | null) => void;
  onPick: (status: AttendanceStatus) => void;
  onNote: (note: string) => void;
  onSaveNote: () => void;
  onMove: (delta: number) => void;
}) {
  const flagged = row.status ? isException(row.status) : true;
  return (
    <div className={cn("px-3 py-3 sm:px-4 sm:py-2.5", flagged && "bg-surface-2/40")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="num w-5 shrink-0 text-2xs text-ink-3">{index + 1}</span>
        <Avatar name={row.name} size="sm" tone={row.status === "absent" ? "danger" : row.status === "bunk" ? "gold" : "accent"} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{row.name}</p>
          <p className="truncate text-2xs text-ink-3">{row.status ? ATTENDANCE_LABEL[row.status] : UNMARKED_LABEL}</p>
        </div>
        <StatusStrip value={row.status} disabled={locked} rowLabel={row.name} stripRef={stripRef} onPick={onPick} onMove={onMove} />
      </div>
      {row.status && allowsReason(row.status) ? (
        <div className="mt-2 sm:pl-8">
          <input
            className="input py-2 text-xs"
            aria-label={`Reason for ${row.name}`}
            placeholder={requiresReason(row.status) ? "Required for exempt" : "Reason (optional)"}
            value={row.note}
            disabled={locked}
            autoFocus={row.error === REASON_HINT}
            onChange={(e) => onNote(e.target.value)}
            onBlur={onSaveNote}
          />
        </div>
      ) : null}
      {row.error ? <p className="chip-danger mt-2 sm:ml-8">{row.error}</p> : null}
    </div>
  );
}

export function Register({
  lessonId,
  status,
  rows: initial,
  canEdit,
  aiLive,
}: {
  lessonId: string;
  status: LessonStatus;
  rows: RegisterRowState[];
  canEdit: boolean;
  aiLive: boolean;
}) {
  const router = useRouter();
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>(status);
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const strips = useRef<(HTMLDivElement | null)[]>([]);

  const locked = !canEdit || lessonStatus !== "open" || busy;

  const update = (studentId: string, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r)));

  const act = async (action: Action) => {
    setBusy(true);
    setError(null);
    const { ok, json } = await call("POST", { lessonId, action });
    if (ok && json.lesson && json.rows) {
      setLessonStatus(json.lesson.status);
      setRows(toRows(json.rows));
      router.refresh();
    } else setError(json.error ?? "Something went wrong.");
    setBusy(false);
  };

  const persist = async (row: Row, next: AttendanceStatus, note: string) => {
    update(row.studentId, { status: next, note, error: undefined });
    const { ok, json } = await call("PATCH", { lessonId, studentId: row.studentId, status: next, note });
    if (ok) update(row.studentId, { saved: { status: next, note } });
    else update(row.studentId, { status: row.saved.status, note: row.saved.note, error: json.error });
  };

  const pick = (row: Row, next: AttendanceStatus) => {
    const note = allowsReason(next) ? row.note : "";
    // Exempt cannot be saved without a reason: show the field first, save on blur.
    if (requiresReason(next) && !note.trim()) {
      update(row.studentId, { status: next, note, error: REASON_HINT });
      return;
    }
    void persist(row, next, note);
  };

  const saveNote = (row: Row) => {
    if (!row.status || !allowsReason(row.status)) return;
    if (row.status === row.saved.status && row.note === row.saved.note) return;
    void persist(row, row.status, row.note);
  };

  const move = (index: number, delta: number) => {
    strips.current[index + delta]?.querySelector("button")?.focus();
  };

  if (lessonStatus === "scheduled") {
    return (
      <div className="card-quiet space-y-4 p-5">
        {error ? <p className="chip-danger">{error}</p> : null}
        {canEdit ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-2">Opens the register with everyone present, ready to correct the exceptions.</p>
              <button type="button" className="btn-primary shrink-0" disabled={busy} onClick={() => void act("open")}>
                <Play size={14} /> Open register
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-2">Marks the whole class present in one tap; you can still close or edit afterwards.</p>
              <button type="button" className="btn-soft shrink-0" disabled={busy} onClick={() => void act("all-present")}>
                <CheckCheck size={14} /> Everyone present
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-3">The teacher has not opened this register yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="chip-danger">{error}</p> : null}

      <CountBar rows={rows} />

      {canEdit && lessonStatus === "open" ? (
        <AgentPanel
          lessonId={lessonId}
          roster={rows.map((r) => ({ studentId: r.studentId, name: r.name }))}
          live={aiLive}
          disabled={busy}
          onApplied={(next) => {
            setRows(toRows(next));
            router.refresh();
          }}
        />
      ) : null}

      <div className="card divide-y divide-line">
        {rows.map((row, index) => (
          <RegisterRow
            key={row.studentId}
            row={row}
            index={index}
            locked={locked}
            stripRef={(el) => {
              strips.current[index] = el;
            }}
            onPick={(next) => pick(row, next)}
            onNote={(note) => update(row.studentId, { note })}
            onSaveNote={() => saveNote(row)}
            onMove={(delta) => move(index, delta)}
          />
        ))}
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-3">Codes double as keys: press {KEY_HINT} on a row, then the arrow keys to move down the class.</p>
        {canEdit ? (
          lessonStatus === "closed" ? (
            <button type="button" className="btn-outline shrink-0" disabled={busy} onClick={() => void act("reopen")}>
              <LockOpen size={14} /> Reopen
            </button>
          ) : (
            <div className="flex shrink-0 gap-2">
              <button type="button" className="btn-outline btn-sm" disabled={busy} onClick={() => void act("all-present")}>
                <CheckCheck size={14} /> Reset to present
              </button>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void act("close")}>
                <Lock size={14} /> Close register
              </button>
            </div>
          )
        ) : null}
      </div>

      <div className="card-quiet p-4">
        <StatusLegend />
      </div>
    </div>
  );
}
