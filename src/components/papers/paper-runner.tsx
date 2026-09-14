"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { Chip, SectionTitle } from "@/components/ui/primitives";
import { fmtClock } from "@/components/assess/labels";
import type { Paper, StudentPaperQuestion } from "@/lib/data/pastpapers";
import { secondsFor } from "@/lib/data/pastpapers";
import type { PaperAnswer, PaperAttempt } from "@/lib/domain/assessment";
import { cn } from "@/lib/utils";
import { AnswerPad } from "./answer-pad";
import { QuestionFigure } from "./question-figure";

/** The key and scheme for one question; only ever present once that question has been answered. */
export interface Revealed {
  answer: string | null;
  msImg: string[];
  msRows: string[];
}

export interface PaperRunnerProps {
  attemptId: string;
  paper: Paper;
  pace: PaperAttempt["pace"];
  questions: StudentPaperQuestion[];
  answers: PaperAnswer[];
  revealed: Record<string, Revealed>;
}

interface Draft {
  response: string;
  image?: string;
}

interface PatchOut {
  answer?: PaperAnswer;
  revealed?: Revealed | null;
  total?: number;
  finished?: boolean;
  error?: string;
}

const WARN_FRACTION = 0.2;
const DANGER_AT_S = 10;
const EMPTY_DRAFT: Draft = { response: "" };

async function patchPaper(body: Record<string, unknown>): Promise<PatchOut> {
  const res = await fetch("/api/assess/papers", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
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

/** The locked view of an answered question: marks, evidence, feedback, then the scheme. */
function AnsweredView({ question, answer, revealed }: { question: StudentPaperQuestion; answer: PaperAnswer; revealed?: Revealed }) {
  const full = answer.awarded === question.marks;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={answer.status === "unanswered" ? "neutral" : full ? "ok" : answer.awarded > 0 ? "warn" : "danger"}>
          {answer.awarded}/{question.marks} {question.marks === 1 ? "mark" : "marks"}
        </Chip>
        {question.type === "mcq" && revealed?.answer ? <span className="num text-xs text-ink-2">Key: {revealed.answer}</span> : null}
        <span className="num text-xs text-ink-3">· {fmtClock(answer.secondsUsed)} used</span>
      </div>

      {answer.transcribed ? (
        <div>
          <p className="label">What we read from your photo</p>
          <pre className="whitespace-pre-wrap rounded-xl bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-ink">{answer.response}</pre>
        </div>
      ) : question.type === "structured" ? (
        <div>
          <p className="label">Your answer</p>
          <pre className="whitespace-pre-wrap rounded-xl bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-ink">{answer.response || "No answer"}</pre>
        </div>
      ) : (
        <p className="text-xs text-ink-3">
          You chose <span className="num font-medium text-ink">{answer.response || "nothing"}</span>
        </p>
      )}

      {answer.points.length ? (
        <ul className="space-y-1">
          {answer.points.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              {p.earned ? <Check size={14} className="mt-0.5 shrink-0 text-ok" /> : <X size={14} className="mt-0.5 shrink-0 text-danger" />}
              <span className="text-ink-2">
                <span className="font-medium text-ink">{p.label}</span> · {p.evidence}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {answer.feedback ? <p className="border-l-2 border-accent pl-3 text-sm text-ink-2">{answer.feedback}</p> : null}

      {revealed && (revealed.msImg.length || revealed.msRows.length) ? (
        <section>
          <SectionTitle title="Mark scheme" hint="The official scheme for this question." />
          {revealed.msImg.length ? (
            <div className="space-y-2">
              {revealed.msImg.map((src, i) => (
                <img key={src} src={src} alt={`Mark scheme for ${question.ref}${revealed.msImg.length > 1 ? ` part ${i + 1}` : ""}`} className="h-auto w-full max-w-full rounded-xl border border-line bg-white" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1 rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs text-ink-2">
              {revealed.msRows.map((row, i) => (
                <li key={i} className="whitespace-pre-wrap">
                  {row}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

export function PaperRunner({ attemptId, paper, pace, questions, answers: initialAnswers, revealed: initialRevealed }: PaperRunnerProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, PaperAnswer>>(() => Object.fromEntries(initialAnswers.map((a) => [a.questionId, a])));
  const [revealed, setRevealed] = useState<Record<string, Revealed>>(initialRevealed);
  const [index, setIndex] = useState(() => {
    const answeredIds = new Set(initialAnswers.map((a) => a.questionId));
    const first = questions.findIndex((q) => !answeredIds.has(q.id));
    return first < 0 ? 0 : first;
  });
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insertOpen, setInsertOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [total, setTotal] = useState(() => initialAnswers.reduce((a, x) => a + x.awarded, 0));

  const draftRef = useRef<Draft>(EMPTY_DRAFT);
  const busy = useRef(false);
  const openedAt = useRef(Date.now());

  const question = questions[index];
  const current = question ? answers[question.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const timed = pace === "paper";

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // Each time an unanswered question is opened, the pad clears and the per-question clock (if paced) restarts.
  useEffect(() => {
    setDraft(EMPTY_DRAFT);
    setError(null);
    openedAt.current = Date.now();
    if (!question || answers[question.id] || !timed) {
      setSecondsLeft(null);
      return;
    }
    setSecondsLeft(secondsFor(question));
    const id = setInterval(() => setSecondsLeft((s) => (s === null ? s : Math.max(0, s - 1))), 1000);
    return () => clearInterval(id);
    // Only the opened question should restart the clock; `answers` is read once at open.
  }, [question?.id, timed]);

  const mark = useCallback(async () => {
    if (!question || busy.current) return;
    busy.current = true;
    setMarking(true);
    setError(null);
    const { response, image } = draftRef.current;
    const budget = secondsFor(question);
    const secondsUsed = timed && secondsLeft !== null ? budget - secondsLeft : Math.round((Date.now() - openedAt.current) / 1000);
    try {
      const out = await patchPaper({ attemptId, questionId: question.id, response, image, secondsUsed });
      if (out.answer) setAnswers((a) => ({ ...a, [question.id]: out.answer as PaperAnswer }));
      if (out.revealed) setRevealed((r) => ({ ...r, [question.id]: out.revealed as Revealed }));
      if (typeof out.total === "number") setTotal(out.total);
      setSecondsLeft(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark this question");
    } finally {
      busy.current = false;
      setMarking(false);
    }
  }, [attemptId, question, timed, secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0 && question && !answers[question.id]) void mark();
  }, [secondsLeft, question, answers, mark]);

  const finish = async () => {
    setFinishing(true);
    setConfirming(false);
    try {
      await patchPaper({ attemptId, finish: true });
      router.refresh();
    } catch (e) {
      setFinishing(false);
      setError(e instanceof Error ? e.message : "Could not finish the paper");
    }
  };

  const goTo = (i: number) => {
    if (i < 0 || i >= questions.length || i === index || marking) return;
    setIndex(i);
  };

  if (!question) return <p className="chip-danger">This paper has no questions.</p>;

  const budget = secondsFor(question);
  const clockTone = secondsLeft !== null && secondsLeft < DANGER_AT_S ? "text-danger" : secondsLeft !== null && secondsLeft < budget * WARN_FRACTION ? "text-warn" : "text-ink";
  const last = index === questions.length - 1;

  return (
    <div className="card overflow-hidden">
      <div className="sticky top-14 z-[5] rounded-t-2xl border-b border-line bg-surface">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{paper.label}</p>
            <p className="num truncate text-2xs text-ink-3">
              Question {index + 1} of {questions.length} · {total}/{paper.marks}
            </p>
          </div>
          {timed ? (
            secondsLeft !== null ? (
              <span className={cn("num inline-flex items-center gap-1 text-sm font-semibold tabular-nums", clockTone)} aria-live="polite">
                <Clock size={14} />
                {fmtClock(secondsLeft)}
              </span>
            ) : null
          ) : (
            <span className="inline-flex items-center gap-1 text-2xs text-ink-3">
              <Clock size={12} />
              Untimed
            </span>
          )}
          <button type="button" className="btn-soft btn-sm shrink-0" onClick={() => setConfirming(true)} disabled={finishing || confirming || marking}>
            Finish paper
          </button>
        </div>
        <div className="px-4 pb-3">
          <Navigator count={questions.length} current={index} answered={(i) => Boolean(answers[questions[i].id])} onPick={goTo} />
        </div>
        {confirming ? (
          <div className="flex flex-col gap-2 border-t border-line bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink">
              <span className="num font-semibold">{answeredCount}</span> of {questions.length} answered. Finish now? Unanswered questions score zero.
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-primary btn-sm" onClick={() => void finish()} disabled={finishing}>
                Confirm
              </button>
              <button type="button" className="btn-outline btn-sm" onClick={() => setConfirming(false)} disabled={finishing}>
                Keep working
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {question.insertImg.length ? (
          <button type="button" className="btn-outline btn-sm" onClick={() => setInsertOpen((o) => !o)} aria-expanded={insertOpen}>
            <BookOpen size={14} />
            {insertOpen ? "Hide insert" : "Show insert"}
          </button>
        ) : null}
        <QuestionFigure img={question.img} insertImg={question.insertImg} insertOpen={insertOpen} refLabel={question.ref} marks={question.marks} />

        {current ? (
          <AnsweredView question={question} answer={current} revealed={revealed[question.id]} />
        ) : (
          <AnswerPad
            key={question.id}
            type={question.type}
            response={draft.response}
            image={draft.image}
            onResponse={(response) => setDraft((d) => ({ ...d, response }))}
            onImage={(image) => setDraft((d) => ({ ...d, image }))}
            onMark={() => void mark()}
            marking={marking}
          />
        )}
        {error ? <p className="chip-danger">{error}</p> : null}
        {finishing ? <p className="text-xs text-ink-3">Sealing your sitting…</p> : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
        <button type="button" className="btn-outline btn-sm" onClick={() => goTo(index - 1)} disabled={index === 0 || marking || finishing}>
          <ChevronLeft size={14} />
          Previous
        </button>
        {last ? (
          <button type="button" className="btn-primary btn-sm" onClick={() => setConfirming(true)} disabled={finishing || confirming || marking}>
            Finish paper
          </button>
        ) : (
          <button type="button" className="btn-outline btn-sm" onClick={() => goTo(index + 1)} disabled={marking || finishing}>
            Next
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
