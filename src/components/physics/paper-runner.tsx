"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCheck, Clock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Card, Chip, Progress, SectionTitle } from "@/components/ui/primitives";
import { QuestionCard, type SchemeRow } from "./question-card";
import { cn } from "@/lib/utils";
import type { AllocationMode, AttemptQuestion, StudentQuestion } from "@/lib/domain/physics";
import { ALLOCATION_MODE_BLURB, ALLOCATION_MODE_LABEL, LEVEL_LABEL, THINKING_LEVELS, pct, scoreTone } from "@/lib/domain/physics";

interface SubmitResponse {
  submitted?: boolean;
  released?: boolean;
  attemptId?: string;
  result?: { awarded: number; total: number; percent: number; perQuestion: AttemptQuestion[] };
  error?: string;
}

const SECONDS_PER_MINUTE = 60;
const TICK_MS = 1000;

function clock(seconds: number): string {
  const m = Math.floor(seconds / SECONDS_PER_MINUTE);
  const s = seconds % SECONDS_PER_MINUTE;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * A student sitting an allocated paper. The mark scheme is only in this
 * component's props when the allocation is open book — for the other two modes
 * the server never sends it, so there is nothing to reveal even in the network
 * tab.
 */
export function PaperRunner({
  allocationId,
  title,
  mode,
  instructions,
  durationMin,
  questions,
  scheme,
  totalMarks,
}: {
  allocationId: string;
  title: string;
  mode: AllocationMode;
  instructions: string | null;
  durationMin: number;
  questions: StudentQuestion[];
  scheme: Record<string, SchemeRow> | null;
  totalMarks: number;
}) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<SubmitResponse | null>(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (outcome) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / TICK_MS)), TICK_MS);
    return () => clearInterval(timer);
  }, [outcome]);

  const answered = useMemo(() => questions.filter((q) => (responses[q.id] ?? "").trim()).length, [questions, responses]);
  const revealsUsed = useMemo(() => Object.values(revealed).filter(Boolean).length, [revealed]);
  const overtime = elapsed > durationMin * SECONDS_PER_MINUTE;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/physics/attempt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ allocationId, responses, durationSec: elapsed, revealsUsed }),
      });
      const out = (await res.json().catch(() => ({}))) as SubmitResponse;
      if (!res.ok || !out.submitted) {
        setError(out.error ?? "Could not submit this paper.");
        return;
      }
      setOutcome(out);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Could not reach the server. Your answers are still on screen — try again.");
    } finally {
      setBusy(false);
    }
  };

  const markedFor = (id: string) => outcome?.result?.perQuestion.find((m) => m.id === id);

  const byLevel = useMemo(() => {
    const rows = outcome?.result?.perQuestion ?? [];
    return THINKING_LEVELS.map((level) => {
      const matching = rows.filter((m) => m.level === level);
      return { level, awarded: matching.reduce((s, m) => s + (m.earned ?? 0), 0), total: matching.reduce((s, m) => s + m.marks, 0) };
    }).filter((row) => row.total > 0);
  }, [outcome]);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="num mt-0.5 text-2xs text-ink-3">
              {questions.length} questions · {totalMarks} marks · {durationMin} min suggested
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <Chip tone={mode === "test" ? "danger" : mode === "assignment_nohelp" ? "warn" : "info"}>{ALLOCATION_MODE_LABEL[mode]}</Chip>
            {!outcome ? (
              <Chip tone={overtime ? "warn" : "neutral"}>
                <Clock size={12} />
                <span className="num">{clock(elapsed)}</span>
              </Chip>
            ) : null}
          </div>
        </div>
        <p className="text-xs leading-5 text-ink-3">{ALLOCATION_MODE_BLURB[mode]}</p>
        {instructions ? <p className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs leading-6 text-ink-2">{instructions}</p> : null}

        {!outcome ? (
          <div className="space-y-2 border-t border-line pt-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xs text-ink-3">
                <span className="num font-semibold text-ink">{answered}</span> of <span className="num">{questions.length}</span> answered
                {scheme && revealsUsed ? ` · ${revealsUsed} mark scheme${revealsUsed === 1 ? "" : "s"} revealed` : ""}
              </p>
              <button type="button" onClick={submit} disabled={busy} className="btn-primary btn-sm shrink-0">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
                Submit paper
              </button>
            </div>
            <Progress value={pct(answered, questions.length)} tone="accent" />
          </div>
        ) : null}
      </Card>

      {error ? <div className="rounded-xl border border-danger/30 bg-danger-soft/50 px-4 py-3 text-sm text-danger">{error}</div> : null}

      {outcome && !outcome.released ? (
        <Card className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ok" />
          <div>
            <p className="text-sm font-medium text-ink">Submitted under test conditions.</p>
            <p className="mt-1 text-xs leading-6 text-ink-2">
              Your script has been marked and stored. Your teacher decides when the marks are released, so nothing is shown here yet — and the mark scheme stays
              closed until then.
            </p>
          </div>
        </Card>
      ) : null}

      {outcome?.result ? (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Your result</p>
              <p className="num text-2xl font-semibold leading-none text-ink">
                {outcome.result.awarded}
                <span className="text-base text-ink-3"> / {outcome.result.total}</span>
              </p>
            </div>
            <Chip tone={scoreTone(outcome.result.percent)}>{outcome.result.percent}%</Chip>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {byLevel.map((row) => (
              <div key={row.level}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-xs text-ink-2">
                    {row.level} · {LEVEL_LABEL[row.level]}
                  </span>
                  <span className="num text-xs font-medium text-ink">
                    {row.awarded}/{row.total}
                  </span>
                </div>
                <Progress value={pct(row.awarded, row.total)} tone={scoreTone(pct(row.awarded, row.total))} />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="space-y-4">
        <SectionTitle title={outcome ? "Your script, marked" : "The paper"} hint={outcome ? "Every question with the marks it earned." : undefined} />
        {questions.map((q, index) => {
          const marked = markedFor(q.id);
          const canReveal = Boolean(scheme) && !outcome;
          return (
            <div key={q.id} className="space-y-2">
              <QuestionCard
                index={index}
                question={q}
                scheme={scheme?.[q.id]}
                showScheme={Boolean(outcome?.released) || Boolean(revealed[q.id])}
                marked={marked}
                response={responses[q.id] ?? ""}
                onRespond={(value) => setResponses((r) => ({ ...r, [q.id]: value }))}
                disabled={Boolean(outcome)}
              />
              {canReveal ? (
                <button
                  type="button"
                  onClick={() => setRevealed((r) => ({ ...r, [q.id]: !r[q.id] }))}
                  className={cn("btn-ghost btn-sm", revealed[q.id] && "text-warn")}
                >
                  {revealed[q.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                  {revealed[q.id] ? "Hide the mark scheme" : "Reveal the mark scheme"}
                  <span className="text-2xs text-ink-3">counted</span>
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
