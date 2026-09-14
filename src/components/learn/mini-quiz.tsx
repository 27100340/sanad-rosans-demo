"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { StudentQuestion } from "@/lib/domain/assessment";
import { cn } from "@/lib/utils";

export interface QuizResult {
  questionId: string;
  earned: boolean;
  correct: string;
  feedback: string;
}

/** One tutor mini-quiz, held inside a chat bubble. Fully controlled so it survives space switches. */
export interface QuizState {
  topicCode: string;
  questions: StudentQuestion[];
  responses: Record<string, string>;
  results?: QuizResult[];
  score?: number;
  total?: number;
}

interface MarkResponse {
  results?: QuizResult[];
  score?: number;
  total?: number;
  error?: string;
}

const LETTERS = "ABCDEFGH";

function QuestionBlock({ q, index, response, result, locked, onAnswer }: { q: StudentQuestion; index: number; response: string; result?: QuizResult; locked: boolean; onAnswer: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        {result ? (
          <span className={cn("mt-0.5 shrink-0", result.earned ? "text-ok" : "text-danger")} aria-label={result.earned ? "Correct" : "Incorrect"}>
            {result.earned ? <Check size={16} /> : <X size={16} />}
          </span>
        ) : (
          <span className="num mt-0.5 shrink-0 text-xs font-semibold text-ink-3">{index + 1}.</span>
        )}
        <p className="text-sm text-ink">{q.stem}</p>
      </div>
      {q.type === "mcq" ? (
        <div className="grid gap-1.5 pl-6">
          {(q.options ?? []).map((opt, i) => {
            const chosen = response === String(i);
            return (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => onAnswer(String(i))}
                className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default", chosen ? "border-accent bg-accent-soft/60 text-ink" : "border-line bg-surface text-ink-2 hover:bg-surface-2")}
              >
                <span className="num w-4 shrink-0 text-xs font-semibold text-ink-3">{LETTERS[i] ?? i + 1}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="pl-6">
          <input className="input max-w-40" inputMode="decimal" placeholder="Your answer" value={response} onChange={(e) => onAnswer(e.target.value)} disabled={locked} aria-label={`Answer to question ${index + 1}`} />
        </div>
      )}
      {result ? (
        <div className="space-y-0.5 pl-6 text-xs">
          {!result.earned ? <p className="text-ink">Correct answer: {result.correct}</p> : null}
          <p className="text-ink-3">{result.feedback}</p>
        </div>
      ) : null}
    </div>
  );
}

export function MiniQuiz({ spaceId, quiz, onChange }: { spaceId: string; quiz: QuizState; onChange: (next: QuizState) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const marked = quiz.results !== undefined;
  const answered = quiz.questions.every((q) => (quiz.responses[q.id] ?? "").trim() !== "");
  const resultFor = (id: string) => quiz.results?.find((r) => r.questionId === id);

  const check = async () => {
    if (busy || marked) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assess/quiz", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spaceId, responses: quiz.questions.map((q) => ({ questionId: q.id, response: quiz.responses[q.id] ?? "" })) }),
      });
      const out = (await res.json().catch(() => ({}))) as MarkResponse;
      if (!res.ok || !out.results) {
        setError(out.error ?? "Could not mark the quiz. Try again.");
        return;
      }
      onChange({ ...quiz, results: out.results, score: out.score ?? 0, total: out.total ?? out.results.length });
    } catch {
      setError("Could not reach the marker. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-[85%] space-y-4 rounded-2xl rounded-bl-md border border-line bg-surface p-4">
      {quiz.questions.map((q, i) => (
        <QuestionBlock key={q.id} q={q} index={i} response={quiz.responses[q.id] ?? ""} result={resultFor(q.id)} locked={marked || busy} onAnswer={(value) => onChange({ ...quiz, responses: { ...quiz.responses, [q.id]: value } })} />
      ))}
      {error ? <p className="chip-danger">{error}</p> : null}
      {marked ? (
        <p className="num text-sm font-semibold text-ink">
          {quiz.score}/{quiz.total}
        </p>
      ) : (
        <button type="button" className="btn-primary btn-sm" onClick={() => void check()} disabled={busy || !answered}>
          {busy ? "Marking…" : "Check answers"}
        </button>
      )}
    </div>
  );
}
