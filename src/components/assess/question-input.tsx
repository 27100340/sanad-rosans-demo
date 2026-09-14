"use client";

import type { StudentQuestion } from "@/lib/domain/assessment";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const HELP: Partial<Record<StudentQuestion["type"], string>> = {
  numeric: "Give a number, e.g. 5 or 12.5",
  structured: "Show every step on its own line; method marks need the working.",
};

export function QuestionInput({ question, value, onChange }: { question: StudentQuestion; value: string; onChange: (next: string) => void }) {
  const help = HELP[question.type];

  if (question.type === "mcq") {
    return (
      <div role="radiogroup" aria-label="Options" className="flex flex-col gap-2">
        {(question.options ?? []).map((opt, i) => {
          const selected = value === String(i);
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(String(i))}
              className={cn("flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors", selected ? "border-accent bg-accent-soft/60" : "border-line bg-surface hover:bg-surface-2")}
            >
              <span className={cn("num mt-px shrink-0 text-xs font-semibold", selected ? "text-accent" : "text-ink-3")}>{LETTERS[i] ?? i + 1}</span>
              <span className="text-sm text-ink">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "numeric") {
    return (
      <div>
        <input className="input" inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Your answer" placeholder="Your answer" />
        {help ? <p className="mt-1.5 text-xs text-ink-3">{help}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <textarea
        className={cn("input resize-y leading-relaxed", question.type === "structured" ? "min-h-40" : "min-h-24")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Your answer"
        placeholder={question.type === "structured" ? "Write your working here" : "Your answer"}
      />
      {help ? <p className="mt-1.5 text-xs text-ink-3">{help}</p> : null}
    </div>
  );
}
