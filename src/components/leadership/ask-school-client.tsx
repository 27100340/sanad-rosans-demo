"use client";

import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { AskAnswerCard } from "@/components/leadership/ask-answer";
import { Card, Chip, EmptyState, SectionTitle } from "@/components/ui/primitives";
import type { AskAnswer } from "@/lib/ai/ask-school";

const MAX_SESSION_ROWS = 6;

export function AskSchoolClient({ suggestions }: { suggestions: string[] }) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<AskAnswer | null>(null);
  const [history, setHistory] = useState<AskAnswer[]>([]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/ask-school", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q }) });
      const json = (await res.json()) as AskAnswer | { error: string };
      if (!res.ok || "error" in json) {
        setError("error" in json ? json.error : "The school could not answer just now.");
        return;
      }
      setCurrent(json);
      setHistory((h) => [json, ...h].slice(0, MAX_SESSION_ROWS));
      setQuestion("");
    } catch {
      setError("The school could not answer just now.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(question);
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="ask-question">
            Question
          </label>
          <input
            id="ask-question"
            className="input"
            placeholder="Ask about attendance, marks, fees, enrolment or teachers"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={pending}
            autoComplete="off"
          />
          <button type="submit" className="btn-primary shrink-0" disabled={pending || !question.trim()}>
            <Sparkles size={16} />
            {pending ? "Thinking" : "Ask"}
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => void ask(s)} disabled={pending} className="chip-accent transition-colors hover:bg-accent/15 disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </Card>

      {pending && !current ? (
        <Card className="space-y-3">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </Card>
      ) : current ? (
        <AskAnswerCard answer={current} />
      ) : (
        <EmptyState title="Ask anything the registers already know" body="Answers cite the figures they used. Every question is logged for audit." />
      )}

      {history.length > 1 ? (
        <section>
          <SectionTitle title="Asked this session" />
          <Card className="p-0">
            <ul className="divide-y divide-line">
              {history.slice(1).map((h, i) => (
                <li key={`${h.question}-${i}`}>
                  <button type="button" onClick={() => setCurrent(h)} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm text-ink hover:bg-surface-2">
                    <span className="truncate">{h.question}</span>
                    <Chip tone={h.live ? "ok" : "neutral"}>{h.live ? "AI live" : "scripted"}</Chip>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
