"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chip, LinkButton } from "@/components/ui/primitives";
import type { AllocationStatus, TestMode } from "@/lib/domain/assessment";
import { fmtDay } from "@/components/teach/helpers";
import { ALLOCATION_STATUS, TEST_MODE } from "./labels";

export interface TestRow {
  testId: string;
  title: string;
  subject: string;
  mode: TestMode;
  durationMin?: number;
  opensAt: string;
  closesAt: string;
  attemptsAllowed: number;
  status: AllocationStatus;
  attemptId?: string;
  total?: number;
  maxMarks?: number;
}

interface StartOut {
  attemptId?: string;
  error?: string;
}

export function TestList({ rows }: { rows: TestRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<{ testId: string; text: string } | null>(null);

  if (!rows.length) return <p className="text-sm text-ink-3">No tests set yet.</p>;

  const start = async (testId: string) => {
    setPendingId(testId);
    setError(null);
    try {
      const res = await fetch("/api/assess/attempts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ testId }) });
      const out = (await res.json().catch(() => ({}))) as StartOut;
      if (!res.ok || !out.attemptId) {
        setError({ testId, text: out.error ?? "Could not start the test" });
        return;
      }
      router.push(`/portal/learn/tests/${out.attemptId}`);
    } catch {
      setError({ testId, text: "Could not reach the server" });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="card divide-y divide-line">
      {rows.map((r) => {
        const st = ALLOCATION_STATUS[r.status];
        const open = r.status === "not-started" || r.status === "in-progress";
        const busy = pendingId === r.testId;
        return (
          <div key={r.testId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{r.title}</p>
              <p className="mt-0.5 text-xs text-ink-3">
                {r.subject} · {TEST_MODE[r.mode].label} · {r.durationMin ? `${r.durationMin} min` : "untimed"} · closes {fmtDay(r.closesAt)}
              </p>
              {error?.testId === r.testId ? <p className="chip-danger mt-2">{error.text}</p> : null}
            </div>
            <div className="flex items-center gap-3">
              {r.status === "published" && r.total !== undefined ? (
                <span className="num text-sm font-semibold text-ink">
                  {r.total}/{r.maxMarks}
                </span>
              ) : null}
              <Chip tone={st.tone}>{st.label}</Chip>
              {open ? (
                <button type="button" className="btn-primary btn-sm" onClick={() => void start(r.testId)} disabled={busy}>
                  {busy ? "Opening…" : r.status === "in-progress" ? "Continue" : "Start"}
                </button>
              ) : r.attemptId ? (
                <LinkButton href={`/portal/learn/tests/${r.attemptId}`} variant="soft" className="btn-sm">
                  Result
                </LinkButton>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
