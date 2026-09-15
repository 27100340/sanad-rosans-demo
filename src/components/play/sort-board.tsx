"use client";

/**
 * Sort things into baskets: big and small, shapes by their sides, words by
 * their class, fractions against a half.
 *
 * Pick an item, then tap a basket. A wrong basket still files the item where
 * it belongs — a child should leave knowing the right answer — but the item
 * scores nothing.
 */
import { useMemo, useState } from "react";
import type { PlayRound } from "@/lib/domain/play";
import { BoardPrompt, ProgressDots, TapTile, Token, Verdict, shuffled, type BoardProps } from "./shared";
import { cn } from "@/lib/utils";

type Round = Extract<PlayRound, { kind: "sort" }>;

interface Placed {
  label: string;
  bin: string;
  correct: boolean;
}

export function SortBoard({ round, script, onScore, onFinish }: BoardProps<Round>) {
  const tray = useMemo(() => shuffled(round.items), [round]);
  const [picked, setPicked] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed[]>([]);

  const placedLabels = new Set(placed.map((p) => p.label));

  const drop = (bin: string) => {
    if (!picked) return;
    const item = round.items.find((i) => i.label === picked);
    if (!item || placedLabels.has(item.label)) return;
    const correct = item.bin === bin;
    setPlaced((prev) => [...prev, { label: item.label, bin: item.bin, correct }]);
    setPicked(null);
    onScore(correct);
    if (placed.length + 1 === round.items.length) onFinish();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BoardPrompt text={round.prompt} script={script} />
        <ProgressDots total={round.items.length} results={placed.map((p) => p.correct)} />
      </div>

      <div className="min-h-[4.5rem] rounded-2xl border border-dashed border-line-strong/70 bg-surface-2/60 p-3">
        <p className="mb-2 text-xs text-ink-3">{picked ? "Now tap the basket it belongs in." : "Tap something to pick it up."}</p>
        <div className="flex flex-wrap gap-2">
          {tray
            .filter((item) => !placedLabels.has(item.label))
            .map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setPicked(item.label)}
                className={cn(
                  "min-h-[2.75rem] rounded-xl border px-3.5 py-2 text-sm font-medium transition-[background-color,border-color,transform] duration-200 active:scale-[0.97]",
                  picked === item.label ? "scale-[1.03] border-accent bg-accent-soft text-accent shadow-ring" : "border-line bg-surface text-ink hover:border-accent",
                )}
              >
                <Token label={item.label} />
              </button>
            ))}
          {placed.length === round.items.length ? <p className="py-2 text-sm text-ink-3">Everything is sorted.</p> : null}
        </div>
      </div>

      <div className={cn("grid gap-2.5 sm:gap-3", round.bins.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3")}>
        {round.bins.map((bin) => (
          <div key={bin} className="space-y-2">
            <TapTile script={script} state={picked ? "picked" : "idle"} onClick={() => drop(bin)} disabled={!picked} className="font-semibold">
              {bin}
            </TapTile>
            <div className="space-y-1.5">
              {placed
                .filter((p) => p.bin === bin)
                .map((p) => (
                  <div
                    key={p.label}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm",
                      p.correct ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger",
                    )}
                  >
                    <Token label={p.label} size="sm" />
                    <Verdict correct={p.correct} />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
