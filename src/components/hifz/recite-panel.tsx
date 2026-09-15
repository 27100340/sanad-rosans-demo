"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, FlaskConical, Mic, RotateCcw, Send, Square, Wand2 } from "lucide-react";
import type { CheckResponse } from "@/app/api/hifz/check/route";
import type { SimulatedVariant } from "@/lib/ai/recitation";
import type { HifzUnitKind } from "@/lib/domain/types";
import type { AyahSegment } from "@/lib/quran";
import { Chip, SectionTitle } from "@/components/ui/primitives";
import { KIND_LABEL, KIND_TONE } from "./derive";
import { AyahPlayer } from "./ayah-player";
import { ResultView } from "./result-view";
import { fmtClipLength } from "./submission-audio";
import { useRecorder, type RecorderStopPayload } from "./use-recorder";

type Phase = "idle" | "ready" | "sending" | "sent" | "checking" | "result";

interface Props {
  unitId: string;
  kind: HifzUnitKind;
  surah: number;
  fromAyah: number;
  toAyah: number;
  segments: AyahSegment[];
  today: string;
}

/** A finished recording held in the browser until the student decides what to do with it. */
interface Clip {
  base64: string;
  mimeType: string;
  seconds: number;
  browserTranscript: string;
}

const CHECK_URL = "/api/hifz/check";
const SUBMIT_URL = "/api/hifz/submission";
const SUBMISSIONS_HREF = "/portal/hifz/submissions";

/** Listen, recite back, send it to the ustadh to be marked. */
export function RecitePanel(props: Props) {
  const { unitId, kind, surah, fromAyah, toAyah, segments, today } = props;
  const [phase, setPhase] = useState<Phase>("idle");
  const [clip, setClip] = useState<Clip | null>(null);
  const [data, setData] = useState<CheckResponse | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const startedAtRef = useRef(0);

  async function check(body: Record<string, unknown>) {
    setPhase("checking");
    setFailure(null);
    try {
      const res = await fetch(CHECK_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ surah, from: fromAyah, to: toAyah, unitKind: kind, unitId, ...body }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json as CheckResponse);
      setPhase("result");
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "The checker did not respond. No assessment was made.");
      setPhase(clip ? "ready" : "idle");
    }
  }

  const recorder = useRecorder((p: RecorderStopPayload) => {
    // A failed recording used to fall through to the browser's own speech
    // recognition, which scored a correct recitation of Al-Kafirun at 11% and
    // wrote "weak" to the child's record. Chrome's ar-SA recogniser is not an
    // assessment of memorisation, so a missing recording now fails plainly
    // instead of being quietly graded by something else.
    if (!p.audio) {
      setFailure("The microphone produced no audio, so nothing was recorded. Check the microphone and record again.");
      setPhase("idle");
      return;
    }
    const seconds = startedAtRef.current ? (Date.now() - startedAtRef.current) / 1000 : 0;
    setClip({ base64: p.audio.base64, mimeType: p.audio.mimeType, seconds, browserTranscript: p.browserTranscript });
    setPhase("ready");
  });

  function simulate(variant: SimulatedVariant) {
    setMenuOpen(false);
    void check({ mode: "simulated", variant });
  }

  async function startRecording() {
    setData(null);
    setClip(null);
    setFailure(null);
    setPhase("idle");
    startedAtRef.current = Date.now();
    await recorder.start();
  }

  /** The default path: the clip goes to the ustadh's queue, unscored. */
  async function sendToUstadh() {
    if (!clip) return;
    setPhase("sending");
    setFailure(null);
    try {
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ unitId, audioBase64: clip.base64, mimeType: clip.mimeType, durationSeconds: clip.seconds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setClip(null);
      setData(null);
      setPhase("sent");
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "The recording was not sent. Nothing reached your ustadh.");
      setPhase("ready");
    }
  }

  function checkWithAi() {
    if (!clip) return;
    void check({ mode: "audio", audioBase64: clip.base64, mimeType: clip.mimeType, browserTranscript: clip.browserTranscript });
  }

  const busy = phase === "checking" || phase === "sending";
  const recording = recorder.recording;

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <SectionTitle title="Listen" hint="Reference recitation, one ayah at a time" action={<Chip tone={KIND_TONE[kind]}>{KIND_LABEL[kind]}</Chip>} />
        <AyahPlayer segments={segments} />
      </div>

      <div className="card p-5">
        <SectionTitle title="Recite back" hint="Your ustadh hears the recording and marks it on the Hifz rubric" />
        <div className="flex flex-wrap items-center gap-2">
          {recording ? (
            <button type="button" onClick={() => recorder.stop()} className="btn-danger">
              <Square size={14} /> Stop recording
            </button>
          ) : (
            <button type="button" onClick={startRecording} disabled={busy} className="btn-primary">
              <Mic size={14} /> {clip ? "Record again" : "Record"}
            </button>
          )}
          {clip ? (
            <>
              <span className="num text-xs text-ink-3">Recording ready · {fmtClipLength(clip.seconds)}</span>
              <button type="button" onClick={sendToUstadh} disabled={busy} className="btn-primary">
                <Send size={14} /> {phase === "sending" ? "Sending…" : "Send to ustadh"}
              </button>
              <button type="button" onClick={() => { setClip(null); setPhase("idle"); }} disabled={busy} className="btn-ghost">
                <RotateCcw size={14} /> Discard
              </button>
            </>
          ) : null}
        </div>

        {phase === "sent" ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-ok/30 bg-ok-soft/40 px-4 py-3">
            <CheckCircle2 size={15} className="text-ok" />
            <p className="text-xs font-medium text-ok">Sent to your ustadh. No score exists until he has heard it.</p>
            <Link href={SUBMISSIONS_HREF} className="btn-soft btn-sm ml-auto">
              My recitations
            </Link>
          </div>
        ) : null}

        <p className="mt-3 text-2xs text-ink-3">
          The recording is held in this demo server&apos;s memory for your ustadh to hear. It is not saved to disk and goes nowhere else unless you use the experimental AI check below.
          {recorder.support.speech ? " The browser's own speech recognition runs alongside the recording for the live caption only; it never marks the recitation." : ""}
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

      <div className="card p-5">
        <SectionTitle
          title="Experimental AI check"
          hint="Not the marking path; the ustadh's mark is the assessment of record"
          action={
            <button type="button" onClick={() => setAiOpen((open) => !open)} className="btn-ghost btn-sm" aria-expanded={aiOpen}>
              <FlaskConical size={13} /> {aiOpen ? "Hide" : "Open"}
            </button>
          }
        />
        {aiOpen ? (
          <div className="space-y-4">
            <p className="text-xs text-ink-2">
              This sends the recording to the transcription provider and aligns what it heard against the canonical text, word by word. It has not been validated on children reciting in a
              classroom and can mis-hear a correct recitation. A live transcription does still write to the memorisation record, and your ustadh&apos;s mark overrides it.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={checkWithAi} disabled={busy || recording || !clip} className="btn-outline">
                <FlaskConical size={14} /> Check this recording
              </button>
              <div className="relative">
                <div className="inline-flex overflow-hidden rounded-xl border border-line-strong bg-surface">
                  <button type="button" onClick={() => simulate("perfect")} disabled={busy || recording} className="btn-ghost rounded-none">
                    <Wand2 size={14} /> Simulate attempt
                  </button>
                  <button type="button" onClick={() => setMenuOpen((open) => !open)} disabled={busy || recording} className="btn-ghost rounded-none border-l border-line px-2" aria-label="Simulation options" aria-expanded={menuOpen}>
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
              {phase === "checking" ? <span className="text-xs text-ink-3">Checking…</span> : null}
            </div>
            {!clip ? <p className="text-2xs text-ink-3">Record a passage first to check it. Simulated attempts are scripted examples and are labelled as such.</p> : null}

            {phase === "result" && data ? (
              <div className="rounded-2xl border border-line p-4">
                <SectionTitle title="Experimental result" hint="Word by word against the canonical text; not a mark from your ustadh" />
                <ResultView data={data} segments={segments} today={today} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
