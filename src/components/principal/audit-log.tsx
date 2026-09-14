"use client";

import { useMemo, useState } from "react";
import { Chip, EmptyState, type Tone } from "@/components/ui/primitives";

export interface AuditRow {
  id: string;
  when: string;
  actorId: string;
  actorName: string;
  action: string;
  label: string;
  entity: string;
  entityId?: string;
  summary: string;
}

export interface MailRow {
  id: string;
  when: string;
  toName: string;
  channel: "email" | "push" | "sms";
  subject: string;
  status: string;
}

const ENTITY_TONE: Record<string, Tone> = {
  lesson: "info",
  task: "accent",
  test: "info",
  attempt: "warn",
  message: "danger",
  space: "gold",
  resource: "neutral",
  file: "neutral",
};

/** Filterable audit trail plus the outbound queue; everything is already resolved to names on the server. */
export function AuditLog({ rows, mails }: { rows: AuditRow[]; mails: MailRow[] }) {
  const [actor, setActor] = useState("");
  const [entity, setEntity] = useState("");
  const [query, setQuery] = useState("");

  const actors = useMemo(() => [...new Map(rows.map((r) => [r.actorId, r.actorName])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [rows]);
  const entities = useMemo(() => [...new Set(rows.map((r) => r.entity))].sort(), [rows]);
  const q = query.trim().toLowerCase();
  const shown = rows.filter((r) => (!actor || r.actorId === actor) && (!entity || r.entity === entity) && (!q || `${r.label} ${r.summary} ${r.actorName} ${r.action}`.toLowerCase().includes(q)));

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="audit-actor">Who</label>
            <select id="audit-actor" className="input" value={actor} onChange={(e) => setActor(e.target.value)}>
              <option value="">Everyone</option>
              {actors.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="audit-entity">What</label>
            <select id="audit-entity" className="input" value={entity} onChange={(e) => setEntity(e.target.value)}>
              <option value="">Everything</option>
              {entities.map((e) => (
                <option key={e} value={e} className="capitalize">{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="audit-q">Search</label>
            <input id="audit-q" className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Student, class, title" />
          </div>
        </div>

        {shown.length ? (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>What</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td className="num whitespace-nowrap text-ink-2">{r.when}</td>
                    <td className="whitespace-nowrap font-medium">{r.actorName}</td>
                    <td className="whitespace-nowrap">{r.label}</td>
                    <td>
                      <Chip tone={ENTITY_TONE[r.entity] ?? "neutral"} className="capitalize">{r.entity}</Chip>
                    </td>
                    <td className="max-w-md text-xs text-ink-2">{r.summary || <span className="text-ink-3">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No matching actions" body="Widen the filters, or wait for staff to act." />
        )}
        <p className="text-xs text-ink-3">{shown.length} of {rows.length} actions shown. Production keeps this table append-only with the actor's session id.</p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">Outbound queue</h2>
        {mails.length ? (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>To</th>
                  <th>Channel</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mails.map((m) => (
                  <tr key={m.id}>
                    <td className="num whitespace-nowrap text-ink-2">{m.when}</td>
                    <td className="whitespace-nowrap font-medium">{m.toName}</td>
                    <td className="capitalize">{m.channel}</td>
                    <td className="max-w-md truncate">{m.subject}</td>
                    <td>
                      <Chip tone="warn" className="capitalize">{m.status}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="card-quiet px-4 py-3 text-xs text-ink-3">Nothing queued. Show-cause notices and weekly parent reports land here until a relay sends them.</p>
        )}
      </section>
    </div>
  );
}
