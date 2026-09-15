"use client";

/**
 * Pair one thing with another: a letter with a word, a number with the partner
 * that completes it, a surah with what it reminds us.
 *
 * Tap the thing, then tap its partner — no HTML5 drag, which does not fire on
 * a tablet. A pair only scores when the child's first partner choice is right.
 */
import { useEffect, useMemo, useState } from "react";
import type { PlayRound } from "@/lib/domain/play";
import { BoardPrompt, ProgressDots, TapTile, Token, Verdict, shuffled, type BoardProps, type TapState } from "./shared";

type Round = Extract<PlayRound, { kind: "match" }>;

const WRONG_FLASH_MS = 650;

export function MatchBoard({ round, script, onScore, onFinish }: BoardProps<Round>) {
  const lefts = useMemo(() => shuffled(round.pairs), [round]);
  const rights = useMemo(() => shuffled(round.pairs.map((p) => p.right)), [round]);

  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const [missed, setMissed] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), WRONG_FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  const solvedRights = new Set(Object.keys(solved).map((left) => round.pairs.find((p) => p.left === left)?.right));

  const choose = (right: string) => {
    if (!picked || solvedRights.has(right)) return;
    const answer = round.pairs.find((p) => p.left === picked)?.right;
    if (answer !== right) {
      setFlash(right);
      setMissed((prev) => (prev.includes(picked) ? prev : [...prev, picked]));
      return;
    }
    const firstTry = !missed.includes(picked);
    setSolved((prev) => ({ ...prev, [picked]: firstTry }));
    setResults((prev) => [...prev, firstTry]);
    setPicked(null);
    onScore(firstTry);
    if (Object.keys(solved).length + 1 === round.pairs.length) onFinish();
  };

  const leftState = (left: string): TapState => (left in solved ? (solved[left] ? "right" : "wrong") : picked === left ? "picked" : "idle");
  const rightState = (right: string): TapState => (flash === right ? "wrong" : solvedRights.has(right) ? "done" : "idle");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BoardPrompt text={round.prompt} script={script} />
        <ProgressDots total={round.pairs.length} results={results} />
      </div>
      <p className="text-xs text-ink-3">{picked ? "Now tap its partner on the right." : "Tap one on the left to begin."}</p>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <div className="space-y-2.5">
          {lefts.map((pair) => (
            <TapTile key={pair.left} script={script} state={leftState(pair.left)} onClick={() => setPicked(pair.left)} disabled={pair.left in solved}>
              <Token label={pair.left} size="lg" />
              {pair.left in solved ? <Verdict correct={solved[pair.left]} /> : null}
            </TapTile>
          ))}
        </div>
        <div className="space-y-2.5">
          {rights.map((right) => (
            <TapTile key={right} script={script} state={rightState(right)} onClick={() => choose(right)} disabled={!picked && !solvedRights.has(right)}>
              <Token label={right} />
            </TapTile>
          ))}
        </div>
      </div>
    </div>
  );
}
