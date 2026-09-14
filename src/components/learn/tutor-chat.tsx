"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Chip } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { humanTag } from "@/components/teach/helpers";
import type { StudentQuestion } from "@/lib/domain/assessment";
import { MiniQuiz, type QuizState } from "./mini-quiz";

export interface TutorSpaceOption {
  id: string;
  subject: string;
  intro: string;
  policy: string;
  unlocked: string[];
}

interface Bubble {
  role: "student" | "tutor";
  text: string;
  tag?: string | null;
  quiz?: QuizState;
}

interface TutorResponse {
  reply: string;
  misconceptionTag: string | null;
  live: boolean;
}

interface QuizResponse {
  topicCode?: string;
  questions?: StudentQuestion[];
  error?: string;
}

const URDU_RE = /[؀-ۿ]/;

function quizIntro(topicCode: string): string {
  return `Three quick questions on ${topicCode}. Answer each; I mark them instantly.`;
}

function quizFollowUp(score: number, total: number): string {
  const missed = total - score;
  return missed > 0 ? `You missed ${missed}. Want to walk through the first one step by step? Paste your working.` : "All three right. Ask me for a harder one or move on.";
}

function MessageBubble({ bubble }: { bubble: Bubble }) {
  const mine = bubble.role === "student";
  const urdu = URDU_RE.test(bubble.text);
  return (
    <div className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
      <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed", mine ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-surface-2 text-ink", urdu && "urdu text-base")}>
        {bubble.text}
      </div>
      {bubble.tag ? <span className="text-2xs text-ink-3">Noted for your teacher · {humanTag(bubble.tag)}</span> : null}
    </div>
  );
}

export function TutorChat({ spaces, initialSpaceId, autoQuiz = false }: { spaces: TutorSpaceOption[]; initialSpaceId: string; autoQuiz?: boolean }) {
  const [spaceId, setSpaceId] = useState(initialSpaceId);
  const [threads, setThreads] = useState<Record<string, Bubble[]>>(() => Object.fromEntries(spaces.map((s) => [s.id, [{ role: "tutor", text: s.intro }]])));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const autoQuizFired = useRef(false);

  const space = spaces.find((s) => s.id === spaceId) ?? spaces[0];
  const thread = threads[space.id] ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length, busy]);

  const startQuiz = async (targetSpaceId: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assess/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spaceId: targetSpaceId }),
      });
      const out = (await res.json().catch(() => ({}))) as QuizResponse;
      if (!res.ok || !out.questions?.length) {
        setError(out.error ?? "Could not build a quiz right now.");
        return;
      }
      const quiz: QuizState = { topicCode: out.topicCode ?? "", questions: out.questions, responses: {} };
      setThreads((t) => ({ ...t, [targetSpaceId]: [...(t[targetSpaceId] ?? []), { role: "tutor", text: quizIntro(quiz.topicCode) }, { role: "tutor", text: "", quiz }] }));
    } catch {
      setError("Could not reach the tutor. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const updateQuiz = (targetSpaceId: string, index: number, next: QuizState) => {
    setThreads((t) => {
      const current = t[targetSpaceId] ?? [];
      const was = current[index]?.quiz;
      const updated = current.map((b, i) => (i === index ? { ...b, quiz: next } : b));
      const justMarked = next.results !== undefined && was?.results === undefined;
      return { ...t, [targetSpaceId]: justMarked ? [...updated, { role: "tutor", text: quizFollowUp(next.score ?? 0, next.total ?? next.questions.length) }] : updated };
    });
  };

  useEffect(() => {
    if (!autoQuiz || autoQuizFired.current || !initialSpaceId) return;
    autoQuizFired.current = true;
    void startQuiz(initialSpaceId);
    // Fires once on mount for the initial space only; the ref guard makes a re-run a no-op.
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...thread, { role: "student" as const, text }];
    setThreads((t) => ({ ...t, [space.id]: next }));
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spaceId: space.id, messages: next.filter((b) => !b.quiz).map((b) => ({ role: b.role, text: b.text })) }),
      });
      if (!res.ok) return;
      const out = (await res.json()) as TutorResponse;
      setThreads((t) => ({ ...t, [space.id]: [...next, { role: "tutor", text: out.reply, tag: out.misconceptionTag }] }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <div className="flex gap-2 overflow-x-auto lg:flex-col">
        {spaces.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSpaceId(s.id)}
            className={cn("shrink-0 rounded-xl border px-4 py-3 text-left transition-colors lg:shrink", s.id === space.id ? "border-accent bg-accent-soft/60" : "border-line bg-surface hover:bg-surface-2")}
          >
            <p className="text-sm font-medium text-ink">{s.subject}</p>
            <p className="mt-0.5 text-2xs text-ink-3">{s.policy}</p>
          </button>
        ))}
      </div>
      <div className="card flex min-h-[28rem] flex-col">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-4 py-3">
          <span className="mr-1 text-xs text-ink-3">Unlocked</span>
          {space.unlocked.map((u) => (
            <Chip key={u} tone="accent">
              {u}
            </Chip>
          ))}
          <button type="button" className="btn-soft btn-sm ml-auto" onClick={() => void startQuiz(space.id)} disabled={busy}>
            <Sparkles size={14} />
            Quiz me
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {thread.map((b, i) => (b.quiz ? <MiniQuiz key={i} spaceId={space.id} quiz={b.quiz} onChange={(next) => updateQuiz(space.id, i, next)} /> : <MessageBubble key={i} bubble={b} />))}
          {error ? <p className="chip-danger">{error}</p> : null}
          {busy ? <div className="skeleton h-9 w-40 rounded-2xl" /> : null}
          <div ref={endRef} />
        </div>
        <form
          className="flex gap-2 border-t border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input className="input" placeholder="Ask about a step, not the answer" value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} aria-label="Message the tutor" />
          <button type="submit" className="btn-primary shrink-0 px-3" disabled={busy || !input.trim()} aria-label="Send">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
