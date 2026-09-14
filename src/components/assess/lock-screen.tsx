"use client";

import { useState } from "react";
import { Lock, Send, ShieldAlert } from "lucide-react";
import { LinkButton } from "@/components/ui/primitives";

/**
 * What the student sees once a terminal event freezes the attempt.
 *   strict   → "locked": explain to the teacher, who can grant a fresh sit
 *   standard → "cancelled": the attempt is void; back to the tests list
 */

const JSON_HEADERS = { "content-type": "application/json" };
const MAX_NOTE_CHARS = 1000;

export type LockKind = "locked" | "cancelled";

export function LockScreen({
  kind,
  reason,
  attemptId,
  backHref,
  unlockRequest,
}: {
  kind: LockKind;
  reason: string;
  attemptId: string;
  backHref: string;
  unlockRequest: { at: number; note: string } | null;
}) {
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<string | null>(unlockRequest?.note ?? null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/assess/proctor", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ attemptId, action: "request-unlock", note }) });
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !out.ok) throw new Error(out.error ?? "Could not send your note");
      setSent(note.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send your note");
    } finally {
      setSending(false);
    }
  };

  const locked = kind === "locked";
  return (
    <div className="card mx-auto max-w-lg p-6 text-center sm:p-8">
      <span className={locked ? "tile-danger mx-auto h-14 w-14 rounded-2xl" : "tile-warn mx-auto h-14 w-14 rounded-2xl"}>{locked ? <Lock size={26} /> : <ShieldAlert size={26} />}</span>
      <h2 className="mt-4 text-xl font-semibold text-ink">{locked ? "This test is locked" : "This attempt was cancelled"}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{reason}</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-ink-3">
        {locked
          ? "A proctored test sits in one full-screen window with the camera on. Your teacher reviews the session and can unlock a fresh sit."
          : "A no-help test must be sat in a single window: no minimising, tab-switching or split-screen once it begins."}
      </p>

      {locked ? (
        sent !== null ? (
          <div className="mt-6 rounded-xl bg-surface-2 p-4 text-left">
            <p className="text-xs font-medium text-ink-3">Sent to your teacher</p>
            <p className="mt-1 whitespace-pre-line text-sm text-ink">{sent || "No note"}</p>
            <p className="mt-2 text-xs text-ink-3">Reload this page after your teacher unlocks the test.</p>
          </div>
        ) : (
          <div className="mt-6 text-left">
            <label className="label" htmlFor="unlock-note">
              Explain to your teacher
            </label>
            <textarea id="unlock-note" className="input min-h-24" maxLength={MAX_NOTE_CHARS} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened? Your teacher reads this alongside the session log." />
            {error ? <p className="chip-danger mt-2">{error}</p> : null}
            <div className="mt-3 flex justify-end">
              <button type="button" className="btn-primary" disabled={sending} onClick={() => void send()}>
                <Send size={14} />
                Send to teacher
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="mt-6 flex justify-center">
          <LinkButton href={backHref} variant="soft">
            Back to tests
          </LinkButton>
        </div>
      )}
    </div>
  );
}
