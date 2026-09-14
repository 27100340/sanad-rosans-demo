"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  kind: string;
  title: string;
  body: string;
  href?: string;
  at: string;
  readAt?: string;
}

const POLL_MS = 60_000;
const SHOW = 6;

function when(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Top-bar bell: unread count, the latest notices in a dropdown, mark all read. Polls once a minute. */
export function NotificationBell({ inboxHref }: { inboxHref: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      if (!res.ok) return;
      const out = (await res.json()) as { notifications?: Row[] };
      setRows(out.notifications ?? []);
    } catch {
      /* keep the last list */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const unread = rows.filter((r) => !r.readAt).length;

  const markAll = async () => {
    await fetch("/api/messages", { method: "PATCH", headers: { "content-type": "application/json" }, body: "{}" }).catch(() => undefined);
    await load();
    router.refresh();
  };

  return (
    <div className="relative">
      <button type="button" className="btn-outline btn-sm relative px-2.5" aria-label={`Notifications, ${unread} unread`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Bell size={14} />
        {unread ? <span className="num absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-2xs font-semibold text-white">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <>
          <button type="button" aria-label="Close" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-3">{unread ? `${unread} unread` : "Notices"}</p>
              {unread ? (
                <button type="button" className="btn-ghost btn-sm" onClick={() => void markAll()}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              ) : null}
            </div>
            <ul className="max-h-80 overflow-y-auto border-t border-line">
              {rows.slice(0, SHOW).map((r) => (
                <li key={r.id} className={cn("border-b border-line/70 px-3 py-2.5", !r.readAt && "bg-accent-soft/40")}>
                  <Link href={r.href ?? inboxHref} onClick={() => setOpen(false)} className="block">
                    <p className={cn("text-sm text-ink", !r.readAt && "font-medium")}>{r.title}</p>
                    <p className="truncate text-xs text-ink-3">{r.body}</p>
                    <p className="num mt-0.5 text-2xs text-ink-3">{when(r.at)}</p>
                  </Link>
                </li>
              ))}
              {!rows.length ? <li className="px-3 py-6 text-center text-xs text-ink-3">Nothing yet.</li> : null}
            </ul>
            <Link href={inboxHref} onClick={() => setOpen(false)} className="block px-3 py-2 text-center text-xs font-medium text-accent hover:bg-surface-2">
              All notices
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
