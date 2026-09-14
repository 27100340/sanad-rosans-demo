"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import type { TarbiyahLog } from "@/lib/domain/types";

const KINDS: { value: TarbiyahLog["kind"]; label: string }[] = [
  { value: "effort", label: "Effort" },
  { value: "helpfulness", label: "Helpfulness" },
  { value: "akhlaq", label: "Akhlaq" },
  { value: "salah", label: "Salah" },
  { value: "punctuality", label: "Punctuality" },
  { value: "concern", label: "Concern" },
];

/** Quick character observation; praise reaches the guardian tonight, a concern reaches the class teacher and principal. */
export function TarbiyahForm({ studentId, studentFirstName }: { studentId: string; studentFirstName: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<TarbiyahLog["kind"]>("effort");
  const [positive, setPositive] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);

  const pickKind = (k: TarbiyahLog["kind"]) => {
    setKind(k);
    if (k === "concern") setPositive(false);
  };

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tarbiyah", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ studentId, kind, positive, note: note.trim() }) });
      const out = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg({ tone: "danger", text: out.error ?? "Could not save." });
        return;
      }
      setMsg({ tone: "ok", text: positive ? `Logged; it will appear in ${studentFirstName}'s parent brief tonight.` : "Logged; the class teacher and principal have been notified." });
      setNote("");
      router.refresh();
    } catch {
      setMsg({ tone: "danger", text: "Could not reach the server." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="card space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (note.trim().length >= 5 && !busy) void save();
      }}
    >
      <h2 className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">
        <HeartHandshake size={13} className="text-accent" /> Tarbiyah log
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {KINDS.map((k) => (
          <button key={k.value} type="button" className={kind === k.value ? "btn-soft btn-sm" : "btn-outline btn-sm"} onClick={() => pickKind(k.value)}>
            {k.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-ink-2">
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="tone" checked={positive} onChange={() => setPositive(true)} disabled={kind === "concern"} /> Praise
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="tone" checked={!positive} onChange={() => setPositive(false)} /> Concern
        </label>
      </div>
      <textarea className="input min-h-20" value={note} onChange={(e) => setNote(e.target.value)} placeholder="One sentence, specific: what you saw and when." maxLength={400} />
      {msg ? <p className={msg.tone === "ok" ? "chip-ok" : "chip-danger"}>{msg.text}</p> : null}
      <div className="flex justify-end">
        <button type="submit" className="btn-primary btn-sm" disabled={busy || note.trim().length < 5}>
          {busy ? "Saving" : "Log observation"}
        </button>
      </div>
    </form>
  );
}
