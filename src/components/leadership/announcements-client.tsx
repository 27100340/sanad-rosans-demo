"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { relativeDay } from "@/components/leadership/format";
import { Card, Chip, SectionTitle } from "@/components/ui/primitives";
import { branchName, school } from "@/lib/config/school";
import type { Announcement } from "@/lib/domain/types";

const SCHOOL_SCOPE = "school";

export interface AnnouncementRow extends Announcement {
  authorName: string;
}

interface Out {
  notified?: number;
  emails?: number;
  error?: string;
}

/** Publishes through the announcements API: in-app to students, guardians and staff in scope, optionally emailed to guardians. */
export function AnnouncementsClient({ initial, fixedScope }: { initial: AnnouncementRow[]; fixedScope?: Announcement["scope"] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<Announcement["scope"]>(fixedScope ?? SCHOOL_SCOPE);
  const [students, setStudents] = useState(true);
  const [guardians, setGuardians] = useState(true);
  const [staff, setStaff] = useState(true);
  const [email, setEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/announcements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: title.trim(), body: body.trim(), scope, audience: { students, guardians, staff }, email }) });
      const out = (await res.json().catch(() => ({}))) as Out;
      if (!res.ok) {
        setNote({ tone: "danger", text: out.error ?? "Could not publish." });
        return;
      }
      setNote({ tone: "ok", text: `Published to ${out.notified ?? 0} people${out.emails ? `; ${out.emails} emails queued` : ""}.` });
      setTitle("");
      setBody("");
      router.refresh();
    } catch {
      setNote({ tone: "danger", text: "Could not reach the server." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="lg:col-span-3">
        <SectionTitle title="Published" hint={`${initial.length} announcements`} />
        <ul className="space-y-4">
          {initial.map((a) => (
            <li key={a.id}>
              <Card className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
                  <Chip tone={a.scope === SCHOOL_SCOPE ? "accent" : "neutral"}>{a.scope === SCHOOL_SCOPE ? "All campuses" : branchName(a.scope)}</Chip>
                </div>
                <p className="text-sm leading-6 text-ink-2">{a.body}</p>
                <p className="text-xs text-ink-3">
                  {a.authorName} · {relativeDay(a.date)}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
      <section className="lg:col-span-2">
        <SectionTitle title="New announcement" />
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="an-title">Title</label>
              <input id="an-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short and specific" maxLength={140} />
            </div>
            {fixedScope ? null : (
              <div>
                <label className="label" htmlFor="an-scope">Scope</label>
                <select id="an-scope" className="input" value={scope} onChange={(e) => setScope(e.target.value as Announcement["scope"])}>
                  <option value={SCHOOL_SCOPE}>All campuses</option>
                  {school.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label" htmlFor="an-body">Message</label>
              <textarea id="an-body" className="input min-h-28" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What should students, parents and staff know?" maxLength={2000} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={students} onChange={(e) => setStudents(e.target.checked)} /> Students</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={guardians} onChange={(e) => setGuardians(e.target.checked)} /> Parents</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={staff} onChange={(e) => setStaff(e.target.checked)} /> Teaching staff</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} disabled={!guardians} /> Also email parents</label>
            </div>
            {note ? <p className={note.tone === "ok" ? "chip-ok" : "chip-danger"}>{note.text}</p> : null}
            <div className="flex items-center justify-between gap-3">
              <button type="submit" className="btn-primary" disabled={!title.trim() || !body.trim() || busy}>
                <Megaphone size={14} /> {busy ? "Publishing" : "Publish"}
              </button>
              <span className="text-xs text-ink-3">In-app now; WhatsApp with the notifications integration.</span>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
