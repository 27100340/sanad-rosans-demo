"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, ImageOff, LockOpen, RefreshCw } from "lucide-react";
import { Avatar, Chip, EmptyState, type Tone } from "@/components/ui/primitives";
import { GUARD_MODE } from "@/components/assess/labels";
import type { ProctorRow } from "@/lib/data/proctor-list";
import { EVENT_LABEL, type GuardEventType, type ProctorStatus } from "@/lib/domain/proctor";

const API = "/api/assess/proctor";
const EVENT_CHIPS_MAX = 4;

const STATUS: Record<ProctorStatus, { label: string; tone: Tone }> = {
  active: { label: "Sitting now", tone: "info" },
  submitted: { label: "Submitted", tone: "ok" },
  cancelled: { label: "Cancelled", tone: "warn" },
  locked: { label: "Locked", tone: "danger" },
  unlocked: { label: "Unlocked", tone: "accent" },
};

type Filter = "all" | "locked" | "requested" | "active";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "locked", label: "Locked" },
  { id: "requested", label: "Unlock requested" },
  { id: "active", label: "Sitting now" },
];

function matches(row: ProctorRow, filter: Filter): boolean {
  if (filter === "locked") return row.status === "locked";
  if (filter === "requested") return Boolean(row.unlockRequest) && row.status === "locked";
  if (filter === "active") return row.status === "active";
  return true;
}

function stamp(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function eventChips(row: ProctorRow): { type: GuardEventType; count: number }[] {
  return Object.entries(row.events.byType)
    .map(([type, count]) => ({ type: type as GuardEventType, count: count ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, EVENT_CHIPS_MAX);
}

/**
 * One captured still. Stills live in memory for the demo, so a request can 404
 * after a server restart — that must read as "gone", never as the browser's
 * broken-image glyph, which looks like a bug in the product.
 */
function Still({ attemptId, snapshot }: { attemptId: string; snapshot: ProctorRow["snapshots"][number] }) {
  const [failed, setFailed] = useState(false);
  const caption = snapshot.reason || "No reason recorded";
  return (
    <figure className="w-24">
      {failed ? (
        <span className="flex h-16 w-24 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-line bg-surface-2 text-2xs text-ink-3">
          <ImageOff size={14} />
          Not stored
        </span>
      ) : (
        <img
          loading="lazy"
          src={`${API}?attemptId=${encodeURIComponent(attemptId)}&snapshot=${encodeURIComponent(snapshot.id)}`}
          alt={`Camera still captured when: ${caption}`}
          onError={() => setFailed(true)}
          className="h-16 w-24 rounded-lg border border-line bg-surface-2 object-cover"
        />
      )}
      <figcaption className="mt-1 truncate text-2xs text-ink-3" title={`${caption} · ${stamp(snapshot.at)}`}>
        {caption}
      </figcaption>
    </figure>
  );
}

/** Why a sitting has no stills. Always a real reason — an empty grid is not one. */
function noStillsReason(row: ProctorRow): string {
  if (row.mode !== "strict") return `${GUARD_MODE[row.mode].label} sittings are not camera-monitored, so no stills exist for this one.`;
  if (!row.cameraConsent) return "This sitting ran without a camera, so nothing was captured. Only window and keyboard signals were recorded.";
  if (row.events.camera > 0) return "The camera logged warnings for this sitting, but no still is held for them. Stills live in memory in this demo and are cleared whenever the server restarts.";
  return "The camera was on and raised no warnings, so there was nothing to capture. A still is only taken at the moment a camera warning is raised.";
}

function ViolationStills({ row }: { row: ProctorRow }) {
  const count = row.snapshots.length;
  return (
    <div>
      <p className="label flex items-center gap-1.5">
        {count ? <Camera size={12} /> : <CameraOff size={12} />} Violation stills
      </p>
      {count ? (
        <>
          <div className="flex flex-wrap gap-2">
            {row.snapshots.map((s) => (
              <Still key={s.id} attemptId={row.attemptId} snapshot={s} />
            ))}
          </div>
          <p className="mt-1.5 text-2xs text-ink-3">
            <span className="num">{count}</span> real capture{count === 1 ? "" : "s"} from the student&apos;s own camera, taken at the moment each warning was raised. Nothing else was recorded.
          </p>
        </>
      ) : (
        <p className="card-quiet mt-1 px-3 py-2 text-xs text-ink-3">{noStillsReason(row)}</p>
      )}
    </div>
  );
}

/** Teacher's live view of every proctored sitting in their spaces, with the unlock decision. */
export function ProctorConsole({ sessions }: { sessions: ProctorRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = sessions.filter((r) => matches(r, filter));

  const unlock = async (attemptId: string) => {
    setBusy(attemptId);
    setError(null);
    try {
      const res = await fetch(API, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, unlock: true, note: (notes[attemptId] ?? "").trim() }),
      });
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !out.ok) {
        setError(out.error ?? "That session could not be unlocked.");
        return;
      }
      setNotes((prev) => ({ ...prev, [attemptId]: "" }));
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const count = sessions.filter((r) => matches(r, f.id)).length;
          return (
            <button key={f.id} type="button" className={filter === f.id ? "btn-primary btn-sm" : "btn-outline btn-sm"} onClick={() => setFilter(f.id)}>
              {f.label} <span className="num">{count}</span>
            </button>
          );
        })}
        <button type="button" className="btn-ghost btn-sm" onClick={() => router.refresh()}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error ? <p className="chip-danger">{error}</p> : null}

      {rows.length ? (
        <div className="card divide-y divide-line">
          {rows.map((row) => {
            const st = STATUS[row.status];
            const mode = GUARD_MODE[row.mode];
            return (
              <div key={row.attemptId} className="space-y-3 p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar name={row.studentName} size="sm" tone={row.status === "locked" ? "danger" : "accent"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{row.studentName}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-3">
                      {row.testTitle} · {row.subject}
                    </p>
                    <p className="mt-0.5 text-2xs text-ink-3">
                      Started {stamp(row.startedAt)}
                      {row.endedAt ? ` · ended ${stamp(row.endedAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Chip tone={mode.tone}>{mode.label}</Chip>
                    <Chip tone={st.tone}>{st.label}</Chip>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip tone={row.events.total ? "neutral" : "ok"}>{row.events.total} event{row.events.total === 1 ? "" : "s"}</Chip>
                  {row.events.terminal ? <Chip tone="danger">{row.events.terminal} terminal</Chip> : null}
                  {row.events.camera ? <Chip tone="warn">{row.events.camera} from camera</Chip> : null}
                  {eventChips(row).map((e) => (
                    <Chip key={e.type} tone="neutral">
                      {EVENT_LABEL[e.type]} <span className="num">{e.count}</span>
                    </Chip>
                  ))}
                </div>

                {row.lockedReason ? <p className="card-quiet px-3 py-2 text-xs text-ink-2">Locked: {row.lockedReason}</p> : null}

                {row.unlockRequest ? (
                  <div className="rounded-xl bg-warn-soft px-3 py-2">
                    <p className="text-2xs font-semibold uppercase tracking-wide text-warn">Unlock requested · {stamp(row.unlockRequest.at)}</p>
                    <p className="mt-0.5 text-xs text-ink-2">{row.unlockRequest.note || "No reason given."}</p>
                  </div>
                ) : null}

                {row.unlock ? (
                  <p className="text-xs text-ink-3">
                    Unlocked {stamp(row.unlock.at)}
                    {row.unlock.note ? ` · ${row.unlock.note}` : ""}
                  </p>
                ) : null}

                <ViolationStills row={row} />

                {row.status === "locked" ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      className="input py-2 text-xs"
                      aria-label={`Unlock note for ${row.studentName}`}
                      placeholder="Why are you granting a fresh sit?"
                      maxLength={300}
                      value={notes[row.attemptId] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [row.attemptId]: e.target.value }))}
                    />
                    <button type="button" className="btn-primary btn-sm shrink-0" disabled={busy === row.attemptId} onClick={() => void unlock(row.attemptId)}>
                      <LockOpen size={14} /> {busy === row.attemptId ? "Unlocking" : "Unlock"}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={filter === "all" ? "No proctored sittings yet" : "Nothing in this filter"}
          body={filter === "all" ? "Sessions appear here as soon as a student opens a monitored test in one of your spaces." : "Switch the filter to see the other sittings."}
        />
      )}
    </div>
  );
}
