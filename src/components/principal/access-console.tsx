"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LockOpen } from "lucide-react";
import { Chip, EmptyState } from "@/components/ui/primitives";
import type { AccessMode, AccessRestriction, AccessScope } from "@/lib/domain/access";
import { DEFAULT_LOCK_MESSAGE } from "@/lib/domain/access";

export interface AccessTargets {
  classes: { id: string; name: string }[];
  students: { id: string; name: string; className: string }[];
  branches: { id: string; name: string }[];
}

export interface AccessRow extends AccessRestriction {
  active: boolean;
  createdByName: string;
  when: string;
}

const API = "/api/access";
const SCOPE_LABEL: Record<AccessScope, string> = { person: "One student", class: "A class", branch: "Whole branch", role: "A role" };
const ROLES = ["student", "parent", "teacher"];

/** Lock or suspend portal access by scope, and release what is in force. */
export function AccessConsole({ rows, targets, defaultScope = "person", defaultKey = "" }: { rows: AccessRow[]; targets: AccessTargets; defaultScope?: AccessScope; defaultKey?: string }) {
  const router = useRouter();
  const [scope, setScope] = useState<AccessScope>(defaultScope);
  const [scopeKey, setScopeKey] = useState(defaultKey);
  const [mode, setMode] = useState<AccessMode>("locked");
  const [message, setMessage] = useState(DEFAULT_LOCK_MESSAGE);
  const [endsAt, setEndsAt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);

  const options = scope === "person" ? targets.students.map((s) => ({ id: s.id, label: `${s.name} · ${s.className}` })) : scope === "class" ? targets.classes.map((c) => ({ id: c.id, label: c.name })) : scope === "branch" ? targets.branches.map((b) => ({ id: b.id, label: b.name })) : ROLES.map((r) => ({ id: r, label: r }));

  const pickScope = (s: AccessScope) => {
    setScope(s);
    setScopeKey("");
  };

  const create = async () => {
    setBusy("create");
    setNote(null);
    try {
      const res = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scope, scopeKey, mode, message, endsAt: endsAt ? new Date(endsAt).toISOString() : null }) });
      const out = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setNote({ tone: "danger", text: out.error ?? "Could not apply." });
        return;
      }
      setNote({ tone: "ok", text: `${mode === "suspended" ? "Suspended" : "Locked"}. They see your message on their next page.` });
      setScopeKey("");
      router.refresh();
    } catch {
      setNote({ tone: "danger", text: "Could not reach the server." });
    } finally {
      setBusy(null);
    }
  };

  const release = async (id: string) => {
    setBusy(id);
    setNote(null);
    try {
      const res = await fetch(API, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) {
        setNote({ tone: "danger", text: "Could not release." });
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <form
        className="card space-y-4 p-5 lg:col-span-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (scopeKey && !busy) void create();
        }}
      >
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <LockKeyhole size={16} className="text-accent" /> New restriction
        </h2>
        <div>
          <p className="label">Scope</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SCOPE_LABEL) as AccessScope[]).map((s) => (
              <button key={s} type="button" className={scope === s ? "btn-soft btn-sm" : "btn-outline btn-sm"} onClick={() => pickScope(s)}>
                {SCOPE_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="ac-target">Who</label>
          <select id="ac-target" className="input" value={scopeKey} onChange={(e) => setScopeKey(e.target.value)}>
            <option value="">Choose</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ac-mode">Mode</label>
            <select id="ac-mode" className="input" value={mode} onChange={(e) => setMode(e.target.value as AccessMode)}>
              <option value="locked">Locked (temporary, with a message)</option>
              <option value="suspended">Suspended (until released)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ac-ends">Ends (optional)</label>
            <input id="ac-ends" type="datetime-local" className="input" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="ac-msg">Message they will see</label>
          <textarea id="ac-msg" className="input min-h-24" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
        </div>
        {note ? <p className={note.tone === "ok" ? "chip-ok" : "chip-danger"}>{note.text}</p> : null}
        <div className="flex justify-end">
          <button type="submit" className="btn-danger" disabled={!scopeKey || busy !== null}>
            <LockKeyhole size={14} /> {busy === "create" ? "Applying" : mode === "suspended" ? "Suspend" : "Lock"}
          </button>
        </div>
      </form>

      <section className="lg:col-span-3">
        <h2 className="mb-3 text-base font-semibold text-ink">In force and released</h2>
        {rows.length ? (
          <div className="card divide-y divide-line">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={r.active ? (r.mode === "suspended" ? "danger" : "warn") : "neutral"}>{r.active ? r.mode : "released"}</Chip>
                    <p className="text-sm font-medium text-ink">
                      {SCOPE_LABEL[r.scope]}: {r.scopeLabel}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-ink-2">{r.message}</p>
                  <p className="mt-0.5 text-2xs text-ink-3">
                    By {r.createdByName} · {r.when}
                    {r.endsAt ? ` · ends ${new Date(r.endsAt).toLocaleString("en-GB")}` : ""}
                    {r.releasedAt ? ` · released ${new Date(r.releasedAt).toLocaleString("en-GB")}` : ""}
                  </p>
                </div>
                {r.active ? (
                  <button type="button" className="btn-outline btn-sm shrink-0" disabled={busy !== null} onClick={() => void release(r.id)}>
                    <LockOpen size={14} /> Release
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing restricted" body="Every student, parent and teacher can use the portal. Locks you add appear here with who set them." />
        )}
      </section>
    </div>
  );
}
