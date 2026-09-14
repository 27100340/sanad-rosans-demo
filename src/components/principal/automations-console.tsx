"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Card, Chip } from "@/components/ui/primitives";

export interface JobRow {
  id: string;
  name: string;
  schedule: string;
  description: string;
  lastRun: { when: string; summary: string; by: string } | null;
}

/** Each job with its schedule and last run; "Run now" executes it for the branch and refreshes. */
export function AutomationsConsole({ jobs }: { jobs: JobRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, string>>({});

  const run = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/automations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId: id }) });
      const out = (await res.json().catch(() => ({}))) as { run?: { summary: string }; error?: string };
      setResult((r) => ({ ...r, [id]: res.ok && out.run ? out.run.summary : (out.error ?? "Failed") }));
      if (res.ok) router.refresh();
    } catch {
      setResult((r) => ({ ...r, [id]: "Could not reach the server." }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {jobs.map((j) => (
        <Card key={j.id} className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{j.name}</p>
              <p className="text-xs text-ink-3">{j.schedule}</p>
            </div>
            <Chip tone={j.lastRun ? "ok" : "neutral"}>{j.lastRun ? "Scheduled" : "Never run"}</Chip>
          </div>
          <p className="text-xs leading-5 text-ink-2">{j.description}</p>
          <p className="text-2xs text-ink-3">{j.lastRun ? `Last run ${j.lastRun.when} by ${j.lastRun.by}: ${j.lastRun.summary}` : "No runs recorded yet."}</p>
          {result[j.id] ? <p className="chip-ok whitespace-normal">{result[j.id]}</p> : null}
          <button type="button" className="btn-soft btn-sm mt-auto self-start" disabled={busy !== null} onClick={() => void run(j.id)}>
            <Play size={14} /> {busy === j.id ? "Running" : "Run now"}
          </button>
        </Card>
      ))}
    </div>
  );
}
