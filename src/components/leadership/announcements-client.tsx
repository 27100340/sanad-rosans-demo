"use client";

import { useState, type FormEvent } from "react";
import { relativeDay } from "@/components/leadership/format";
import { Card, Chip, SectionTitle } from "@/components/ui/primitives";
import { branchName, school } from "@/lib/config/school";
import type { Announcement } from "@/lib/domain/types";
import { todayISO } from "@/lib/utils";

const SCHOOL_SCOPE = "school";

export interface AnnouncementRow extends Announcement {
  authorName: string;
}

/** Demo: the form appends to local state only; nothing is persisted. */
export function AnnouncementsClient({ initial, authorName }: { initial: AnnouncementRow[]; authorName: string }) {
  const [rows, setRows] = useState<AnnouncementRow[]>(initial);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<Announcement["scope"]>(SCHOOL_SCOPE);
  const [posted, setPosted] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const row: AnnouncementRow = { id: `an-local-${Date.now()}`, scope, authorId: "local", authorName, date: todayISO(), title: title.trim(), body: body.trim() };
    setRows((r) => [row, ...r]);
    setTitle("");
    setBody("");
    setPosted(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="lg:col-span-3">
        <SectionTitle title="Published" hint={`${rows.length} announcements`} />
        <ul className="space-y-4">
          {rows.map((a) => (
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
              <input id="an-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short and specific" />
            </div>
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
            <div>
              <label className="label" htmlFor="an-body">Message</label>
              <textarea id="an-body" className="input min-h-28" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What should staff and parents know?" />
              <p className="help">Delivered in-app now; WhatsApp delivery arrives with the notifications integration.</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button type="submit" className="btn-primary" disabled={!title.trim() || !body.trim()}>
                Publish
              </button>
              {posted ? <span className="text-xs text-ok">Published to the list.</span> : null}
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
