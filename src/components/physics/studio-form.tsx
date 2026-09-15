"use client";

import { useState } from "react";
import { Loader2, Send, ShieldQuestion } from "lucide-react";
import { Card, Chip, EmptyState } from "@/components/ui/primitives";
import { GuidedAnswerView, ModeChip, ProvenanceBadge, TopicChip } from "./answer-card";
import { cn } from "@/lib/utils";
import type { HelpMode, StudioAnswer } from "@/lib/domain/physics";
import { HELP_BLURB, HELP_LABEL, HELP_MODES } from "@/lib/domain/physics";

interface StudioResponse {
  answer?: StudioAnswer;
  error?: string;
}

const MIN_QUESTION_CHARS = 10;
const AUTO_TOPIC = "";
const HISTORY_LIMIT = 6;

export function StudioForm({
  topicGroups,
  teacherName,
  recent,
}: {
  topicGroups: { group: string; topics: string[] }[];
  teacherName: string;
  recent: StudioAnswer[];
}) {
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState(AUTO_TOPIC);
  const [mode, setMode] = useState<HelpMode>("hint");
  const [busy, setBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<StudioAnswer | null>(null);
  const [history, setHistory] = useState<StudioAnswer[]>(recent);

  const ready = question.trim().length >= MIN_QUESTION_CHARS && !busy;

  const ask = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/physics/studio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: question.trim(), topic, mode }),
      });
      const out = (await res.json().catch(() => ({}))) as StudioResponse;
      if (!res.ok || !out.answer) {
        setError(out.error ?? "The studio could not answer that. Try rewording your question.");
        return;
      }
      setAnswer(out.answer);
      setHistory((h) => [out.answer as StudioAnswer, ...h].slice(0, HISTORY_LIMIT));
    } catch {
      setError("Could not reach the studio. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const requestReview = async () => {
    if (!answer || reviewBusy) return;
    setReviewBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/physics/studio", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: answer.id }),
      });
      const out = (await res.json().catch(() => ({}))) as StudioResponse;
      if (!res.ok || !out.answer) {
        setError(out.error ?? "Could not send that for review.");
        return;
      }
      setAnswer(out.answer);
      setHistory((h) => h.map((a) => (a.id === out.answer?.id ? (out.answer as StudioAnswer) : a)));
    } catch {
      setError("Could not reach the studio. Check your connection and try again.");
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
      <div className="space-y-4 lg:col-span-2">
        <Card className="space-y-4">
          <div>
            <label htmlFor="physics-question" className="mb-1.5 block text-xs font-semibold text-ink">
              Your physics question
            </label>
            <textarea
              id="physics-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={5}
              placeholder="e.g. Why does a satellite in a higher orbit move more slowly, when it has more energy?"
              className="input resize-y"
            />
          </div>

          <div>
            <label htmlFor="physics-topic" className="mb-1.5 block text-xs font-semibold text-ink">
              Topic
            </label>
            <select id="physics-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="input">
              <option value={AUTO_TOPIC}>Any — let the studio find the strand</option>
              {topicGroups.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.topics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-ink">How do you want to be helped?</legend>
            <div className="grid gap-2">
              {HELP_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={cn(
                    "rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                    mode === m ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2",
                  )}
                >
                  <span className={cn("block text-sm font-medium", mode === m ? "text-accent" : "text-ink")}>{HELP_LABEL[m]}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-ink-3">{HELP_BLURB[m]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <button type="button" onClick={ask} disabled={!ready} className="btn-primary w-full">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {busy ? "Working through it" : "Ask the studio"}
          </button>
          <p className="text-2xs leading-5 text-ink-3">
            AI-assisted, and never a substitute for your teacher. The studio never writes in {teacherName}&apos;s name; only he can, by reviewing an answer.
          </p>
        </Card>

        {history.length ? (
          <Card>
            <p className="eyebrow mb-2">Your recent questions</p>
            <ul className="space-y-2.5">
              {history.map((a) => (
                <li key={a.id} className="border-b border-line/70 pb-2.5 last:border-b-0 last:pb-0">
                  <p className="line-clamp-2 text-xs leading-5 text-ink-2">{a.question}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Chip tone="neutral">{a.topic}</Chip>
                    <ProvenanceBadge status={a.status} reviewerName={a.reviewerName} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <div className="lg:col-span-3">
        {error ? <div className="mb-4 rounded-xl border border-danger/30 bg-danger-soft/50 px-4 py-3 text-sm text-danger">{error}</div> : null}

        {answer ? (
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <TopicChip topic={answer.topic} />
              <ModeChip mode={answer.mode} />
              <ProvenanceBadge status={answer.status} reviewerName={answer.reviewerName} />
              {answer.live ? <Chip tone="info">Written live</Chip> : <Chip tone="neutral">Scripted</Chip>}
            </div>
            <p className="text-sm font-semibold leading-6 text-ink">{answer.question}</p>
            <GuidedAnswerView answer={answer.answer} />

            <div className="border-t border-line pt-4">
              {answer.status === "ai-assisted" ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-ink-3">Not sure this is right? Send it to {teacherName} to check.</p>
                  <button type="button" onClick={requestReview} disabled={reviewBusy} className="btn-soft btn-sm shrink-0">
                    {reviewBusy ? <Loader2 size={13} className="animate-spin" /> : <ShieldQuestion size={13} />}
                    Request teacher review
                  </button>
                </div>
              ) : (
                <p className="text-xs leading-5 text-ink-3">
                  {answer.status === "review-requested"
                    ? `Sent to ${teacherName}. Until it is checked it stays labelled AI-assisted.`
                    : `Checked and verified by ${answer.reviewerName ?? teacherName}.`}
                </p>
              )}
            </div>
          </Card>
        ) : busy ? (
          <Card>
            <div className="flex items-center gap-3 text-sm text-ink-3">
              <Loader2 size={16} className="animate-spin" />
              Working through the physics, not looking up an answer.
            </div>
          </Card>
        ) : (
          <EmptyState
            title="Ask a physics question"
            body="Pick how you want to be helped: a hint keeps the work yours, a worked example shows the method on different numbers, and examiner style shows where the marks actually are."
          />
        )}
      </div>
    </div>
  );
}
