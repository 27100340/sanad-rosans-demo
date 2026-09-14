"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Zap } from "lucide-react";
import { ACTIVITY_LABEL, TASK_ACTIVITY_TYPES, type TaskActivityType, type TaskKind } from "@/lib/domain/tasks";

interface CreateOut {
  created?: number;
  error?: string;
}

const API = "/api/tasks";
const DEFAULT_POINTS: Record<TaskKind, number> = { task: 10, challenge: 25 };

/** Hands a task or challenge to the whole class or one student; each student is notified and the send is audited. */
export function TaskForm({ spaceId, classId, students, defaultDue }: { spaceId: string; classId: string; students: { id: string; name: string }[]; defaultDue: string }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [kind, setKind] = useState<TaskKind>("task");
  const [activityType, setActivityType] = useState<TaskActivityType>("study_material");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState(defaultDue);
  const [points, setPoints] = useState(DEFAULT_POINTS.task);
  const [expectedMinutes, setExpectedMinutes] = useState(20);
  const [mandatory, setMandatory] = useState(false);
  const [resourceUrl, setResourceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const pickKind = (k: TaskKind) => {
    setKind(k);
    setPoints(DEFAULT_POINTS[k]);
    if (k === "challenge") setActivityType("daily_challenge");
  };

  const canSend = title.trim().length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(dueAt);

  const send = async () => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...(studentId ? { studentIds: [studentId] } : { classId }), kind, activityType, title: title.trim(), body: body.trim(), dueAt, points, expectedMinutes, mandatory, resourceUrl: resourceUrl.trim() || undefined, spaceId }),
      });
      const out = (await res.json().catch(() => ({}))) as CreateOut;
      if (!res.ok) {
        setError(out.error ?? "Could not set the task.");
        return;
      }
      setDone(`Assigned to ${out.created ?? 0} student${out.created === 1 ? "" : "s"}; each one has been notified.`);
      setTitle("");
      setBody("");
      setResourceUrl("");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="card space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend && !busy) void send();
      }}
    >
      <div className="flex flex-wrap gap-2">
        <button type="button" className={kind === "task" ? "btn-primary btn-sm" : "btn-outline btn-sm"} onClick={() => pickKind("task")}>
          <ClipboardList size={14} /> Task
        </button>
        <button type="button" className={kind === "challenge" ? "btn-gold btn-sm" : "btn-outline btn-sm"} onClick={() => pickKind("challenge")}>
          <Zap size={14} /> Challenge
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="task-student">For</label>
          <select id="task-student" className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Whole class ({students.length})</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="task-type">Activity</label>
          <select id="task-type" className="input" value={activityType} onChange={(e) => setActivityType(e.target.value as TaskActivityType)}>
            {TASK_ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{ACTIVITY_LABEL[t]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="task-title">Title</label>
        <input id="task-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "challenge" ? "Daily challenge: nth term in under five minutes" : "Watch: solving equations with brackets"} maxLength={120} />
      </div>
      <div>
        <label className="label" htmlFor="task-body">Instructions</label>
        <textarea id="task-body" className="input min-h-20" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What to do, and what to bring to class." maxLength={1000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="task-due">Due</label>
          <input id="task-due" type="date" className="input" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="task-points">Points</label>
          <input id="task-points" type="number" min={0} max={500} className="input" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
        </div>
        <div>
          <label className="label" htmlFor="task-minutes">Expected minutes</label>
          <input id="task-minutes" type="number" min={0} max={600} className="input" value={expectedMinutes} onChange={(e) => setExpectedMinutes(Number(e.target.value))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="task-url">Resource link (optional)</label>
          <input id="task-url" className="input" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://corbettmaths.com/contents/ or an internal notes page" />
        </div>
        <label className="inline-flex items-center gap-2 pb-2.5 text-sm text-ink-2">
          <input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} /> Mandatory
        </label>
      </div>

      {error ? <p className="chip-danger">{error}</p> : null}
      {done ? <p className="chip-ok">{done}</p> : null}

      <div className="flex justify-end">
        <button type="submit" className={kind === "challenge" ? "btn-gold" : "btn-primary"} disabled={!canSend || busy}>
          {busy ? "Setting" : kind === "challenge" ? "Set challenge" : "Set task"}
        </button>
      </div>
    </form>
  );
}
