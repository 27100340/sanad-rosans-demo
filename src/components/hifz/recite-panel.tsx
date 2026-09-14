"use client";

import { useState } from "react";
import { ChevronDown, Mic, Square, Wand2 } from "lucide-react";
import type { CheckResponse } from "@/app/api/hifz/check/route";
import type { SimulatedVariant } from "@/lib/ai/recitation";
import type { HifzUnitKind } from "@/lib/domain/types";
import type { AyahSegment } from "@/lib/quran";
import { Chip, SectionTitle } from "@/components/ui/primitives";
import { KIND_LABEL, KIND_TONE } from "./derive";
import { AyahPlayer } from "./ayah-player";
import { ResultView } from "./result-view";
import { useRecorder, type RecorderStopPayload } from "./use-recorder";

type Phase = "idle" | "recording" | "checking" | "result";

interface Props {
  unitId: string;
  kind: HifzUnitKind;
  surah: number;
  fromAyah: number;
  toAyah: number;
  segments: AyahSegment[];
  today: string;
}

const CHECK_URL = "/api/hifz/check";

/** Listen, recite back, see the word-level result. */
export function RecitePanel(props: Props) {
  const { unitId, kind, surah, fromAyah, toAyah, segments, today } = props;
  const [phase, setPhase] = useState<Phase>("idle");
  const [data, setData] = useState<CheckResponse | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  async function check(body: Record<string, unknown>) {
    setPhase("checking");
    setFailure(null);
    try {
      const res = await fetch(CHECK_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ surah, from: fromAyah, to: toAyah, unitKind: kind, unitId, ...body }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as CheckResponse);
      setPhase("result");
    } catch {
      setFailure("The checker did not respond. Try again or use Simulate attempt.");
      setPhase("idle");
    }
  }

  const recorder = useRecorder((p: RecorderStopPayload) => {
    void check(p.audio ? { mode: "audio", audioBase64: p.audio.base64, mimeType: p.audio.mimeType, browserTranscript: p.browserTranscript } : { mode: "browser", browserTranscript: p.browserTranscript });
  });

  function simulate(variant: SimulatedVariant) {
    setMenuOpen(false);
    void check({ mode: "simulated", variant });
  }

  async function startRecording() {
    setData(null);
    await recorder.start();
  }

  const busy = phase === "checking";
  const recording = recorder.recording;

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <SectionTitle title="Listen" hint="Reference recitation, one ayah at a time" action={<Chip tone={KIND_TONE[kind]}>{KIND_LABEL[kind]}</Chip>} />
        <AyahPlayer segments={segments} />
      </div>

      <div className="card p-5">
        <SectionTitle title="Recite back" hint={kind === "sabaq" ? "Sabaq passes at 100%" : "Revision passes at 95%"} />
        <div className="flex flex-wrap items-center gap-2">
          {recording ? (
            <button type="button" onClick={() => { recorder.stop(); setPhase("checking"); }} className="btn-danger">
              <Square size={14} /> Stop and check
            </button>
          ) : (
            <button type="button" onClick={startRecording} disabled={busy} className="btn-primary">
              <Mic size={14} /> Record
            </button>
          )}
          <div className="relative">
            <div className="inline-flex overflow-hidden rounded-xl border border-line-strong bg-surface">
              <button type="button" onClick={() => simulate("perfect")} disabled={busy || recording} className="btn-ghost rounded-none">
                <Wand2 size={14} /> Simulate attempt
              </button>
              <button type="button" onClick={() => setMenuOpen((o) => !o)} disabled={busy || recording} className="btn-ghost rounded-none border-l border-line px-2" aria-label="Simulation options" aria-expanded={menuOpen}>
                <ChevronDown size={14} />
              </button>
            </div>
            {menuOpen ? (
              <div className="absolute left-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
                <button type="button" onClick={() => simulate("perfect")} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2">Perfect</button>
                <button type="button" onClick={() => simulate("one-miss")} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2">One slip (omitted)</button>
                <button type="button" onClick={() => simulate("one-sub")} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2">One slip (substituted)</button>
              </div>
            ) : null}
          </div>
          {busy ? <span className="text-xs text-ink-3">Checking…</span> : null}
        </div>
        <p className="mt-2 text-2xs text-ink-3">
          {recorder.support.speech ? "Browser speech recognition (ar-SA) runs alongside the recording." : "Browser speech recognition is not available here; the clip is checked on the server."}
        </p>
        {recording ? (
          <div className="mt-4 rounded-xl border border-danger/30 bg-danger-soft/40 px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-medium text-danger">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-danger" /> Recording
            </p>
            {recorder.interim ? <p className="quran mt-2 text-[1.4rem] text-ink-2">{recorder.interim}</p> : null}
          </div>
        ) : null}
        {recorder.error ? <p className="mt-3 text-xs text-warn">{recorder.error}</p> : null}
        {failure ? <p className="mt-3 text-xs text-warn">{failure}</p> : null}
      </div>

      {phase === "result" && data ? (
        <div className="card p-5">
          <SectionTitle title="Result" hint="Word by word against the canonical text" />
          <ResultView data={data} segments={segments} today={today} />
        </div>
      ) : null}
    </div>
  );
}
