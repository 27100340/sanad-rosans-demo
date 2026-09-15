"use client";

/**
 * Put things in order: counting in fives, or the words of an Urdu sentence.
 *
 * Tap the tokens in order. A wrong tap does not advance the line — the child
 * tries again for the same position — but that position no longer scores.
 */
import { useEffect, useMemo, useState } from "react";
import type { PlayRound } from "@/lib/domain/play";
import { BoardPrompt, ProgressDots, TapTile, Token, shuffled, type BoardProps, type TapState } from "./shared";
import { cn } from "@/lib/utils";

type Round = Extract<PlayRound, { kind: "sequence" }>;

const WRONG_FLASH_MS = 650;

export function SequenceBoard({ round, script, onScore, onFinish }: BoardProps<Round>) {
  const pool = useMemo(() => shuffled(round.steps), [round]);
  const [position, setPosition] = useState(0);
  const [missedHere, setMissedHere] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), WRONG_FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  const placed = round.steps.slice(0, position);

  const tap = (step: string) => {
    if (position >= round.steps.length) return;
    if (step !== round.steps[position]) {
      setFlash(step);
      setMissedHere(true);
      return;
    }
    const firstTry = !missedHere;
    setResults((prev) => [...prev, firstTry]);
    setMissedHere(false);
    setPosition(position + 1);
    onScore(firstTry);
    if (position + 1 === round.steps.length) onFinish();
  };

  const stateOf = (step: string): TapState => (flash === step ? "wrong" : placed.includes(step) ? "done" : "idle");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BoardPrompt text={round.prompt} script={script} />
        <ProgressDots total={round.steps.length} results={results} />
      </div>

      <div
        dir={script === "ur" ? "rtl" : undefined}
        className="flex min-h-[4rem] flex-wrap items-center gap-2 rounded-2xl border border-dashed border-line-strong/70 bg-accent-soft/40 px-3 py-3"
      >
        {placed.length === 0 ? (
          <p className="text-sm text-ink-3" dir="ltr">
            Tap them one at a time, in order.
          </p>
        ) : (
          placed.map((step, i) => (
            <span key={step} className={cn("flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm font-medium text-ink shadow-sm", script === "ur" && "urdu text-base")}>
              <span className="num text-2xs text-ink-3">{i + 1}</span>
              <Token label={step} size="sm" />
            </span>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {pool.map((step) => (
          <TapTile key={step} script={script} state={stateOf(step)} onClick={() => tap(step)}>
            <Token label={step} />
          </TapTile>
        ))}
      </div>
    </div>
  );
}
