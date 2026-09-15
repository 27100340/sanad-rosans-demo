"use client";

/**
 * Runs one activity: fetch a round, hand it to the board that knows how to
 * play it, tally the taps, then record the session and show the coach's line.
 *
 * The round is fetched rather than rendered on the server because it may be
 * generated, and because "play again" has to be able to ask for a different
 * one without a navigation.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCw } from "lucide-react";
import { Chip, LinkButton } from "@/components/ui/primitives";
import { PRACTICE_NOTE, resultLabel, roundSignature, starsFor, type PlayRound } from "@/lib/domain/play";
import { MatchBoard } from "./match-board";
import { SortBoard } from "./sort-board";
import { SequenceBoard } from "./sequence-board";
import { CountBoard, PatternBoard } from "./choice-board";
import { Stars } from "./shared";

export interface RunnerActivity {
  id: string;
  title: string;
  script: "en" | "ur";
}

interface FinishResult {
  message: string;
  live: boolean;
  stars: 1 | 2 | 3;
}

type Phase = "loading" | "playing" | "scoring" | "done" | "error";

export function PlayRunner({ activity, studentId, playAgainHref }: { activity: RunnerActivity; studentId: string; playAgainHref: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [round, setRound] = useState<PlayRound | null>(null);
  const [roundLive, setRoundLive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [finish, setFinish] = useState<FinishResult | null>(null);

  const tally = useRef({ correct: 0, total: 0 });
  const roundRef = useRef<PlayRound | null>(null);
  const liveRef = useRef(false);

  const load = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setFinish(null);
    tally.current = { correct: 0, total: 0 };
    try {
      const res = await fetch("/api/play/round", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activityId: activity.id, studentId }),
      });
      const data = (await res.json()) as { round?: PlayRound; live?: boolean; error?: string };
      if (!res.ok || !data.round) {
        setError(data.error ?? "That activity could not be opened.");
        setPhase("error");
        return;
      }
      roundRef.current = data.round;
      liveRef.current = data.live === true;
      setRound(data.round);
      setRoundLive(data.live === true);
      setAttempt((n) => n + 1);
      setPhase("playing");
    } catch {
      setError("Something went wrong opening this activity.");
      setPhase("error");
    }
  }, [activity.id, studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onScore = useCallback((correct: boolean) => {
    tally.current.total += 1;
    if (correct) tally.current.correct += 1;
  }, []);

  const onFinish = useCallback(async () => {
    const { correct, total } = tally.current;
    setPhase("scoring");
    const local: FinishResult = { message: "", live: false, stars: starsFor(correct, total) };
    try {
      const res = await fetch("/api/play/finish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activityId: activity.id,
          studentId,
          correct,
          total,
          roundLive: liveRef.current,
          seen: roundRef.current ? roundSignature(roundRef.current) : [],
        }),
      });
      const data = (await res.json()) as Partial<FinishResult> & { error?: string };
      setFinish(data.message ? { message: data.message, live: data.live === true, stars: data.stars ?? local.stars } : { ...local, message: "You finished the whole round. Come back to it tomorrow." });
    } catch {
      setFinish({ ...local, message: "You finished the whole round. Come back to it tomorrow." });
    }
    setPhase("done");
  }, [activity.id, studentId]);

  // Stable identity: the choice board keys its auto-advance timer on this.
  const handleFinish = useCallback(() => {
    void onFinish();
  }, [onFinish]);

  if (phase === "error") {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-ink">{error}</p>
        <div className="mt-4 flex justify-center">
          <LinkButton href={playAgainHref} variant="soft">
            Back to activities
          </LinkButton>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="card space-y-3 p-6">
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-5/6" />
      </div>
    );
  }

  if (phase === "done" && finish) {
    return (
      <div className="card animate-fade-up space-y-5 p-6 text-center sm:p-8">
        <div className="flex justify-center">
          <Stars count={finish.stars} />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-ink">{resultLabel(finish.stars)}</p>
          <p className="mx-auto max-w-prose text-sm leading-relaxed text-ink-2">{finish.message}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Chip tone={finish.live ? "ok" : "neutral"} className="cursor-default">
            {finish.live ? "AI encouragement" : "Scripted encouragement"}
          </Chip>
          <p className="text-2xs text-ink-3">{PRACTICE_NOTE}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" className="btn-primary" onClick={() => void load()}>
            <RotateCw className="h-4 w-4" />
            Play again
          </button>
          <LinkButton href={playAgainHref} variant="soft">
            Choose another
          </LinkButton>
        </div>
      </div>
    );
  }

  if (!round) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={roundLive ? "accent" : "neutral"} className="cursor-default">
          {roundLive ? "Fresh items" : "Practice set"}
        </Chip>
        <span className="text-2xs text-ink-3">{roundLive ? "These items were written for this turn." : "These items come from the school's own practice set."}</span>
      </div>
      <div className="card p-5 sm:p-6">
        <Board key={attempt} round={round} script={activity.script} onScore={onScore} onFinish={handleFinish} />
        {phase === "scoring" ? <p className="mt-4 text-center text-xs text-ink-3">Saving your practice…</p> : null}
      </div>
    </div>
  );
}

function Board({ round, script, onScore, onFinish }: { round: PlayRound; script: "en" | "ur"; onScore: (correct: boolean) => void; onFinish: () => void }) {
  switch (round.kind) {
    case "match":
      return <MatchBoard round={round} script={script} onScore={onScore} onFinish={onFinish} />;
    case "sort":
      return <SortBoard round={round} script={script} onScore={onScore} onFinish={onFinish} />;
    case "sequence":
      return <SequenceBoard round={round} script={script} onScore={onScore} onFinish={onFinish} />;
    case "count":
      return <CountBoard round={round} script={script} onScore={onScore} onFinish={onFinish} />;
    case "pattern":
      return <PatternBoard round={round} script={script} onScore={onScore} onFinish={onFinish} />;
  }
}
