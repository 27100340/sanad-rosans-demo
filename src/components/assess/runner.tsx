"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Unlock } from "lucide-react";
import { Chip } from "@/components/ui/primitives";
import type { AnswerRecord, StudentQuestion } from "@/lib/domain/assessment";
import type { GuardMode, ProctorEvent, ProctorStatus } from "@/lib/domain/proctor";
import { cn } from "@/lib/utils";
import { GUARD_MODE, QUESTION_TYPE, fmtClock } from "./labels";
import { QuestionInput } from "./question-input";
import { useExamGuard, type GuardEvent } from "./use-exam-guard";
import { ProctorCamera, type CameraPhase, type CameraStatus } from "./proctor-camera";
import { ProctorGate } from "./proctor-gate";
import { LockScreen } from "./lock-screen";

const AUTOSAVE_MS = 600;
const GUARD_STRIP_MS = 4000;
const EVENT_FLUSH_MS = 1000;
const WARN_AT_S = 120;
const DANGER_AT_S = 30;
const TESTS_HREF = "/portal/learn/tests";
const JSON_HEADERS = { "content-type": "application/json" };

interface Pending {
  questionId: string;
  response: string;
}

interface PatchOut {
  saved?: boolean;
  secondsLeft?: number | null;
  guardEvents?: number;
  submitted?: boolean;
  error?: string;
}

/** What the student's page may know about their proctor session before the runner mounts. */
export interface ProctorSnapshot {
  status: ProctorStatus;
  lockedReason: string | null;
  unlockRequest: { at: number; note: string } | null;
  unlock: { by: string; at: number; note: string } | null;
}

export interface RunnerProps {
  attemptId: string;
  testId: string;
  title: string;
  subject: string;
  durationMin?: number;
  guardMode: GuardMode;
  proctor: ProctorSnapshot | null;
  questions: StudentQuestion[];
  initialAnswers: AnswerRecord[];
  initialSecondsLeft: number | null;
  initialGuardEvents: number;
}

/**
 *   unlocked   the teacher granted a fresh sit; wait for "Begin again"
 *   gate       strict only: consent → camera → full screen
 *   live       questions on screen; the guard (and camera) are armed
 *   locked     strict terminal event; the teacher must unlock
 *   cancelled  standard terminal event; the attempt is void
 */
type Stage = "unlocked" | "gate" | "live" | "locked" | "cancelled";

type OutEvent = Omit<ProctorEvent, "at">;

function initialStage(mode: GuardMode, proctor: ProctorSnapshot | null): Stage {
  if (mode === "off") return "live";
  if (proctor?.status === "locked") return "locked";
  if (proctor?.status === "cancelled") return "cancelled";
  if (proctor?.status === "unlocked") return "unlocked";
  return mode === "strict" ? "gate" : "live";
}

async function patchAttempt(body: Record<string, unknown>): Promise<PatchOut> {
  const res = await fetch("/api/assess/attempts", { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify(body) });
  const out = (await res.json().catch(() => ({}))) as PatchOut;
  if (!res.ok) throw new Error(out.error ?? "Could not reach the server");
  return out;
}

function Navigator({ count, current, answered, onPick }: { count: number; current: number; answered: (i: number) => boolean; onPick: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Questions">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === current}
          onClick={() => onPick(i)}
          className={cn("num h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition-colors", i === current ? "bg-accent text-white" : answered(i) ? "bg-accent-soft text-accent" : "bg-surface-2 text-ink-2 hover:bg-surface-3")}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

function UnlockedCard({ note, onBegin }: { note: string; onBegin: () => void }) {
  return (
    <div className="card mx-auto max-w-lg p-6 text-center sm:p-8">
      <span className="tile-ok mx-auto h-14 w-14 rounded-2xl">
        <Unlock size={26} />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-ink">Your teacher unlocked this test</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">You may begin again. The earlier session log was cleared and a fresh one starts now.</p>
      {note ? <p className="mx-auto mt-3 max-w-md rounded-xl bg-surface-2 p-3 text-left text-sm text-ink">{note}</p> : null}
      <div className="mt-6 flex justify-center">
        <button type="button" className="btn-primary" onClick={onBegin}>
          Begin again
        </button>
      </div>
    </div>
  );
}

export function Runner({ attemptId, title, subject, durationMin, guardMode, proctor, questions, initialAnswers, initialSecondsLeft, initialGuardEvents }: RunnerProps) {
  const router = useRouter();
  const strict = guardMode === "strict";
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries(initialAnswers.map((a) => [a.questionId, a.response])));
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(initialSecondsLeft);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [guardCount, setGuardCount] = useState(initialGuardEvents);
  const [guardNote, setGuardNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>(() => initialStage(guardMode, proctor));
  const [lockReason, setLockReason] = useState<string>(proctor?.lockedReason ?? "");
  const [camPhase, setCamPhase] = useState<CameraPhase>("off");
  const [camStatus, setCamStatus] = useState<CameraStatus | null>(null);

  const pending = useRef<Pending | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitted = useRef(false);
  const frozen = useRef(false);
  const cameraConsent = useRef(false);
  const queue = useRef<OutEvent[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPromise = useRef<Promise<void> | null>(null);

  const question = questions[index];
  const answeredCount = questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length;
  const live = stage === "live";

  /* ---------------- proctor session: start, batched events, snapshots ---------------- */

  const postProctor = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/assess/proctor", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ attemptId, ...body }) });
      return (await res.json().catch(() => ({}))) as Record<string, unknown>;
    },
    [attemptId],
  );

  // Events wait in the queue until the session has been started on the server.
  const flushEvents = useCallback(async () => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = null;
    if (!startPromise.current || !queue.current.length) return;
    const batch = queue.current.splice(0);
    try {
      await startPromise.current;
      await postProctor({ action: "events", events: batch });
    } catch {
      /* the forensic log is best-effort; the guard still froze the attempt locally */
    }
  }, [postProctor]);

  const queueEvent = useCallback(
    (ev: OutEvent) => {
      if (guardMode === "off") return;
      queue.current.push(ev);
      if (ev.terminal) {
        void flushEvents();
        return;
      }
      if (!flushTimer.current) flushTimer.current = setTimeout(() => void flushEvents(), EVENT_FLUSH_MS);
    },
    [guardMode, flushEvents],
  );

  useEffect(() => {
    if (guardMode === "off" || !live || startPromise.current) return;
    startPromise.current = postProctor({ action: "start", cameraConsent: cameraConsent.current }).then(
      () => undefined,
      () => undefined,
    );
    void flushEvents();
  }, [guardMode, live, postProctor, flushEvents]);

  const noteWarning = useCallback((reason: string) => {
    setGuardCount((n) => n + 1);
    setGuardNote(reason);
    if (guardTimer.current) clearTimeout(guardTimer.current);
    guardTimer.current = setTimeout(() => setGuardNote(null), GUARD_STRIP_MS);
  }, []);

  /** A terminal event: freeze autosave and the clock, report once, and show the lock screen. */
  const terminate = useCallback(
    (reason: string, ev: OutEvent) => {
      if (frozen.current) return;
      frozen.current = true;
      pending.current = null;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setLockReason(reason);
      setStage(strict ? "locked" : "cancelled");
      setCamPhase("off");
      queueEvent({ ...ev, terminal: true });
      void patchAttempt({ attemptId, guardEvent: true })
        .then((out) => {
          if (typeof out.guardEvents === "number") setGuardCount(out.guardEvents);
        })
        .catch(() => undefined);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
    },
    [attemptId, strict, queueEvent],
  );

  useExamGuard({
    active: live && !submitting,
    mode: guardMode,
    onViolation: (reason, ev) => terminate(reason, { type: ev.type, reason, terminal: true, source: "guard" }),
    onEvent: (ev: GuardEvent) => {
      if (ev.terminal) return; // reported through onViolation, exactly once
      queueEvent({ type: ev.type, reason: ev.reason, terminal: false, source: "guard" });
      if (ev.type !== "focus") noteWarning(ev.reason);
    },
  });

  const onCameraEvent = useCallback(
    (ev: GuardEvent) => {
      const out: OutEvent = { type: ev.type, reason: ev.reason, terminal: ev.terminal, source: "camera" };
      if (ev.terminal) {
        terminate(ev.reason, out);
        return;
      }
      queueEvent(out);
      if (ev.type !== "camera_off" && ev.type !== "camera_degraded") setGuardCount((n) => n + 1);
    },
    [queueEvent, terminate],
  );

  const onSnapshot = useCallback(
    (dataUrl: string, reason: string) => {
      void (startPromise.current ?? Promise.resolve()).then(() => postProctor({ action: "snapshot", snapshot: dataUrl, reason })).catch(() => undefined);
    },
    [postProctor],
  );

  /* ---------------- answers, clock, submit ---------------- */

  const flush = useCallback(async () => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setSaveState("saving");
    try {
      const out = await patchAttempt({ attemptId, questionId: p.questionId, response: p.response });
      if (out.secondsLeft !== undefined) setSecondsLeft(out.secondsLeft);
      setSaveState("saved");
      setError(null);
    } catch (e) {
      setSaveState("idle");
      setError(e instanceof Error ? e.message : "Could not save");
    }
  }, [attemptId]);

  const submit = useCallback(async () => {
    if (submitted.current || frozen.current) return;
    submitted.current = true;
    setSubmitting(true);
    setConfirming(false);
    await flush();
    try {
      await patchAttempt({ attemptId, submit: true });
      setCamPhase("off");
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
      router.refresh();
    } catch (e) {
      submitted.current = false;
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Could not submit");
    }
  }, [attemptId, flush, router]);

  const change = (next: string) => {
    if (!question) return;
    setAnswers((a) => ({ ...a, [question.id]: next }));
    pending.current = { questionId: question.id, response: next };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
  };

  const goTo = (i: number) => {
    if (i < 0 || i >= questions.length || i === index) return;
    void flush();
    setIndex(i);
  };

  const timed = secondsLeft !== null;
  useEffect(() => {
    if (!timed || submitting || !live) return;
    const id = setInterval(() => setSecondsLeft((s) => (s === null ? s : Math.max(0, s - 1))), 1000);
    return () => clearInterval(id);
  }, [timed, submitting, live]);

  useEffect(() => {
    if (secondsLeft === 0 && live) void submit();
  }, [secondsLeft, live, submit]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (guardTimer.current) clearTimeout(guardTimer.current);
      if (flushTimer.current) clearTimeout(flushTimer.current);
    },
    [],
  );

  const beginAfterGate = (consent: boolean) => {
    cameraConsent.current = consent;
    setCamPhase(consent ? "live" : "off");
    setStage("live");
  };

  if (!question) return <p className="chip-danger">This test has no questions.</p>;

  const camera = strict && camPhase !== "off" ? <ProctorCamera phase={camPhase} onStatus={setCamStatus} onEvent={onCameraEvent} onSnapshot={onSnapshot} /> : null;

  if (stage === "unlocked") return <UnlockedCard note={proctor?.unlock?.note ?? ""} onBegin={() => setStage(strict ? "gate" : "live")} />;
  if (stage === "locked" || stage === "cancelled") {
    return <LockScreen kind={stage} reason={lockReason} attemptId={attemptId} backHref={TESTS_HREF} unlockRequest={proctor?.unlockRequest ?? null} />;
  }
  if (stage === "gate") {
    return (
      <>
        {camera}
        <ProctorGate title={title} camera={camStatus} onCameraRequested={() => setCamPhase("preview")} onBegin={beginAfterGate} />
      </>
    );
  }

  const clockTone = secondsLeft !== null && secondsLeft < DANGER_AT_S ? "text-danger" : secondsLeft !== null && secondsLeft < WARN_AT_S ? "text-warn" : "text-ink";
  const last = index === questions.length - 1;

  return (
    <>
      {camera}
      <div className="card overflow-hidden">
        <div className="sticky top-14 z-[5] rounded-t-2xl border-b border-line bg-surface">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{title}</p>
              <p className="truncate text-2xs text-ink-3">
                {subject}
                {durationMin ? ` · ${durationMin} min` : " · untimed"}
                {guardMode !== "off" ? ` · ${GUARD_MODE[guardMode].label}` : ""}
                {guardCount > 0 ? ` · ${guardCount} ${guardCount === 1 ? "warning" : "warnings"}` : ""}
              </p>
            </div>
            {secondsLeft !== null ? (
              <span className={cn("num inline-flex items-center gap-1 text-sm font-semibold tabular-nums", clockTone)} aria-live="polite">
                <Clock size={14} />
                {fmtClock(secondsLeft)}
              </span>
            ) : null}
            <span className="hidden text-2xs text-ink-3 sm:inline" aria-live="polite">
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
            </span>
            <button type="button" className="btn-soft btn-sm shrink-0" onClick={() => setConfirming(true)} disabled={submitting || confirming}>
              Submit test
            </button>
          </div>
          <div className="px-4 pb-3">
            <Navigator count={questions.length} current={index} answered={(i) => (answers[questions[i].id] ?? "").trim() !== ""} onPick={goTo} />
          </div>
          {guardNote ? (
            <p className="flex items-center gap-2 bg-warn-soft px-4 py-2 text-xs font-medium text-warn">
              <AlertTriangle size={14} />
              {guardNote}
            </p>
          ) : null}
          {confirming ? (
            <div className="flex flex-col gap-2 border-t border-line bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink">
                <span className="num font-semibold">{answeredCount}</span> of {questions.length} answered. Submit now?
              </p>
              <div className="flex gap-2">
                <button type="button" className="btn-primary btn-sm" onClick={() => void submit()} disabled={submitting}>
                  Confirm
                </button>
                <button type="button" className="btn-outline btn-sm" onClick={() => setConfirming(false)} disabled={submitting}>
                  Keep working
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="num text-xs font-semibold text-ink-3">Question {index + 1}</span>
            <span className="text-xs text-ink-3">· {QUESTION_TYPE[question.type]}</span>
            <Chip tone="neutral">
              {question.marks} {question.marks === 1 ? "mark" : "marks"}
            </Chip>
          </div>
          <p className="whitespace-pre-line text-base leading-relaxed text-ink">{question.stem}</p>
          <QuestionInput key={question.id} question={question} value={answers[question.id] ?? ""} onChange={change} />
          {error ? <p className="chip-danger">{error}</p> : null}
          {submitting ? <p className="text-xs text-ink-3">Submitting and marking your answers…</p> : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
          <button type="button" className="btn-outline btn-sm" onClick={() => goTo(index - 1)} disabled={index === 0 || submitting}>
            <ChevronLeft size={14} />
            Previous
          </button>
          <span className="text-2xs text-ink-3 sm:hidden" aria-live="polite">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
          </span>
          {last ? (
            <button type="button" className="btn-primary btn-sm" onClick={() => setConfirming(true)} disabled={submitting || confirming}>
              Submit test
            </button>
          ) : (
            <button type="button" className="btn-outline btn-sm" onClick={() => goTo(index + 1)} disabled={submitting}>
              Next
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
