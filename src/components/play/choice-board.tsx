"use client";

/**
 * One question at a time with a small set of answers. Two activities share it,
 * because the interaction is identical and only the stimulus differs:
 *
 *   CountBoard    — a tray of pictures to count, or a number fact to recall.
 *   PatternBoard  — a row of terms with the last one missing.
 *
 * The child taps, sees immediately whether it was right, and the board moves on.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { PlayRound } from "@/lib/domain/play";
import { BoardPrompt, GlyphTray, ProgressDots, TapTile, Token, Verdict, shuffled, type BoardHandlers, type BoardProps, type TapState } from "./shared";

type CountRound = Extract<PlayRound, { kind: "count" }>;
type PatternRound = Extract<PlayRound, { kind: "pattern" }>;

const ADVANCE_MS = 900;

interface Question {
  key: string;
  stimulus: ReactNode;
  ask: string;
  choices: string[];
  answer: string;
}

function ChoiceBoard({ prompt, questions, script, onScore, onFinish }: BoardHandlers & { prompt: string; questions: Question[]; script: "en" | "ur" }) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  const question = questions[index];

  useEffect(() => {
    if (chosen === null) return;
    const timer = setTimeout(() => {
      setChosen(null);
      if (index + 1 < questions.length) setIndex(index + 1);
      else onFinish();
    }, ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [chosen, index, questions.length, onFinish]);

  const pick = (choice: string) => {
    if (chosen !== null) return;
    const correct = choice === question.answer;
    setChosen(choice);
    setResults((prev) => [...prev, correct]);
    onScore(correct);
  };

  const stateOf = (choice: string): TapState => {
    if (chosen === null) return "idle";
    if (choice === question.answer) return "right";
    return choice === chosen ? "wrong" : "done";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BoardPrompt text={prompt} script={script} />
        <ProgressDots total={questions.length} results={results} />
      </div>

      <div key={question.key} className="animate-fade-in space-y-4">
        {question.stimulus}
        <p className="text-center text-sm font-medium text-ink-2">{question.ask}</p>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {question.choices.map((choice) => (
            <TapTile key={choice} script={script} state={stateOf(choice)} onClick={() => pick(choice)} disabled={chosen !== null}>
              <Token label={choice} size="lg" />
              {chosen !== null && choice === chosen ? <Verdict correct={choice === question.answer} /> : null}
            </TapTile>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CountBoard({ round, script, onScore, onFinish }: BoardProps<CountRound>) {
  const questions = useMemo<Question[]>(
    () =>
      round.questions.map((q, i) => ({
        key: `${i}-${q.prompt}`,
        ask: q.glyph ? q.prompt : "Tap the answer.",
        stimulus: q.glyph ? (
          <GlyphTray glyph={q.glyph} count={q.answer} />
        ) : (
          <div className="num rounded-2xl bg-accent-soft/60 px-4 py-8 text-center text-3xl font-semibold tracking-tight text-accent sm:text-4xl">{q.prompt}</div>
        ),
        choices: shuffled(q.choices.map(String)),
        answer: String(q.answer),
      })),
    [round],
  );
  return <ChoiceBoard prompt={round.prompt} questions={questions} script={script} onScore={onScore} onFinish={onFinish} />;
}

export function PatternBoard({ round, script, onScore, onFinish }: BoardProps<PatternRound>) {
  const questions = useMemo<Question[]>(
    () =>
      round.puzzles.map((puzzle, i) => ({
        key: `${i}-${puzzle.answer}`,
        ask: "Which one comes next?",
        stimulus: (
          <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-2xl bg-accent-soft/60 px-3 py-6 sm:gap-4 sm:py-8">
            {puzzle.shown.map((token, n) => (
              <span key={`${n}-${token}`} className="grid h-12 w-12 place-items-center rounded-xl bg-surface text-accent sm:h-14 sm:w-14">
                <Token label={token} size="lg" />
              </span>
            ))}
            <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-dashed border-accent/50 text-xl font-semibold text-accent/70 sm:h-14 sm:w-14">?</span>
          </div>
        ),
        choices: shuffled(puzzle.choices),
        answer: puzzle.answer,
      })),
    [round],
  );
  return <ChoiceBoard prompt={round.prompt} questions={questions} script={script} onScore={onScore} onFinish={onFinish} />;
}
