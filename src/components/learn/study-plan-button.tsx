"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

/** Builds this week's sequence and today's challenge; idempotent, so pressing it twice adds nothing. */
export function StudyPlanButton({ hasPlan }: { hasPlan: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const build = async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/study-plan", { method: "POST" });
      const out = (await res.json().catch(() => ({}))) as { created?: number; error?: string };
      if (!res.ok) {
        setNote(out.error ?? "Could not build the plan.");
        return;
      }
      setNote(out.created ? `${out.created} new step${out.created === 1 ? "" : "s"} added.` : "Your plan is already up to date for today.");
      router.refresh();
    } catch {
      setNote("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="btn-primary" disabled={busy} onClick={() => void build()}>
        <Sparkles size={14} /> {busy ? "Building" : hasPlan ? "Refresh today's plan" : "Build my plan"}
      </button>
      {note ? <span className="text-xs text-ink-2">{note}</span> : null}
    </div>
  );
}
