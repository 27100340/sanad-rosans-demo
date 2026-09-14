/**
 * Exam integrity: guard modes, forensic events and the proctor session state
 * machine. Pure; the store in lib/data/mock/proctor.ts persists sessions.
 * Ported from the reference exam lab (use-exam-guard.ts + lib/exam-lab/proctor.ts).
 *
 *   off       practice: nothing is monitored
 *   standard  no-help assignment: leaving the window cancels the attempt; captures are deterred and logged
 *   strict    formal test: everything in standard, plus capture/print/copy/full-screen-exit are terminal,
 *             the on-device camera proctor runs, and a terminal event LOCKS the attempt until a teacher unlocks it
 */

export type GuardMode = "off" | "standard" | "strict";

export type GuardEventType =
  | "hidden" | "blur" | "focus" | "resize_split" | "screenshot" | "print" | "contextmenu" | "copy" | "paste" | "cut"
  | "fullscreen_exit" | "pip" | "devtools"
  | "absence" | "multiface" | "headturn" | "material" | "camera_off" | "camera_degraded";

export interface ProctorEvent {
  type: GuardEventType;
  reason: string;
  terminal: boolean;
  at: number; // epoch ms
  source: "guard" | "camera" | "system";
}

export type ProctorStatus = "active" | "submitted" | "cancelled" | "locked" | "unlocked";

export interface ProctorSession {
  attemptId: string;
  studentId: string;
  testId: string;
  mode: GuardMode;
  cameraConsent: boolean;
  startedAt: number;
  endedAt: number | null;
  status: ProctorStatus;
  lockedReason: string | null;
  events: ProctorEvent[];
  snapshots: { id: string; at: number; reason: string }[]; // stills stored by the mock store
  unlockRequest: { at: number; note: string } | null;
  unlock: { by: string; at: number; note: string } | null;
}

export const MAX_EVENTS = 2000;
export const MAX_SNAPSHOTS = 40;
export const MAX_CAMERA_WARNINGS = 2;

export function newSession(input: Pick<ProctorSession, "attemptId" | "studentId" | "testId" | "mode" | "cameraConsent">, now: number): ProctorSession {
  return { ...input, startedAt: now, endedAt: null, status: "active", lockedReason: null, events: [], snapshots: [], unlockRequest: null, unlock: null };
}

export function isFrozen(s: Pick<ProctorSession, "status">): boolean {
  return s.status === "locked" || s.status === "cancelled";
}

/**
 * Appends events. A terminal event locks a strict session and cancels a
 * standard one; frozen sessions ignore further posts so a locked test cannot
 * be silently re-opened by the client.
 */
export function applyEvents(s: ProctorSession, events: ProctorEvent[], now: number): ProctorSession {
  if (isFrozen(s) || s.mode === "off") return s;
  const next = { ...s, events: [...s.events, ...events.slice(0, 200)].slice(-MAX_EVENTS) };
  const terminal = events.find((e) => e.terminal);
  if (terminal) {
    next.status = s.mode === "strict" ? "locked" : "cancelled";
    next.lockedReason = terminal.reason;
    next.endedAt = now;
  }
  return next;
}

export function endSession(s: ProctorSession, status: Extract<ProctorStatus, "submitted" | "cancelled">, now: number, reason?: string): ProctorSession {
  if (isFrozen(s)) return s;
  return { ...s, status, endedAt: now, lockedReason: reason ?? s.lockedReason };
}

export function requestUnlock(s: ProctorSession, note: string, now: number): ProctorSession | null {
  if (s.status !== "locked") return null;
  return { ...s, unlockRequest: { at: now, note: note.trim().slice(0, 1000) } };
}

/** A teacher unlock grants one fresh sit: the runner may start again on the same attempt id. */
export function unlockSession(s: ProctorSession, by: string, note: string, now: number): ProctorSession | null {
  if (s.status !== "locked") return null;
  return { ...s, status: "unlocked", unlock: { by, at: now, note: note.trim().slice(0, 1000) } };
}

/** An unlocked session re-arms as active on the next start; everything else is idempotent. */
export function resumeSession(s: ProctorSession, now: number): ProctorSession {
  if (s.status !== "unlocked") return s;
  return { ...s, status: "active", startedAt: now, endedAt: null, lockedReason: null, events: [], snapshots: [], unlockRequest: null };
}

export const EVENT_LABEL: Record<GuardEventType, string> = {
  hidden: "Switched away",
  blur: "Left the window",
  focus: "Returned",
  resize_split: "Split screen",
  screenshot: "Screenshot attempt",
  print: "Print attempt",
  contextmenu: "Right-click",
  copy: "Copy attempt",
  paste: "Paste attempt",
  cut: "Cut attempt",
  fullscreen_exit: "Left full screen",
  pip: "Picture-in-picture",
  devtools: "Developer tools",
  absence: "Face left the view",
  multiface: "Second person",
  headturn: "Looked away",
  material: "Device or notes in frame",
  camera_off: "Camera unavailable",
  camera_degraded: "Basic camera monitoring",
};

export function summariseEvents(events: ProctorEvent[]): { total: number; terminal: number; camera: number; byType: Partial<Record<GuardEventType, number>> } {
  const byType: Partial<Record<GuardEventType, number>> = {};
  for (const e of events) byType[e.type] = (byType[e.type] ?? 0) + 1;
  return { total: events.length, terminal: events.filter((e) => e.terminal).length, camera: events.filter((e) => e.source === "camera").length, byType };
}
