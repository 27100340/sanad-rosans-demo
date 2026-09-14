/**
 * Proctor sessions and violation snapshots, in memory. One session per
 * attempt; stills are kept as data URLs (capped) and only ever shown to the
 * owning teacher. Production writes these to a private storage bucket.
 */
import type { ProctorEvent, ProctorSession } from "@/lib/domain/proctor";
import { applyEvents, endSession as endPure, MAX_SNAPSHOTS, newSession, requestUnlock as requestPure, resumeSession, unlockSession as unlockPure } from "@/lib/domain/proctor";
import { singleton } from "../store";

const MAX_SNAPSHOT_BYTES = 1_500_000;

export const SESSIONS: Map<string, ProctorSession> = singleton("proctorSessions", () => new Map());
export const SNAPSHOTS: Map<string, string> = singleton("proctorSnapshots", () => new Map());

export function getSession(attemptId: string): ProctorSession | undefined {
  return SESSIONS.get(attemptId);
}

export function startSession(input: Parameters<typeof newSession>[0], now: number): ProctorSession {
  const existing = SESSIONS.get(input.attemptId);
  if (existing) {
    const next = resumeSession({ ...existing, cameraConsent: input.cameraConsent }, now);
    SESSIONS.set(input.attemptId, next);
    return next;
  }
  const s = newSession(input, now);
  SESSIONS.set(s.attemptId, s);
  return s;
}

export function appendEvents(attemptId: string, events: ProctorEvent[], now: number): ProctorSession | undefined {
  const s = SESSIONS.get(attemptId);
  if (!s) return undefined;
  const next = applyEvents(s, events, now);
  SESSIONS.set(attemptId, next);
  return next;
}

export function saveSnapshot(attemptId: string, dataUrl: string, reason: string, now: number): string | null {
  const s = SESSIONS.get(attemptId);
  if (!s || !/^data:image\/(jpe?g|png|webp);base64,/i.test(dataUrl) || dataUrl.length > MAX_SNAPSHOT_BYTES) return null;
  const id = `${attemptId}-${now.toString(36)}`;
  SNAPSHOTS.set(id, dataUrl);
  const snapshots = [...s.snapshots, { id, at: now, reason }].slice(-MAX_SNAPSHOTS);
  SESSIONS.set(attemptId, { ...s, snapshots });
  return id;
}

export function endSession(attemptId: string, status: "submitted" | "cancelled", now: number, reason?: string): void {
  const s = SESSIONS.get(attemptId);
  if (s) SESSIONS.set(attemptId, endPure(s, status, now, reason));
}

export function requestUnlock(attemptId: string, note: string, now: number): boolean {
  const s = SESSIONS.get(attemptId);
  const next = s ? requestPure(s, note, now) : null;
  if (!next) return false;
  SESSIONS.set(attemptId, next);
  return true;
}

export function unlockSession(attemptId: string, by: string, note: string, now: number): boolean {
  const s = SESSIONS.get(attemptId);
  const next = s ? unlockPure(s, by, note, now) : null;
  if (!next) return false;
  SESSIONS.set(attemptId, next);
  return true;
}

export function sessionsForTests(testIds: string[]): ProctorSession[] {
  return [...SESSIONS.values()].filter((s) => testIds.includes(s.testId)).sort((a, b) => b.startedAt - a.startedAt);
}
