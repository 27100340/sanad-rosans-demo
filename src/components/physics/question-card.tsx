"use client";

import { useState } from "react";
import { Card, Chip } from "@/components/ui/primitives";
import { InkPad } from "@/components/assess/ink-pad";
import { cn } from "@/lib/utils";
import type { AttemptQuestion, StudentQuestion, ThinkingLevel } from "@/lib/domain/physics";
import { LEVEL_LABEL, pct, scoreTone } from "@/lib/domain/physics";

export interface SchemeRow {
  id: string;
  ans?: number;
  scheme: string[];
}

const LEVEL_TONE: Record<ThinkingLevel, "neutral" | "gold"> = { LOT: "neutral", HOT: "gold" };
const OPTION_LETTERS = "ABCD";

const METHOD_LABEL: Record<AttemptQuestion["method"], string> = {
  auto: "Auto-marked",
  "ai-marked": "AI-marked",
  "teacher-approved": "Teacher-marked",
};

/**
 * One question, in every place a question is shown: the teacher's Exam Lab and
 * the student's runner. Both need the same tag row, the same answer inputs and
 * the same mark-scheme reveal, so there is one component rather than two that
 * drift apart.
 */
export function QuestionCard({
  index,
  question,
  scheme,
  showScheme,
  marked,
  response,
  onRespond,
  disabled = false,
}: {
  index: number;
  question: StudentQuestion;
  scheme?: SchemeRow;
  showScheme: boolean;
  marked?: AttemptQuestion;
  response: string;
  onRespond: (value: string) => void;
  disabled?: boolean;
}) {
  const revealed = showScheme && scheme;

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone="accent">Q{index + 1}</Chip>
        <Chip tone="neutral">{question.t}</Chip>
        <Chip tone={LEVEL_TONE[question.lvl]}>
          {question.lvl} · {LEVEL_LABEL[question.lvl]}
        </Chip>
        <Chip tone="neutral">{question.cmd}</Chip>
        <Chip tone="neutral">
          <span className="num">{question.marks}</span> {question.marks === 1 ? "mark" : "marks"}
        </Chip>
        {question.source === "ai" ? <Chip tone="warn">AI-written</Chip> : null}
        {question.source === "pastpaper" ? <Chip tone="info">Past paper</Chip> : null}
        {question.needsFigure ? <Chip tone="danger">Figure missing</Chip> : null}
        {marked ? (
          <Chip tone={scoreTone(pct(marked.earned ?? 0, marked.marks))}>
            <span className="num">
              {marked.earned ?? 0}/{marked.marks}
            </span>
          </Chip>
        ) : null}
      </div>

      <p className="text-sm leading-6 text-ink">{question.stem}</p>

      {question.needsFigure ? (
        <p className="rounded-lg border border-dashed border-line-strong/70 px-3 py-2 text-2xs leading-5 text-ink-3">
          This question refers to a diagram from the original paper. The portal holds the text of Cambridge past papers but not their figures, so read this one
          as a prompt for discussion rather than as a question to answer cold.
        </p>
      ) : null}

      {question.type === "mcq" && question.opts ? (
        <div className="grid gap-1.5">
          {question.opts.map((option, optionIndex) => (
            <label
              key={optionIndex}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors",
                disabled ? "cursor-default" : "cursor-pointer",
                response === String(optionIndex) ? "border-accent bg-accent-soft" : "border-line",
                !disabled && response !== String(optionIndex) ? "hover:bg-surface-2" : "",
                revealed && scheme?.ans === optionIndex ? "border-ok bg-ok-soft/60" : "",
              )}
            >
              <input
                type="radio"
                name={question.id}
                checked={response === String(optionIndex)}
                onChange={() => onRespond(String(optionIndex))}
                disabled={disabled}
                className="mt-1 h-3.5 w-3.5 accent-accent"
              />
              <span className="num shrink-0 font-semibold text-ink-3">{OPTION_LETTERS[optionIndex] ?? optionIndex + 1}</span>
              <span className="min-w-0 text-ink-2">{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <WrittenAnswer
          value={response}
          onRespond={onRespond}
          disabled={disabled}
          questionText={question.stem}
        />
      )}

      {revealed ? (
        <div className="rounded-xl border border-line bg-surface-2/70 p-3.5">
          <p className="eyebrow mb-1.5">Mark scheme</p>
          <ul className="space-y-1">
            {scheme.scheme.map((line, i) => {
              const point = marked?.points[i];
              return (
                <li key={i} className="flex items-start gap-2 text-xs leading-5">
                  <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", point ? (point.earned ? "bg-ok" : "bg-danger") : "bg-ink-3")} />
                  <span className="text-ink-2">{line}</span>
                </li>
              );
            })}
          </ul>
          {question.type === "mcq" && scheme.ans !== undefined ? (
            <p className="num mt-2 border-t border-line pt-2 text-2xs text-ink-3">Correct option: {OPTION_LETTERS[scheme.ans] ?? scheme.ans}</p>
          ) : null}
        </div>
      ) : null}

      {marked?.feedback ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <p className="min-w-0 flex-1 text-xs leading-5 text-ink-2">{marked.feedback}</p>
          <Chip tone="neutral">{METHOD_LABEL[marked.method]}</Chip>
        </div>
      ) : null}
    </Card>
  );
}

/**
 * A structured answer can be typed or handwritten. Handwriting is read back to
 * text so the existing marker can score it, and the transcription lands in the
 * same editable box — the student sees exactly what will be marked and can fix
 * a misread word before submitting. Nothing is marked from the image itself.
 */
function WrittenAnswer({
  value,
  onRespond,
  disabled,
  questionText,
}: {
  value: string;
  onRespond: (value: string) => void;
  disabled: boolean;
  questionText: string;
}) {
  const [mode, setMode] = useState<"type" | "write">("type");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function read(pngDataUrl: string) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/handwriting", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: pngDataUrl, question: questionText }),
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !json.text) {
        setNotice(json.error ?? "That could not be read. Type the answer instead.");
        return;
      }
      onRespond(value ? `${value}\n${json.text}` : json.text);
      setMode("type");
      setNotice("Read from your handwriting. Check it and correct anything misread before you submit.");
    } catch {
      setNotice("The reader did not respond. Type the answer instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setMode("type")}
          aria-pressed={mode === "type"}
          className={cn("btn-ghost btn-sm", mode === "type" && "!border-accent !text-accent")}
        >
          Type
        </button>
        <button
          type="button"
          onClick={() => setMode("write")}
          aria-pressed={mode === "write"}
          disabled={disabled}
          className={cn("btn-ghost btn-sm", mode === "write" && "!border-accent !text-accent")}
        >
          Write by hand
        </button>
      </div>

      {mode === "type" ? (
        <textarea
          value={value}
          onChange={(e) => onRespond(e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder="Working and final answer, one step per line."
          className="input resize-y"
        />
      ) : (
        <InkPad onSave={read} busy={busy} />
      )}

      {notice ? <p className="text-2xs text-ink-3">{notice}</p> : null}
    </div>
  );
}
