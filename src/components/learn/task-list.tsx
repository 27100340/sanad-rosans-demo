"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardList, ExternalLink, Play, Zap } from "lucide-react";
import { Chip, EmptyState, Tile } from "@/components/ui/primitives";
import { ACTIVITY_LABEL, nextTaskStatus, type TaskActivityType, type TaskKind, type TaskStatus } from "@/lib/domain/tasks";
import { cn } from "@/lib/utils";

export interface TaskRowData {
  id: string;
  kind: TaskKind;
  title: string;
  body: string;
  subject: string;
  teacherName: string;
  dueLabel: string;
  overdue: boolean;
  points: number;
  status: TaskStatus;
  mandatory: boolean;
  activityType: TaskActivityType;
  expectedMinutes: number;
  resourceUrl?: string;
}

const API = "/api/tasks";

function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function Row({ row, busy, onAdvance }: { row: TaskRowData; busy: boolean; onAdvance: () => void }) {
  const done = row.status === "done";
  return (
    <div className={cn("flex flex-col gap-3 p-4 sm:flex-row sm:items-start", done && "opacity-70")}>
      <Tile tone={row.kind === "challenge" ? "gold" : "accent"}>{row.kind === "challenge" ? <Zap size={18} /> : <ClipboardList size={18} />}</Tile>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-ink">{row.title}</p>
          {row.mandatory ? <Chip tone="warn">Mandatory</Chip> : null}
          {row.overdue ? <Chip tone="danger">Overdue</Chip> : null}
          <Chip tone="neutral">{ACTIVITY_LABEL[row.activityType]}</Chip>
        </div>
        {row.body ? <p className="mt-1 text-xs leading-5 text-ink-2">{row.body}</p> : null}
        <p className="mt-1.5 text-xs text-ink-3">
          {row.subject ? `${row.subject} · ` : ""}due {row.dueLabel} · about {row.expectedMinutes} min · <span className="num">{row.points}</span> points
          {row.teacherName ? ` · ${row.teacherName}` : ""}
        </p>
        {row.resourceUrl ? (
          <Link href={row.resourceUrl} target={isExternal(row.resourceUrl) ? "_blank" : undefined} rel={isExternal(row.resourceUrl) ? "noopener noreferrer" : undefined} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent underline underline-offset-2">
            Open the resource {isExternal(row.resourceUrl) ? <ExternalLink size={12} /> : null}
          </Link>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:pt-1">
        {done ? (
          <Chip tone="ok">
            <CheckCircle2 size={12} /> Done · +{row.points}
          </Chip>
        ) : row.status === "in_progress" ? (
          <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={onAdvance}>
            <CheckCircle2 size={14} /> Mark done
          </button>
        ) : (
          <button type="button" className="btn-soft btn-sm" disabled={busy} onClick={onAdvance}>
            <Play size={14} /> Start
          </button>
        )}
      </div>
    </div>
  );
}

/** Personal tasks and challenges; "Start" and "Mark done" move the status through the tasks API. */
export function TaskList({ rows: initial }: { rows: TaskRowData[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const advance = async (row: TaskRowData) => {
    const status = nextTaskStatus(row.status);
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch(API, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ taskId: row.id, status }) });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not update the task.");
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status, overdue: status === "done" ? false : r.overdue } : r)));
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusyId(null);
    }
  };

  if (!rows.length) return <EmptyState title="No tasks yet" body="Your teachers set tasks and challenges here; each one is worth points." />;

  const open = rows.filter((r) => r.status !== "done");
  const done = rows.filter((r) => r.status === "done");

  return (
    <div className="space-y-6">
      {error ? <p className="chip-danger">{error}</p> : null}
      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">To do</h2>
        {open.length ? (
          <div className="card divide-y divide-line">
            {open.map((r) => <Row key={r.id} row={r} busy={busyId === r.id} onAdvance={() => void advance(r)} />)}
          </div>
        ) : (
          <p className="card-quiet px-4 py-3 text-xs text-ink-3">Everything is done. Well done.</p>
        )}
      </section>
      {done.length ? (
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink">Done</h2>
          <div className="card divide-y divide-line">
            {done.map((r) => <Row key={r.id} row={r} busy={false} onAdvance={() => undefined} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
