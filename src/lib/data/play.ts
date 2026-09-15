/**
 * Runtime state for Play & practise. Sessions live on `globalThis` like the
 * rest of the demo's mutable records; in production they move to Supabase.
 *
 * These are practice records, not marks. Nothing here feeds the early-warning
 * engine, a report card, or any leadership view — by design.
 */
import type { Persona } from "../auth/personas";
import { classById, guardianById, studentById } from "./mock/people";
import { singleton } from "./store";
import { activityById, activitiesForBand } from "@/content/play";
import { bandFor, roundSignature, starsFor, type PlayActivity, type PlayBand, type PlayRound, type PlaySession } from "../domain/play";
import type { Student } from "@/lib/domain/types";
import { daysAgoISO } from "../utils";

export interface PlayLearner {
  student: Student;
  className: string;
  band: PlayBand;
}

/** A guardian sees every ward in a play band; a student sees only themselves. */
export function playLearners(viewer: Persona): PlayLearner[] {
  const ids = viewer.role === "parent" ? (guardianById.get(viewer.guardianId ?? "")?.studentIds ?? []) : viewer.studentId ? [viewer.studentId] : [];
  const learners: PlayLearner[] = [];
  for (const id of ids) {
    const student = studentById.get(id);
    const schoolClass = student ? classById.get(student.classId) : undefined;
    if (!student || !schoolClass) continue;
    const band = bandFor(schoolClass);
    if (!band) continue;
    learners.push({ student, className: schoolClass.name, band });
  }
  return learners;
}

/**
 * No id means "this seat's own learner"; an explicit id must be one this seat
 * may actually see. Falling back to the first learner when a named child does
 * not match would silently record one child's practice against another.
 */
export function learnerById(viewer: Persona, studentId: string | undefined): PlayLearner | undefined {
  const learners = playLearners(viewer);
  if (!studentId) return learners[0];
  return learners.find((l) => l.student.id === studentId);
}

function seed(): PlaySession[] {
  const rows: [studentId: string, activityId: string, daysAgo: number, correct: number, total: number, withAdult: boolean][] = [
    ["s-primary-3", "lp-make-ten", 4, 3, 4, false],
    ["s-primary-3", "lp-short-surahs", 2, 4, 4, false],
    ["s-primary-3", "lp-count-in-steps", 1, 5, 5, false],
    ["s-primary-3", "lp-urdu-words", 1, 2, 4, false],
    ["s-early", "early-how-many", 3, 3, 4, true],
    ["s-early", "early-kind-words", 1, 4, 4, true],
  ];
  return rows.map(([studentId, activityId, daysAgo, correct, total, withAdult], i) => ({
    id: `play-seed-${i + 1}`,
    studentId,
    activityId,
    at: `${daysAgoISO(daysAgo)}T16:${String(10 + i * 7).padStart(2, "0")}:00.000Z`,
    correct,
    total,
    live: false,
    withAdult,
    seen: [],
  }));
}

export const PLAY_SESSIONS = singleton<PlaySession[]>("play-sessions-v1", seed);

export function sessionsFor(studentId: string): PlaySession[] {
  return PLAY_SESSIONS.filter((s) => s.studentId === studentId).sort((a, b) => b.at.localeCompare(a.at));
}

export function sessionsForActivity(studentId: string, activityId: string): PlaySession[] {
  return sessionsFor(studentId).filter((s) => s.activityId === activityId);
}

export interface PlaySummary {
  plays: number;
  stars: number;
  strandsTouched: number;
  lastPlayed: string | null;
  /** Consecutive days with at least one session, counting back from the latest. */
  dayStreak: number;
}

function previousDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Days played in a row, ending today or yesterday. A gap of two days resets it. */
function streakOf(daysNewestFirst: string[]): number {
  const latest = daysNewestFirst[0];
  if (!latest || (latest !== daysAgoISO(0) && latest !== daysAgoISO(1))) return 0;
  let streak = 1;
  for (let i = 1; i < daysNewestFirst.length; i += 1) {
    if (daysNewestFirst[i] !== previousDay(daysNewestFirst[i - 1])) break;
    streak += 1;
  }
  return streak;
}

export function playSummary(studentId: string): PlaySummary {
  const sessions = sessionsFor(studentId);
  const days = Array.from(new Set(sessions.map((s) => s.at.slice(0, 10)))).sort((a, b) => b.localeCompare(a));
  const dayStreak = streakOf(days);
  const strands = new Set(sessions.map((s) => activityById.get(s.activityId)?.strand).filter(Boolean));
  return {
    plays: sessions.length,
    stars: sessions.reduce((total, s) => total + starsFor(s.correct, s.total), 0),
    strandsTouched: strands.size,
    lastPlayed: sessions[0]?.at ?? null,
    dayStreak,
  };
}

/** Activities for this learner's band, most-neglected first, so the shelf keeps moving. */
export function activityQueue(learner: PlayLearner): { activity: PlayActivity; plays: number }[] {
  return activitiesForBand(learner.band)
    .map((activity) => ({ activity, plays: sessionsForActivity(learner.student.id, activity.id).length }))
    .sort((a, b) => a.plays - b.plays);
}

/**
 * The deterministic round for this child's next turn. Rotates through the pool
 * so a second play never repeats the first, and wraps once the pool is spent.
 */
export function seededRound(activity: PlayActivity, playCount: number): PlayRound | null {
  if (activity.rounds.length === 0) return null;
  return activity.rounds[playCount % activity.rounds.length];
}

/** Item labels this child has met recently in this activity; handed to the model to avoid. */
export function recentlySeen(studentId: string, activityId: string, limit = 3): string[] {
  const fromSessions = sessionsForActivity(studentId, activityId)
    .slice(0, limit)
    .flatMap((s) => s.seen);
  const activity = activityById.get(activityId);
  const fromPool = activity ? activity.rounds.slice(0, limit).flatMap(roundSignature) : [];
  return Array.from(new Set([...fromSessions, ...fromPool])).slice(0, 24);
}

export function recordPlay(input: { studentId: string; activityId: string; correct: number; total: number; live: boolean; withAdult: boolean; seen: string[] }): PlaySession {
  const session: PlaySession = {
    id: crypto.randomUUID(),
    studentId: input.studentId,
    activityId: input.activityId,
    at: new Date().toISOString(),
    correct: Math.max(0, Math.min(input.total, Math.round(input.correct))),
    total: Math.max(1, Math.round(input.total)),
    live: input.live,
    withAdult: input.withAdult,
    seen: input.seen.slice(0, 12),
  };
  PLAY_SESSIONS.push(session);
  return session;
}
