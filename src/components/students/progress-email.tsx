"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Sparkles } from "lucide-react";
import { AiPill } from "@/components/ui/primitives";

interface Composed {
  subject?: string;
  body?: string;
  live?: boolean;
  error?: string;
}

const API = "/api/progress-email";

/** Drafts a progress email with AI (or the template), lets the teacher edit it, then queues it to the guardian or student. */
export function ProgressEmail({ studentId, guardianName, guardianLanguage, studentFirstName }: { studentId: string; guardianName: string | null; guardianLanguage: "en" | "ur"; studentFirstName: string }) {
  const router = useRouter();
  const [forParent, setForParent] = useState(Boolean(guardianName));
  const [language, setLanguage] = useState<"en" | "ur">(guardianLanguage);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [live, setLive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"compose" | "send" | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);

  const compose = async () => {
    setBusy("compose");
    setNote(null);
    try {
      const res = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ studentId, forParent, language }) });
      const out = (await res.json().catch(() => ({}))) as Composed;
      if (!res.ok || !out.subject || !out.body) {
        setNote({ tone: "danger", text: out.error ?? "Could not compose." });
        return;
      }
      setSubject(out.subject);
      setBody(out.body);
      setLive(Boolean(out.live));
    } catch {
      setNote({ tone: "danger", text: "Could not reach the server." });
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    setBusy("send");
    setNote(null);
    try {
      const res = await fetch(API, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ studentId, forParent, subject, body }) });
      const out = (await res.json().catch(() => ({}))) as { queued?: number; error?: string };
      if (!res.ok) {
        setNote({ tone: "danger", text: out.error ?? "Could not queue." });
        return;
      }
      setNote({ tone: "ok", text: `Queued for ${forParent ? guardianName : studentFirstName}; it is in the outbound queue and their notices.` });
      router.refresh();
    } catch {
      setNote({ tone: "danger", text: "Could not reach the server." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">
          <Mail size={13} className="text-accent" /> Progress email
        </h2>
        {live !== null ? <AiPill live={live} /> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="pe-to">To</label>
          <select id="pe-to" className="input" value={forParent ? "parent" : "student"} onChange={(e) => setForParent(e.target.value === "parent")}>
            {guardianName ? <option value="parent">{guardianName} (guardian)</option> : null}
            <option value="student">{studentFirstName} (student)</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pe-lang">Language</label>
          <select id="pe-lang" className="input" value={language} onChange={(e) => setLanguage(e.target.value as "en" | "ur")}>
            <option value="en">English</option>
            <option value="ur">Urdu</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-soft btn-sm" disabled={busy !== null} onClick={() => void compose()}>
          <Sparkles size={14} /> {busy === "compose" ? "Drafting" : subject ? "Redraft" : "Draft with AI"}
        </button>
      </div>
      {subject ? (
        <>
          <div>
            <label className="label" htmlFor="pe-subject">Subject</label>
            <input id="pe-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="pe-body">Body</label>
            <textarea id="pe-body" className={`input min-h-56 text-sm leading-relaxed ${language === "ur" ? "urdu" : ""}`} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <button type="button" className="btn-primary" disabled={busy !== null || !subject.trim() || !body.trim()} onClick={() => void send()}>
              <Mail size={14} /> {busy === "send" ? "Queuing" : "Queue email"}
            </button>
          </div>
        </>
      ) : (
        <p className="text-xs text-ink-3">Facts come from tests, papers, assignments, tasks and attendance; nothing is invented. Edit before you send.</p>
      )}
      {note ? <p className={note.tone === "ok" ? "chip-ok" : "chip-danger"}>{note.text}</p> : null}
    </section>
  );
}
