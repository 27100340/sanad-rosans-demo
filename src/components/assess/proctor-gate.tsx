"use client";

import { useState } from "react";
import { Camera, Check, Loader2, Lock, Maximize2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Chip } from "@/components/ui/primitives";
import { MAX_CAMERA_WARNINGS } from "@/lib/domain/proctor";
import { cn } from "@/lib/utils";
import type { CameraStatus } from "./proctor-camera";

/**
 * The three steps a student passes before a strict (proctored) test renders:
 * 1. consent — what is monitored, that nothing leaves the device, that a
 *    violation locks the test until the teacher unlocks it;
 * 2. camera — the floating preview runs until it reports `calibrated`;
 * 3. full screen — `requestFullscreen()` then the questions appear.
 * A denied camera offers "Continue with basic monitoring" instead of a dead end.
 */

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = { 1: "Consent", 2: "Camera", 3: "Full screen" };

const RULES = [
  { icon: ShieldCheck, tone: "text-ok", text: "Your camera stays on and an on-device proctor watches for a second person, a phone or notes in frame, and sustained looking away. Nothing is uploaded; only a single still image is kept when a warning is raised." },
  { icon: ShieldAlert, tone: "text-warn", text: `The test locks if you leave full screen, switch tabs, minimise, split the screen, screenshot, print or copy — or after ${MAX_CAMERA_WARNINGS} camera warnings. A locked test reopens only when your teacher unlocks it.` },
  { icon: Lock, tone: "text-accent", text: "Looking down at your desk to write is fine and is never flagged. Turning left, right or up for a few seconds will warn you first." },
] as const;

function Steps({ current }: { current: Step }) {
  return (
    <ol className="flex items-center gap-2 text-2xs font-medium text-ink-3">
      {([1, 2, 3] as Step[]).map((s) => (
        <li key={s} className="flex items-center gap-2">
          <span className={cn("num grid h-6 w-6 place-items-center rounded-full", s < current ? "bg-ok-soft text-ok" : s === current ? "bg-accent text-white" : "bg-surface-2 text-ink-3")}>{s < current ? <Check size={12} /> : s}</span>
          <span className={s === current ? "text-ink" : ""}>{STEP_LABELS[s]}</span>
          {s < 3 ? <span className="h-px w-4 bg-line" /> : null}
        </li>
      ))}
    </ol>
  );
}

function CameraState({ camera }: { camera: CameraStatus | null }) {
  const blocked = camera?.blocked ?? false;
  const calibrated = camera?.calibrated ?? false;
  const tone = calibrated ? "chip-ok" : blocked ? "chip-danger" : "chip-warn";
  const text = calibrated
    ? camera?.degraded
      ? "Approved under basic monitoring — the advanced models could not load on this device."
      : "Position approved. You are ready to begin."
    : blocked
      ? "Camera blocked. Allow access in your browser, or continue with basic monitoring."
      : camera?.ready
        ? "Camera on — hold still while your position is approved."
        : "Waiting for the camera. Allow access when your browser asks.";
  return (
    <p className={cn(tone, "w-full justify-start whitespace-normal rounded-xl px-3 py-2 text-xs font-medium")}>
      {calibrated ? <Check size={14} className="shrink-0" /> : blocked ? <ShieldAlert size={14} className="shrink-0" /> : <Loader2 size={14} className="shrink-0 animate-spin" />}
      <span>{text}</span>
    </p>
  );
}

export function ProctorGate({
  title,
  camera,
  onCameraRequested,
  onBegin,
}: {
  title: string;
  camera: CameraStatus | null;
  /** Step 2 opened: the parent should mount the camera in "preview" phase. */
  onCameraRequested: () => void;
  /** Step 3 done: the parent starts the session and shows the questions. `cameraConsent` is false only when the camera was blocked. */
  onBegin: (cameraConsent: boolean) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [consent, setConsent] = useState(false);
  const [basic, setBasic] = useState(false);
  const [entering, setEntering] = useState(false);

  const openCamera = () => {
    onCameraRequested();
    setStep(2);
  };

  const begin = async () => {
    setEntering(true);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* full screen is best-effort: some phones refuse it and the guard still runs */
    }
    onBegin(!basic);
  };

  return (
    <div className="card mx-auto max-w-lg p-6 sm:p-7">
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Chip tone="danger">Proctored test</Chip>
          <Steps current={step} />
        </div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <ul className="space-y-3 rounded-xl bg-surface-2 p-4 text-sm text-ink-2">
            {RULES.map((r) => (
              <li key={r.text} className="flex items-start gap-2.5">
                <r.icon size={16} className={cn("mt-0.5 shrink-0", r.tone)} />
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-2">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[rgb(var(--accent))]" />
            <span>I consent to on-device camera monitoring for the duration of this test and I understand the integrity rules above.</span>
          </label>
          <div className="flex justify-end">
            <button type="button" className="btn-primary" disabled={!consent} onClick={openCamera}>
              Continue
              <Camera size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-surface-2 p-4 text-sm text-ink-2">
            <p className="mb-1 font-medium text-ink">Get in position</p>
            <ol className="list-decimal space-y-1 pl-5 text-xs">
              <li>Sit centred and face the screen in good light, with only you in frame.</li>
              <li>Put phones and notes away — the proctor scans for them.</li>
              <li>Your position is approved automatically; watch the camera window in the corner.</li>
            </ol>
          </div>
          <CameraState camera={camera} />
          <div className="flex flex-wrap justify-end gap-2">
            {camera?.blocked ? (
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setBasic(true);
                  setStep(3);
                }}
              >
                Continue with basic monitoring
              </button>
            ) : null}
            <button type="button" className="btn-primary" disabled={!camera?.calibrated} onClick={() => setStep(3)}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-surface-2 p-4 text-sm text-ink-2">
            <p className="mb-1 font-medium text-ink">Last step</p>
            <p className="text-xs">The test opens in full screen. Leaving full screen at any point locks it, so close other windows and silence notifications before you begin.</p>
            {basic ? <p className="mt-2 text-xs text-warn">Basic monitoring: the camera is unavailable, so only window and keyboard signals are recorded. Your teacher will see this on the session.</p> : null}
          </div>
          <div className="flex justify-end">
            <button type="button" className="btn-primary" disabled={entering} onClick={() => void begin()}>
              <Maximize2 size={14} />
              Enter full screen and begin
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
