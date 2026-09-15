"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GripHorizontal, Loader2, ShieldAlert } from "lucide-react";
import { Chip, type Tone } from "@/components/ui/primitives";
import { MAX_CAMERA_WARNINGS, type GuardEventType } from "@/lib/domain/proctor";
import { cn } from "@/lib/utils";
import type { GuardEvent } from "./use-exam-guard";

/**
 * On-device exam proctor. PRIVACY-FIRST: the webcam stream never leaves the
 * browser and no video is stored. Face/attention + object analysis run locally
 * via MediaPipe (FaceLandmarker + ObjectDetector, loaded from CDN at runtime;
 * graceful fallback keeps the window/tab guard protecting the test if a model
 * can't load). A single still JPEG snapshot is emitted to the parent on each
 * warning / violation for the teacher's forensic record.
 *
 * VIDEO FIRST, ANALYSIS BEST-EFFORT: the preview is attached and played as soon
 * as getUserMedia resolves and never waits on a model. If the models cannot load
 * the video still shows and the UI says analysis is off — it must never claim a
 * face is "in view" when nothing measured it, and it must never stand in a
 * stock or simulated feed.
 *
 * Escalation: a sustained malpractice signal raises an on-screen WARNING with
 * a soft beep + snapshot. TWO warnings → a SIREN + terminal event that cancels
 * & LOCKS the test (the student must justify to their teacher).
 *
 * Legitimate writing posture (head down at the desk to solve a hard-copy answer
 * script) is WHITELISTED after calibration and never counts as a violation.
 * Turning LEFT / RIGHT / UP for a sustained span does.
 *
 * Signals: absence (no face) · multiface (2+ people) · headturn (left/right/up)
 * · material (phone / laptop / TV in frame).
 */

export type CameraPhase = "preview" | "live" | "off";

/** Why there is no live preview. "none" means the camera is running. */
export type CameraBlock = "none" | "insecure" | "unsupported" | "policy" | "denied" | "nodevice" | "noframes" | "inuse" | "unknown";

/** What the on-device analysis is doing. The video never waits on this. */
export type AnalysisState = "loading" | "on" | "off";

export interface CameraStatus {
  ready: boolean;
  faceOk: boolean;
  faces: number;
  message: string;
  degraded: boolean;
  calibrated: boolean;
  /** getUserMedia failed: the student denied access or has no camera. */
  blocked: boolean;
  /** Why the preview is not running, so the UI can say something true instead of showing a dead box. */
  block: CameraBlock;
  /** Analysis is independent of the video: it may be off while the preview is live. */
  analysis: AnalysisState;
  /** The object detector is optional and loads after the face model, so it is reported separately rather than implied. */
  objects: boolean;
}

/**
 * One honest sentence per failure. `short` fits the narrow camera tile, `detail`
 * is the full explanation for the gate. Nothing here ever implies the proctor is
 * watching when it is not.
 */
export const CAMERA_BLOCK_COPY: Record<Exclude<CameraBlock, "none">, { short: string; detail: string }> = {
  insecure: {
    short: "Not a secure connection",
    detail: "Browsers only release the camera on https:// or on localhost. This page was opened over plain http, so the camera cannot start here. Open the portal over https, or on the machine itself at localhost.",
  },
  unsupported: {
    short: "No camera support",
    detail: "This browser does not offer a camera to web pages, so the proctor cannot see you.",
  },
  policy: {
    short: "Blocked by site policy",
    detail: "This site's Permissions-Policy header switches the camera off, so the browser never even asks for access. An administrator has to allow the camera for this site.",
  },
  denied: {
    short: "Access refused",
    detail: "The browser refused camera access. Allow the camera for this site from the address-bar controls, then reload. If you were never shown a prompt, the site or a device policy is blocking it rather than you.",
  },
  nodevice: {
    short: "No camera found",
    detail: "No camera is attached to this device, or none matches what the proctor asked for.",
  },
  noframes: {
    short: "No picture from the camera",
    detail: "The camera was allowed but it is not sending any picture. Another application may be holding it, or it may be a virtual camera with nothing to show. Close anything else using the camera and reload.",
  },
  inuse: {
    short: "Camera is busy",
    detail: "Another application is already using the camera. Close it, then reload this page.",
  },
  unknown: {
    short: "Camera unavailable",
    detail: "The camera could not be started and the browser did not say why.",
  },
};

/**
 * Map a getUserMedia rejection onto one honest cause. Chrome reports a
 * Permissions-Policy block as a NotAllowedError exactly like a person clicking
 * "Block", so the message text is the only separator — and when it says nothing
 * we fall back to "denied", whose copy names both possibilities rather than
 * blaming the student for a server header.
 */
function classifyCameraError(err: unknown): Exclude<CameraBlock, "none"> {
  const e = err as { name?: string; message?: string } | null;
  const name = e?.name ?? "";
  const msg = (e?.message ?? "").toLowerCase();
  if (msg.includes("permissions policy") || msg.includes("permission policy") || msg.includes("feature policy")) return "policy";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") return "nodevice";
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return "inuse";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") return "denied";
  return "unknown";
}

const MP_VERSION = "0.10.20";
const MP_MODULE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.mjs`;
const MP_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MP_FACE = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const MP_OBJECT = "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

// COCO classes we treat as "helping material" / second screens.
const MATERIAL = new Set(["cell phone", "laptop", "tv", "remote"]);

const CAM_W = 176;
const CAM_H = 150;
const CAM_MARGIN = 8;
const CAM_DEFAULT_TOP = 92;
const CAM_POS_KEY = "proctor-cam-pos";
const SNAPSHOT_W = 360;
const SNAPSHOT_QUALITY = 0.6;
const WARN_BANNER_MS = 4500;

// Sustained-signal thresholds (ms) before an episode escalates.
const ABSENCE_MS = 4500;
const MULTIFACE_MS = 1600;
const HEADTURN_MS = 3500;
const MATERIAL_MS = 1500;
const FACE_INTERVAL_MS = 150;
const OBJECT_INTERVAL_MS = 550;
const FRESH_FACE_MS = 800;
const CALIBRATE_POLL_MS = 250;
const CALIBRATE_MIN_POINTS = 100;
const CALIBRATE_FAIL_GRACE_MS = 1500;
const CALIBRATE_TIMEOUT_MS = 8000;
const GPU_HEALTH_MS = 2600;
const SIDEWAYS_THRESHOLD = 0.2;
const UP_THRESHOLD = -0.22;
// A CDN that hangs rather than failing would otherwise leave the proctor stuck
// on "starting" forever, so the model load is bounded and then declared off.
const MODEL_TIMEOUT_MS = 12_000;
const FIRST_FRAME_TIMEOUT_MS = 6000;

/** Reject once `ms` has passed so a hanging CDN degrades instead of hanging the proctor. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

// Load a remote ES module at runtime. Native dynamic import() is CSP-safe (it
// needs the CDN origin in script-src, NOT 'unsafe-eval' like new Function/eval),
// so this must never use new Function. The ignore hints keep the bundler from
// trying to resolve the runtime URL at build.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dynImport(u: string): Promise<any> {
  return import(/* webpackIgnore: true */ /* turbopackIgnore: true */ u);
}

type Point = { x: number; y: number };

function bounds(pts: Point[]) {
  let mnX = 1, mxX = 0, mnY = 1, mxY = 0;
  for (const p of pts) {
    if (p.x < mnX) mnX = p.x;
    if (p.x > mxX) mxX = p.x;
    if (p.y < mnY) mnY = p.y;
    if (p.y > mxY) mxY = p.y;
  }
  return { mnX, mxX, mnY, mxY };
}

/** Nose offset from the face-box centre, normalised by face size: the head-pose signal. */
function noseOffset(pts: Point[]): { nx: number; ny: number } {
  const { mnX, mxX, mnY, mxY } = bounds(pts);
  const nose = pts[1] ?? pts[0];
  const cx = (mnX + mxX) / 2, cy = (mnY + mxY) / 2;
  const fw = Math.max(0.001, mxX - mnX), fh = Math.max(0.001, mxY - mnY);
  return { nx: (nose.x - cx) / fw, ny: (nose.y - cy) / fh };
}

/** Theme colour triplet ("R G B") read from the CSS tokens so the overlay follows the palette. */
function tokenRgb(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

const INITIAL_STATUS: CameraStatus = { ready: false, faceOk: false, faces: 0, message: "Starting camera…", degraded: false, calibrated: false, blocked: false, block: "none", analysis: "loading", objects: false };

export function ProctorCamera({
  phase,
  onStatus,
  onEvent,
  onSnapshot,
}: {
  phase: CameraPhase;
  onStatus?: (s: CameraStatus) => void;
  onEvent?: (ev: GuardEvent) => void;
  onSnapshot?: (dataUrl: string, reason: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // MediaPipe task handles are untyped: the module is loaded at runtime from the CDN.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visionRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filesetRef = useRef<any>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const lastPointsRef = useRef<Point[]>([]);
  const lastFaceAtRef = useRef<number>(0);
  const baselineRef = useRef<{ nx: number; ny: number } | null>(null);
  const modelReadyRef = useRef(false); // face landmarker is live
  const modelDoneRef = useRef(false); // model load finished (ready OR failed)
  const faceDelegateRef = useRef<"GPU" | "CPU">("GPU");
  const detectCountRef = useRef(0); // successful face detections so far
  const camOnAtRef = useRef(0);
  const recreatedRef = useRef(false); // one-time GPU→CPU recreate done
  const tsRef = useRef(0); // strictly-increasing detect timestamp
  const warningsRef = useRef(0);
  const blockedRef = useRef(false); // getUserMedia never produced a stream
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const [status, setStatus] = useState<CameraStatus>(INITIAL_STATUS);
  const [warnBanner, setWarnBanner] = useState<{ n: number; msg: string } | null>(null);

  const statusCb = useRef(onStatus);
  const eventCb = useRef(onEvent);
  const snapCb = useRef(onSnapshot);
  statusCb.current = onStatus;
  eventCb.current = onEvent;
  snapCb.current = onSnapshot;

  // Report status to the parent after commit, never from inside a state updater.
  useEffect(() => {
    try {
      statusCb.current?.(status);
    } catch {
      /* ignore */
    }
  }, [status]);

  const push = useCallback((s: Partial<CameraStatus>) => {
    setStatus((prev) => {
      const next = { ...prev, ...s };
      for (const k of Object.keys(s) as (keyof CameraStatus)[]) if (prev[k] !== next[k]) return next;
      return prev;
    });
  }, []);

  // ---- draggable window position (stays on-screen, remembered per browser) ----
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const clampPos = (x: number, y: number) => ({
    x: Math.min(Math.max(CAM_MARGIN, x), window.innerWidth - CAM_W - CAM_MARGIN),
    y: Math.min(Math.max(CAM_MARGIN, y), window.innerHeight - CAM_H - CAM_MARGIN),
  });
  useEffect(() => {
    if (phase === "off") return;
    let start = { x: window.innerWidth - CAM_W - CAM_MARGIN * 2, y: CAM_DEFAULT_TOP }; // default: upper-right, NOT bottom
    try {
      const s = localStorage.getItem(CAM_POS_KEY);
      if (s) {
        const j = JSON.parse(s) as { x?: unknown; y?: unknown };
        if (typeof j.x === "number" && typeof j.y === "number") start = { x: j.x, y: j.y };
      }
    } catch {
      /* storage optional */
    }
    setPos(clampPos(start.x, start.y));
    const onResize = () => setPos((p) => (p ? clampPos(p.x, p.y) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [phase]);
  const onCamGrab = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return; // left button only
    const p = pos ?? clampPos(window.innerWidth - CAM_W - CAM_MARGIN * 2, CAM_DEFAULT_TOP);
    dragRef.current = { dx: e.clientX - p.x, dy: e.clientY - p.y };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };
  const onCamMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPos(clampPos(e.clientX - dragRef.current.dx, e.clientY - dragRef.current.dy));
  };
  const onCamRelease = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setPos((p) => {
      if (p) {
        try {
          localStorage.setItem(CAM_POS_KEY, JSON.stringify(p));
        } catch {
          /* storage optional */
        }
      }
      return p;
    });
  };

  const grabFrame = useCallback((): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const w = SNAPSHOT_W, h = Math.round((v.videoHeight / v.videoWidth) * SNAPSHOT_W) || 270;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, w, h);
    try {
      return c.toDataURL("image/jpeg", SNAPSHOT_QUALITY);
    } catch {
      return null;
    }
  }, []);

  // ---- WebAudio beep / siren (no external asset) ----
  const tone = useCallback((kind: "beep" | "siren") => {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!audioRef.current) audioRef.current = new AC();
      const ctx = audioRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => undefined);
      const now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      if (kind === "beep") {
        o.type = "sine";
        o.frequency.setValueAtTime(880, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now);
        o.stop(now + 0.36);
      } else {
        // rising/falling siren for ~2.2s
        o.type = "sawtooth";
        for (let i = 0; i < 5; i++) {
          const t = now + i * 0.44;
          o.frequency.setValueAtTime(650, t);
          o.frequency.linearRampToValueAtTime(1180, t + 0.22);
          o.frequency.linearRampToValueAtTime(650, t + 0.44);
        }
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
        g.gain.setValueAtTime(0.3, now + 2.0);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now);
        o.stop(now + 2.25);
      }
    } catch {
      /* audio optional */
    }
  }, []);

  const emit = useCallback((type: GuardEventType, reason: string, terminal: boolean) => {
    try {
      eventCb.current?.({ type, reason, terminal, at: Date.now() });
    } catch {
      /* ignore */
    }
  }, []);
  const snap = useCallback(
    (reason: string) => {
      const url = grabFrame();
      if (url) {
        try {
          snapCb.current?.(url, reason);
        } catch {
          /* ignore */
        }
      }
    },
    [grabFrame],
  );

  // A sustained malpractice episode → escalate.
  const escalate = useCallback(
    (type: GuardEventType, reason: string) => {
      warningsRef.current += 1;
      const n = warningsRef.current;
      snap(reason);
      setWarnBanner({ n, msg: reason });
      if (n >= MAX_CAMERA_WARNINGS) {
        tone("siren");
        emit(type, `${reason} (final warning — test locked after ${n} warnings).`, true);
      } else {
        tone("beep");
        emit(type, `${reason} (warning ${n} of ${MAX_CAMERA_WARNINGS}).`, false);
        setTimeout(() => setWarnBanner((b) => (b && b.n === n ? null : b)), WARN_BANNER_MS);
      }
    },
    [emit, snap, tone],
  );

  // AUTOMATIC calibration — no button, no manual step. As soon as the camera is
  // on we watch for a stable face: first good detection locks the baseline and
  // approves the position. If the on-device model can't produce detections
  // within ~8s (older device / broken GPU / blocked CDN) we approve under BASIC
  // monitoring — but ONLY while a real picture is arriving. With no stream there
  // is no approval of any kind; that student is routed out through the explicit
  // no-camera button instead, so nobody is stuck and nobody is told they were
  // checked when they were not.
  useEffect(() => {
    if (phase !== "preview") return;
    let done = false;
    let wasBlocked = false;
    let startedAt = Date.now();
    const iv = setInterval(() => {
      if (done) return;
      // A camera that never started is never "approved": the student takes the
      // explicit no-camera route instead, so the record says the camera was off.
      // Keep polling rather than stopping — a "no picture" block can lift once
      // frames start arriving, and calibration has to be able to resume.
      if (blockedRef.current) {
        wasBlocked = true;
        return;
      }
      // A block that lifted means the picture only just arrived: give the model
      // its full window from now, not from before there was anything to look at.
      if (wasBlocked) {
        wasBlocked = false;
        startedAt = Date.now();
      }
      const pts = lastPointsRef.current;
      const fresh = Date.now() - lastFaceAtRef.current < FRESH_FACE_MS;
      if (modelReadyRef.current && pts.length >= CALIBRATE_MIN_POINTS && fresh) {
        done = true;
        clearInterval(iv);
        baselineRef.current = noseOffset(pts);
        warningsRef.current = 0;
        push({ calibrated: true, degraded: false, message: "Position approved" });
        return;
      }
      const waited = Date.now() - startedAt;
      // Model finished but failed, or nothing detected after a fair wait → basic.
      // THE HARD PRECONDITION: a picture must actually be arriving. This branch
      // used to fire on elapsed time alone, so a student whose camera was denied
      // — or who left the browser prompt sitting open past the timeout — was told
      // their position was "Approved · basic monitoring" with no stream at all.
      // Approval may be downgraded to basic monitoring; it may never be invented.
      if (!videoRef.current?.videoWidth) return;
      if ((modelDoneRef.current && !modelReadyRef.current && waited > CALIBRATE_FAIL_GRACE_MS) || waited > CALIBRATE_TIMEOUT_MS) {
        done = true;
        clearInterval(iv);
        baselineRef.current = null;
        warningsRef.current = 0;
        push({ calibrated: true, degraded: !modelReadyRef.current, message: modelReadyRef.current ? "Camera approved" : "Approved · camera only, no analysis" });
      }
    }, CALIBRATE_POLL_MS);
    return () => clearInterval(iv);
  }, [phase, push]);

  // Create a FaceLandmarker on the given delegate (GPU fast / CPU reliable).
  const makeFace = useCallback(async (delegate: "GPU" | "CPU") => {
    return visionRef.current.FaceLandmarker.createFromOptions(filesetRef.current, {
      baseOptions: { modelAssetPath: MP_FACE, delegate },
      runningMode: "VIDEO",
      numFaces: 2,
    });
  }, []);

  // If GPU created OK but produced zero detections shortly after the camera is
  // on, transparently rebuild on CPU (the classic broken-GPU-delegate case).
  const healthCheckFace = useCallback(() => {
    if (recreatedRef.current) return;
    if (faceDelegateRef.current !== "GPU" || !modelReadyRef.current) return;
    if (!camOnAtRef.current || Date.now() - camOnAtRef.current < GPU_HEALTH_MS) return;
    if (detectCountRef.current > 0) return;
    recreatedRef.current = true;
    (async () => {
      try {
        const next = await makeFace("CPU");
        const old = faceRef.current;
        faceRef.current = next;
        faceDelegateRef.current = "CPU";
        try {
          old?.close?.();
        } catch {
          /* ignore */
        }
      } catch {
        /* keep GPU instance */
      }
    })();
  }, [makeFace]);

  /**
   * Attach the stream and start playing. The element also carries `autoPlay`, so
   * a rejected play() (an interrupted load, a browser that refuses the
   * programmatic call) is not the only route to a visible frame, and the
   * element's onLoadedMetadata retries once it genuinely has data.
   */
  const attachStream = useCallback((stream: MediaStream) => {
    const v = videoRef.current;
    if (!v) return;
    if (v.srcObject !== stream) v.srcObject = stream;
    void v.play().catch(() => undefined);
  }, []);

  const onVideoReady = useCallback(() => {
    void videoRef.current?.play().catch(() => undefined);
  }, []);

  // ---- camera + models lifecycle (one stream for the whole preview → live run) ----
  const running = phase !== "off";
  useEffect(() => {
    if (!running) return;
    let alive = true;

    const fail = (block: Exclude<CameraBlock, "none">, detail: string) => {
      blockedRef.current = true;
      push({ ready: false, degraded: true, blocked: true, block, analysis: "off", message: CAMERA_BLOCK_COPY[block].short });
      emit("camera_off", detail, false);
    };

    (async () => {
      // getUserMedia exists only in a secure context, so test that FIRST: over
      // plain http on a LAN address `navigator.mediaDevices` is simply undefined,
      // and a bare "camera blocked" would send the student hunting for a prompt
      // their browser is never going to show.
      if (!window.isSecureContext) {
        fail("insecure", "The page is not on a secure origin, so the browser will not release the camera.");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        fail("unsupported", "This browser exposes no camera API.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
        if (!alive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        blockedRef.current = false;
        attachStream(stream);
        push({ ready: true, blocked: false, block: "none", message: "Camera on — centre your face and hold still." });
      } catch (err) {
        if (!alive) return;
        const block = classifyCameraError(err);
        fail(block, CAMERA_BLOCK_COPY[block].detail);
        return;
      }
      try {
        const vision = await withTimeout(dynImport(MP_MODULE), MODEL_TIMEOUT_MS);
        const fileset = await withTimeout(vision.FilesetResolver.forVisionTasks(MP_WASM), MODEL_TIMEOUT_MS);
        visionRef.current = vision;
        filesetRef.current = fileset;
        // GPU (WebGL) is fastest but on many tablets/browsers it CREATES fine yet
        // never produces results — fall back to CPU on throw, and a runtime
        // health-check below recreates on CPU if GPU yields no detections.
        try {
          faceRef.current = await withTimeout(makeFace("GPU"), MODEL_TIMEOUT_MS);
          faceDelegateRef.current = "GPU";
        } catch {
          faceRef.current = await withTimeout(makeFace("CPU"), MODEL_TIMEOUT_MS);
          faceDelegateRef.current = "CPU";
        }
        if (!alive) return;
        modelReadyRef.current = true;
        modelDoneRef.current = true;
        camOnAtRef.current = Date.now();
        push({ degraded: false, analysis: "on", message: "Proctor ready — centre your face and hold still." });
        // Object detector is optional. Load on CPU (running two GPU tasks at once
        // can break FaceLandmarker inference), in the background, never blocking.
        (async () => {
          try {
            objRef.current = await vision.ObjectDetector.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: MP_OBJECT, delegate: "CPU" },
              runningMode: "VIDEO",
              scoreThreshold: 0.45,
              maxResults: 6,
            });
            if (alive) push({ objects: true });
          } catch {
            objRef.current = null;
            push({ objects: false });
          }
        })();
      } catch {
        faceRef.current = null;
        objRef.current = null;
        modelReadyRef.current = false;
        modelDoneRef.current = true;
        // The video keeps running; only the analysis is gone, and the status must
        // say so rather than implying a face is being watched.
        push({ degraded: true, analysis: "off", objects: false, message: "Live video · analysis unavailable." });
        emit("camera_degraded", "The on-device analysis models could not load, so this sitting is recorded as camera-only basic monitoring.", false);
      }
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
      try {
        faceRef.current?.close?.();
      } catch {
        /* ignore */
      }
      try {
        objRef.current?.close?.();
      } catch {
        /* ignore */
      }
      faceRef.current = null;
      objRef.current = null;
      modelReadyRef.current = false;
      modelDoneRef.current = false;
      blockedRef.current = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      try {
        audioRef.current?.close?.();
      } catch {
        /* ignore */
      }
      audioRef.current = null;
    };
  }, [running, push, emit, makeFace, attachStream]);

  // A granted stream that never delivers a frame (a virtual camera, a driver
  // that hands back a dead track) is indistinguishable from a broken app, so
  // name it instead of leaving a black rectangle on screen.
  useEffect(() => {
    if (!status.ready) return;
    const id = setTimeout(() => {
      if (videoRef.current?.videoWidth) return;
      // Treat it as a block, not a warning: that surfaces the real reason AND
      // the explicit no-camera route, so the student is never stranded at a gate
      // they cannot pass. The scan loop lifts this again if frames do arrive.
      blockedRef.current = true;
      push({ ready: false, blocked: true, block: "noframes", degraded: true, analysis: "off", message: CAMERA_BLOCK_COPY.noframes.short });
      emit("camera_off", CAMERA_BLOCK_COPY.noframes.detail, false);
    }, FIRST_FRAME_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [status.ready, push, emit]);

  // ---- analysis + scan overlay ----
  useEffect(() => {
    if (!running) return;
    let absentSince = 0, multiSince = 0, turnSince = 0, matSince = 0, scanY = 0, lastFace = 0, lastObj = 0;
    let matPresent = false, matLabel = "";
    // episode latches so ONE sustained event = ONE warning until it clears
    const latch = { turn: false, absent: false, multi: false, material: false };
    const accent = tokenRgb("--accent", "17 94 68");
    const danger = tokenRgb("--danger", "180 35 24");
    const rgba = (rgb: string, a: number) => `rgb(${rgb} / ${a})`;

    const evaluate = (faces: number, points: Point[]) => {
      const live = phaseRef.current === "live";
      const t = Date.now();

      // helping material (phone / laptop / TV)
      if (matPresent) {
        if (!matSince) matSince = t;
        if (live && t - matSince > MATERIAL_MS && !latch.material) {
          latch.material = true;
          escalate("material", `Possible helping material detected in frame (${matLabel}).`);
        }
        push({ message: `Put away any ${matLabel || "devices or notes"}.` });
      } else {
        matSince = 0;
        latch.material = false;
      }

      // multiple faces
      if (faces > 1) {
        if (!multiSince) multiSince = t;
        if (live && t - multiSince > MULTIFACE_MS && !latch.multi) {
          latch.multi = true;
          escalate("multiface", "Another person appeared in the camera.");
        }
        push({ faces, faceOk: false, message: "More than one face detected." });
        absentSince = 0;
        turnSince = 0;
        return;
      }
      multiSince = 0;
      latch.multi = false;

      // absence
      if (faces === 0) {
        if (!absentSince) absentSince = t;
        push({ faces: 0, faceOk: false, message: "No face detected — stay in view." });
        if (live && t - absentSince > ABSENCE_MS && !latch.absent) {
          latch.absent = true;
          escalate("absence", "Your face left the camera view.");
        }
        return;
      }
      absentSince = 0;
      latch.absent = false;

      // No landmark data yet (model warming up, or basic-monitoring mode):
      // nothing to measure — never fall through to head-pose math with an
      // empty array (nose would be undefined → crash → dead loop).
      if (points.length < 3) {
        push({ faces: 1, faceOk: true, message: "Scanning…" });
        return;
      }

      // head pose vs calibrated baseline (down = writing = allowed)
      const { nx, ny } = noseOffset(points);
      const base = baselineRef.current ?? { nx, ny };
      const sideways = Math.abs(nx - base.nx) > SIDEWAYS_THRESHOLD; // turned left / right
      const up = ny - base.ny < UP_THRESHOLD; // looking up / away (down is allowed)
      if (sideways || up) {
        if (!turnSince) turnSince = t;
        push({ faces: 1, faceOk: false, message: sideways ? "Face forward — do not turn away." : "Eyes on the screen." });
        if (live && t - turnSince > HEADTURN_MS && !latch.turn) {
          latch.turn = true;
          escalate("headturn", sideways ? "You turned your head away from the screen." : "You looked up, away from the screen.");
        }
      } else {
        turnSince = 0;
        latch.turn = false;
        push({ faces: 1, faceOk: true, message: baselineRef.current ? "Face in view — good." : "Centre your face and hold still." });
      }
    };

    const loop = () => {
      // Re-arm FIRST and guard the body: a single throw must never kill the
      // scan loop (that exact failure made detection permanently dead before).
      rafRef.current = requestAnimationFrame(loop);
      try {
        const v = videoRef.current, cv = overlayRef.current, now = performance.now();
        if (!v || !cv || !v.videoWidth) return;
        // Frames are arriving, so any "no picture" block was wrong or has cleared.
        // Only reachable with a live stream, so it can never lift a real denial.
        if (blockedRef.current) {
          blockedRef.current = false;
          push({ ready: true, blocked: false, block: "none", degraded: !modelReadyRef.current, message: "Camera on — centre your face and hold still." });
        }
        const W = (cv.width = cv.clientWidth), H = (cv.height = cv.clientHeight), ctx = cv.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, W, H);
        let points = lastPointsRef.current;
        let faces = points.length ? 1 : 0;
        const analysing = Boolean(faceRef.current);
        if (analysing && now - lastFace > FACE_INTERVAL_MS) {
          lastFace = now;
          healthCheckFace();
          try {
            // detectForVideo needs strictly-increasing ms timestamps or it throws.
            const ts = (tsRef.current = Math.max(tsRef.current + 1, Math.round(now)));
            const res = faceRef.current.detectForVideo(v, ts);
            const list = (res?.faceLandmarks ?? []) as Point[][];
            faces = list.length;
            points = (list[0] ?? []).map((p) => ({ x: p.x, y: p.y }));
            lastPointsRef.current = points;
            if (points.length) {
              lastFaceAtRef.current = Date.now();
              detectCountRef.current++;
            }
          } catch {
            /* transient */
          }
        }
        if (objRef.current && now - lastObj > OBJECT_INTERVAL_MS) {
          lastObj = now;
          try {
            const od = objRef.current.detectForVideo(v, now);
            const dets = (od?.detections ?? []) as { categories: { categoryName: string; score: number }[] }[];
            const hit = dets.find((d) => d.categories?.[0] && MATERIAL.has(d.categories[0].categoryName));
            matPresent = !!hit;
            matLabel = hit?.categories?.[0]?.categoryName ?? "";
          } catch {
            /* transient */
          }
        }
        if (analysing) {
          evaluate(faces, points);
        } else {
          // No detector this frame. Report the camera for what it is instead of
          // claiming a face nothing measured, and never escalate on a signal we
          // do not have.
          points = [];
          push({
            faces: 0,
            faceOk: false,
            analysis: modelDoneRef.current ? "off" : "loading",
            message: modelDoneRef.current ? "Live video · analysis unavailable." : "Live video · starting the proctor…",
          });
        }

        // ---- scan overlay ----
        scanY = (scanY + 2.2) % H;
        ctx.strokeStyle = rgba(accent, 0.1);
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 22) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y < H; y += 22) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        const grad = ctx.createLinearGradient(0, scanY - 18, 0, scanY + 18);
        grad.addColorStop(0, rgba(accent, 0));
        grad.addColorStop(0.5, rgba(accent, 0.55));
        grad.addColorStop(1, rgba(accent, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 18, W, 36);
        ctx.strokeStyle = rgba(accent, 0.9);
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(W, scanY);
        ctx.stroke();
        if (points.length) {
          ctx.fillStyle = rgba(accent, 0.85);
          for (let i = 0; i < points.length; i += 3) ctx.fillRect(points[i].x * W, points[i].y * H, 1.4, 1.4);
          const { mnX, mxX, mnY, mxY } = bounds(points);
          ctx.strokeStyle = faces > 1 || matPresent ? rgba(danger, 0.9) : rgba(accent, 0.9);
          ctx.lineWidth = 2;
          ctx.strokeRect(mnX * W, mnY * H, (mxX - mnX) * W, (mxY - mnY) * H);
        }
      } catch {
        /* keep scanning next frame */
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, escalate, push, healthCheckFace]);

  if (phase === "off") return null;

  // The badge describes what is actually known. With no analysis running there
  // is no face verdict to report, so it says "Camera only" rather than "In view".
  const noAnalysis = status.ready && status.analysis !== "on";
  const statusTone: Tone = !status.ready ? (status.blocked ? "danger" : "warn") : status.faces > 1 ? "danger" : noAnalysis ? "info" : status.faces === 0 ? "warn" : status.faceOk ? "ok" : "warn";
  const badgeLabel = !status.ready ? (status.blocked ? "Camera off" : "Starting") : status.faces > 1 ? "Multiple faces" : noAnalysis ? (status.analysis === "loading" ? "Camera only · loading" : "Camera only") : status.faces === 0 ? "No face" : status.faceOk ? "In view" : "Adjusting";
  const borderTone: Record<Tone, string> = { danger: "border-danger/70", warn: "border-warn/60", ok: "border-ok/70", accent: "border-accent/70", gold: "border-gold/70", info: "border-info/70", neutral: "border-line" };
  const finalWarning = warnBanner !== null && warnBanner.n >= MAX_CAMERA_WARNINGS;
  const privacyTitle = status.blocked
    ? CAMERA_BLOCK_COPY[status.block === "none" ? "unknown" : status.block].detail
    : status.analysis !== "on"
      ? "Live camera only — no face or object analysis is running. Nothing leaves your browser."
      : status.objects
        ? "On-device face and object analysis — nothing leaves your browser"
        : "On-device face analysis — nothing leaves your browser";

  return (
    <>
      {warnBanner ? (
        <div role="alert" className={cn("fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 px-4 py-2.5 text-center text-sm font-semibold text-white", finalWarning ? "bg-danger" : "bg-warn")}>
          <ShieldAlert size={16} />
          {finalWarning ? "Test locked — " : `Warning ${warnBanner.n} of ${MAX_CAMERA_WARNINGS} — `}
          {warnBanner.msg}
        </div>
      ) : null}

      <div
        className={cn("theme-dark fixed z-[60] w-[176px] touch-none select-none overflow-hidden rounded-2xl border-2 bg-surface shadow-lg", borderTone[statusTone])}
        style={pos ? { left: pos.x, top: pos.y } : { right: CAM_MARGIN * 2, top: CAM_DEFAULT_TOP }}
        onPointerDown={onCamGrab}
        onPointerMove={onCamMove}
        onPointerUp={onCamRelease}
        onPointerCancel={onCamRelease}
        title={privacyTitle}
      >
        <div className="flex cursor-grab items-center justify-center gap-1 bg-surface-2 py-0.5 text-[9px] text-ink-3 active:cursor-grabbing" title="Drag to move">
          <GripHorizontal size={11} /> Drag to move
        </div>
        <div className="relative aspect-[4/3] w-full bg-surface-3">
          {/* autoPlay is the belt to the explicit play()'s braces: a rejected
              programmatic play must not be the difference between video and a
              black box. muted keeps autoplay policy satisfied. */}
          <video ref={videoRef} autoPlay muted playsInline onLoadedMetadata={onVideoReady} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
          <canvas ref={overlayRef} className="absolute inset-0 h-full w-full -scale-x-100" />
          {!status.ready ? (
            <div className={cn("absolute inset-0 grid place-items-center px-2 text-center text-[10px]", status.blocked ? "bg-surface text-danger" : "bg-surface/80 text-warn")}>
              <span>
                {status.blocked ? <ShieldAlert size={16} className="mx-auto mb-1" /> : <Loader2 size={16} className="mx-auto mb-1 animate-spin" />}
                {status.message}
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1 border-t border-line px-2 py-1.5">
          <Chip tone={statusTone} className="w-fit">
            {badgeLabel}
          </Chip>
          <p className="truncate text-[10px] leading-snug text-ink-2" title={status.message}>
            {status.message}
          </p>
        </div>
      </div>
    </>
  );
}
