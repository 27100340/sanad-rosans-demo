"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Lock, LockOpen, Play } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { allowsReason, nextStatus, requiresReason, type AttendanceStatus, type LessonStatus } from "@/lib/domain/attendance";
import { attendanceLine, summaryLine } from "./lesson-list";
import { StatusPicker, StatusPill } from "./status-pill";

export interface RegisterRow {
  studentId: string;
  name: string;
  status: AttendanceStatus | null;
  note: string;
}

interface Row extends RegisterRow {
  /** Last state the server accepted; the row reverts here on error. */
  saved: { status: AttendanceStatus | null; note: string };
  error?: string;
}

interface Payload {
  lesson?: { status: LessonStatus };
  rows?: RegisterRow[];
  error?: string;
}

type Action = "open" | "close" | "reopen" | "all-present";

const API = "/api/attendance";
const REASON_HINT = "Type the official reason, then leave the field to save.";
const NETWORK_ERROR = "Could not reach the server.";

function toRows(rows: RegisterRow[]): Row[] {
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

export function Register({ lessonId, status, rows: initial, canEdit }: { lessonId: string; status: LessonStatus; rows: RegisterRow[]; canEdit: boolean }) {
  const router = useRouter();
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>(status);
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const persist = async (row: Row, status: AttendanceStatus, note: string) => {
    update(row.studentId, { status, note, error: undefined });
    const { ok, json } = await call("PATCH", { lessonId, studentId: row.studentId, status, note });
    if (ok) update(row.studentId, { saved: { status, note } });
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

  if (lessonStatus === "scheduled") {
    return (
      <div className="card-quiet space-y-4 p-5">
        {error ? <p className="chip-danger">{error}</p> : null}
        {canEdit ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-2">Opens the register with everyone present, ready to adjust student by student.</p>
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

  const statuses = rows.flatMap((r) => (r.status ? [r.status] : []));

  return (
    <div className="space-y-4">
      {error ? <p className="chip-danger">{error}</p> : null}

      <div className="card divide-y divide-line">
        {rows.map((row) => (
          <div key={row.studentId} className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Avatar name={row.name} size="sm" tone={row.status === "absent" ? "danger" : "accent"} />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{row.name}</p>
              <StatusPicker status={row.status} disabled={locked} onPick={(next) => pick(row, next)} />
              <StatusPill status={row.status} disabled={locked} onCycle={() => pick(row, nextStatus(row.status ?? "present"))} />
            </div>
            {row.status && allowsReason(row.status) ? (
              <div className="mt-2 pl-10">
                <input
                  className="input py-2 text-xs"
                  aria-label="Official reason"
                  placeholder={requiresReason(row.status) ? "Required for exempt" : "Official reason (optional)"}
                  value={row.note}
                  disabled={locked}
                  autoFocus={row.error === REASON_HINT}
                  onChange={(e) => update(row.studentId, { note: e.target.value })}
                  onBlur={() => saveNote(row)}
                />
              </div>
            ) : null}
            {row.error ? <p className="chip-danger mt-2 ml-10">{row.error}</p> : null}
          </div>
        ))}
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="num text-sm font-semibold text-ink">{attendanceLine(statuses)}</p>
          <p className="mt-0.5 text-xs text-ink-3">{summaryLine(statuses) || "Nothing marked yet"}</p>
        </div>
        {canEdit ? (
          lessonStatus === "closed" ? (
            <button type="button" className="btn-outline" disabled={busy} onClick={() => void act("reopen")}>
              <LockOpen size={14} /> Reopen
            </button>
          ) : (
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void act("close")}>
              <Lock size={14} /> Close register
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
