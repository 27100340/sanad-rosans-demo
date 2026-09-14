"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCheck } from "lucide-react";
import { Chip, EmptyState, type Tone } from "@/components/ui/primitives";
import type { NotificationKind } from "@/lib/data/mock/notify";
import { cn } from "@/lib/utils";

export interface NotificationRow {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  /** Pre-formatted on the server ("Today · 07:45") so the client never formats dates. */
  when: string;
  read: boolean;
  fromName?: string;
}

export const KIND: Record<NotificationKind, { label: string; tone: Tone }> = {
  task: { label: "Task", tone: "accent" },
  challenge: { label: "Challenge", tone: "gold" },
  assignment: { label: "Assignment", tone: "accent" },
  test: { label: "Test", tone: "info" },
  announcement: { label: "Announcement", tone: "neutral" },
  message: { label: "Message", tone: "accent" },
  resource: { label: "Resource", tone: "neutral" },
  marks: { label: "Marks", tone: "ok" },
  attendance: { label: "Attendance", tone: "warn" },
  rank: { label: "Rankings", tone: "gold" },
  reminder: { label: "Reminder", tone: "warn" },
  "show-cause": { label: "Show-cause", tone: "danger" },
  report: { label: "Report", tone: "info" },
};

const API = "/api/messages";

/** Notices for the signed-in person; marking read goes through the messages API and refreshes the nav badge. */
export function NotificationList({ rows: initial, emptyTitle = "Nothing here yet", emptyBody }: { rows: NotificationRow[]; emptyTitle?: string; emptyBody?: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unread = rows.filter((r) => !r.read).length;

  const markRead = async (ids?: string[]) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(API, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(ids ? { ids } : {}) });
      if (!res.ok) {
        setError("Could not update. Try again.");
        return;
      }
      setRows((prev) => prev.map((r) => (!ids || ids.includes(r.id) ? { ...r, read: true } : r)));
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  if (!rows.length) return <EmptyState title={emptyTitle} body={emptyBody} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-3">{unread ? `${unread} unread` : "All read"}</p>
        {unread ? (
          <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => void markRead()}>
            <CheckCheck size={14} /> Mark all read
          </button>
        ) : null}
      </div>
      {error ? <p className="chip-danger">{error}</p> : null}
      <div className="card divide-y divide-line">
        {rows.map((r) => {
          const k = KIND[r.kind];
          return (
            <div key={r.id} className={cn("flex items-start gap-3 p-4", !r.read && "bg-accent-soft/40")}>
              <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", r.read ? "bg-transparent" : "bg-accent")} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={k.tone}>{k.label}</Chip>
                  <span className="text-2xs text-ink-3">
                    {r.when}
                    {r.fromName ? ` · ${r.fromName}` : ""}
                  </span>
                </div>
                <p className={cn("mt-1.5 text-sm text-ink", !r.read && "font-medium")}>{r.title}</p>
                {r.body ? <p className="mt-0.5 text-xs leading-5 text-ink-2">{r.body}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.href ? (
                    <Link href={r.href} className="btn-soft btn-sm" onClick={() => (r.read ? undefined : void markRead([r.id]))}>
                      Open
                    </Link>
                  ) : null}
                  {!r.read ? (
                    <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => void markRead([r.id])}>
                      <Check size={14} /> Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
