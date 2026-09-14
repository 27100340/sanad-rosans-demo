"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Send } from "lucide-react";

export interface ComposeClass {
  id: string;
  name: string;
  students: { id: string; name: string }[];
}

type Kind = "message" | "show-cause";

interface SendOut {
  students?: number;
  guardians?: number;
  emails?: number;
  error?: string;
}

const API = "/api/messages";

/** Teacher notice to a class or one student. A show-cause notice always reaches guardians and queues an email. */
export function ComposeMessage({ classes, defaultStudentId = "" }: { classes: ComposeClass[]; defaultStudentId?: string }) {
  const router = useRouter();
  const preset = classes.find((c) => c.students.some((s) => s.id === defaultStudentId));
  const [classId, setClassId] = useState(preset?.id ?? classes[0]?.id ?? "");
  const [studentId, setStudentId] = useState(preset ? defaultStudentId : "");
  const [kind, setKind] = useState<Kind>("message");
  const [toStudents, setToStudents] = useState(true);
  const [toGuardians, setToGuardians] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const klass = classes.find((c) => c.id === classId);
  const showCause = kind === "show-cause";
  const guardians = showCause || toGuardians;
  const canSend = subject.trim().length >= 3 && body.trim().length >= 3 && Boolean(classId) && (toStudents || guardians);

  const pickClass = (id: string) => {
    setClassId(id);
    setStudentId("");
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    setSent(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target: studentId ? { studentId } : { classId }, toStudents, toGuardians: guardians, kind, subject: subject.trim(), body: body.trim() }),
      });
      const out = (await res.json().catch(() => ({}))) as SendOut;
      if (!res.ok) {
        setError(out.error ?? "Could not send.");
        return;
      }
      const parts = [`${out.students ?? 0} student${out.students === 1 ? "" : "s"}`, `${out.guardians ?? 0} guardian${out.guardians === 1 ? "" : "s"}`];
      setSent(`Sent to ${parts.join(" and ")}${out.emails ? `; ${out.emails} email${out.emails === 1 ? "" : "s"} queued` : ""}.`);
      setSubject("");
      setBody("");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  if (!classes.length) return <p className="card-quiet px-4 py-3 text-xs text-ink-3">You have no spaces yet, so there is nobody to write to.</p>;

  return (
    <form
      className="card space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend && !busy) void send();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="msg-class">Class</label>
          <select id="msg-class" className="input" value={classId} onChange={(e) => pickClass(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="msg-student">Student</label>
          <select id="msg-student" className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Whole class ({klass?.students.length ?? 0})</option>
            {klass?.students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="label">Type</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={kind === "message" ? "btn-primary btn-sm" : "btn-outline btn-sm"} onClick={() => setKind("message")}>Message</button>
          <button type="button" className={showCause ? "btn-danger btn-sm" : "btn-outline btn-sm"} onClick={() => setKind("show-cause")}>
            <AlertTriangle size={14} /> Show-cause notice
          </button>
        </div>
        {showCause ? <p className="help">A show-cause notice always goes to the guardians and is queued as an email; it is recorded in the audit log.</p> : null}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={toStudents} onChange={(e) => setToStudents(e.target.checked)} /> Students
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={guardians} disabled={showCause} onChange={(e) => setToGuardians(e.target.checked)} /> Guardians
        </label>
      </div>

      <div>
        <label className="label" htmlFor="msg-subject">Subject</label>
        <input id="msg-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={showCause ? "Repeated lateness to first period" : "Thursday's sequences task"} maxLength={120} />
      </div>
      <div>
        <label className="label" htmlFor="msg-body">Message</label>
        <textarea id="msg-body" className="input min-h-28" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Keep it short and specific; parents read this on a phone." maxLength={2000} />
      </div>

      {error ? <p className="chip-danger">{error}</p> : null}
      {sent ? <p className="chip-ok">{sent}</p> : null}

      <div className="flex justify-end">
        <button type="submit" className={showCause ? "btn-danger" : "btn-primary"} disabled={!canSend || busy}>
          <Send size={14} /> {busy ? "Sending" : showCause ? "Issue notice" : "Send"}
        </button>
      </div>
    </form>
  );
}
