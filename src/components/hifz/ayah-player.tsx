"use client";

import { useCallback, useRef, useState } from "react";
import { ListMusic, Pause, Play, Square } from "lucide-react";
import type { AyahSegment } from "@/lib/quran";
import { cn } from "@/lib/utils";
import { AyahMarker } from "./word-diff";

/** One <audio> per ayah (reference reciter) with a sequential "Play all". */
export function AyahPlayer({ segments }: { segments: AyahSegment[] }) {
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const [playing, setPlaying] = useState<number | null>(null);
  const [queueAll, setQueueAll] = useState(false);
  const [failed, setFailed] = useState(false);

  const stopAll = useCallback(() => {
    audioRefs.current.forEach((a) => {
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
    });
    setPlaying(null);
    setQueueAll(false);
  }, []);

  const playIndex = useCallback(
    (i: number, chain: boolean) => {
      audioRefs.current.forEach((a, j) => j !== i && a?.pause());
      const el = audioRefs.current[i];
      if (!el) return;
      setQueueAll(chain);
      setPlaying(i);
      el.currentTime = 0;
      el.play().catch(() => {
        setFailed(true);
        setPlaying(null);
        setQueueAll(false);
      });
    },
    [],
  );

  const onEnded = (i: number) => {
    if (queueAll && i + 1 < segments.length) playIndex(i + 1, true);
    else {
      setPlaying(null);
      setQueueAll(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {playing !== null ? (
          <button type="button" onClick={stopAll} className="btn-outline btn-sm">
            <Square size={13} /> Stop
          </button>
        ) : (
          <button type="button" onClick={() => playIndex(0, true)} className="btn-soft btn-sm">
            <ListMusic size={13} /> Play all
          </button>
        )}
        {failed ? <span className="text-xs text-warn">Audio could not load; check the network and try again.</span> : null}
      </div>
      <ol className="space-y-1">
        {segments.map((seg, i) => {
          const active = playing === i;
          return (
            <li key={seg.ayah} className={cn("flex items-start gap-3 rounded-xl px-3 py-2 transition-colors", active && "bg-accent-soft/60")}>
              <button
                type="button"
                onClick={() => (active ? stopAll() : playIndex(i, false))}
                className={cn("tile mt-2 h-8 w-8 shrink-0 rounded-lg", active ? "bg-accent text-white" : "bg-surface-2 text-ink-2 hover:bg-accent-soft hover:text-accent")}
                aria-label={active ? `Pause ayah ${seg.ayah}` : `Play ayah ${seg.ayah}`}
              >
                {active ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <p className="quran min-w-0 flex-1">
                {seg.words.join(" ")} <AyahMarker n={seg.ayah} />
              </p>
              <audio
                ref={(el) => {
                  audioRefs.current[i] = el;
                }}
                src={seg.audioUrl}
                preload="none"
                onEnded={() => onEnded(i)}
                onError={() => setFailed(true)}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
