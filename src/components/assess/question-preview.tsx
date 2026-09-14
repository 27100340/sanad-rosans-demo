"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Chip, SectionTitle } from "@/components/ui/primitives";
import type { QuestionType } from "@/lib/domain/assessment";
import { QUESTION_TYPE } from "./labels";

/** One question as the teacher sees it. `options` arrive already lettered ("A. 3x + 4"). */
export interface PreviewQuestion {
  id: string;
  number: number;
  type: QuestionType;
  topicCode: string;
  marks: number;
  stem: string;
  options?: string[];
  correctAnswer: string;
  markScheme: string[];
}

function AnswerKey({ q }: { q: PreviewQuestion }) {
  return (
    <div className="mt-3 rounded-xl bg-surface-2 p-3">
      <p className="text-xs text-ink-2">
        <span className="font-medium text-ink">Answer</span> <span className="text-accent">{q.correctAnswer}</span>
      </p>
      {q.markScheme.length ? (
        <ol className="mt-2 space-y-1">
          {q.markScheme.map((line, i) => (
            <li key={i} className="flex gap-2 text-xs text-ink-2">
              <span className="num w-4 shrink-0 text-ink-3">{i + 1}.</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function QuestionItem({ q, showAnswers }: { q: PreviewQuestion; showAnswers: boolean }) {
  return (
    <div className="flex gap-3 p-5">
      <span className="num w-6 shrink-0 text-sm font-medium text-ink-3">{q.number}.</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="neutral">{QUESTION_TYPE[q.type]}</Chip>
          <span className="num text-2xs text-ink-3">{q.topicCode}</span>
          <span className="num text-2xs text-ink-3">
            {q.marks} {q.marks === 1 ? "mark" : "marks"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink">{q.stem}</p>
        {q.options?.length ? (
          <ol className="mt-2 space-y-1">
            {q.options.map((opt) => (
              <li key={opt} className="text-sm text-ink-2">
                {opt}
              </li>
            ))}
          </ol>
        ) : null}
        {showAnswers ? <AnswerKey q={q} /> : null}
      </div>
    </div>
  );
}

export function QuestionPreview({ questions }: { questions: PreviewQuestion[] }) {
  const [showAnswers, setShowAnswers] = useState(false);
  return (
    <section>
      <SectionTitle
        title="Questions"
        hint={`${questions.length} in order. Students never see answers before their result is published.`}
        action={
          <button type="button" className="btn-outline btn-sm" onClick={() => setShowAnswers((v) => !v)}>
            {showAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAnswers ? "Hide answers" : "Show answers"}
          </button>
        }
      />
      <div className="card divide-y divide-line/70">
        {questions.map((q) => (
          <QuestionItem key={q.id} q={q} showAnswers={showAnswers} />
        ))}
      </div>
    </section>
  );
}
