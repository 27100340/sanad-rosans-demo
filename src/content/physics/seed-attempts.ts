/**
 * The term's attempt history, built deterministically from the real bank.
 *
 * Every figure the analytics, the class view and the student progress page show
 * traces back to a question that actually exists: nothing here is a typed-in
 * percentage. A seeded PRNG plus the ability profiles in ./cohort produce the
 * same history on every boot, so the demo is stable but never hand-maintained.
 *
 * Marks are awarded the way the real marker would: a multiple-choice question
 * is right or wrong, a structured question earns whole marks point by point.
 */
import type { AttemptQuestion, PhysicsAttempt, PhysicsQuestion, ThinkingLevel } from "@/lib/domain/physics";
import { PAPER_CANON, expectedSeconds, pct } from "@/lib/domain/physics";
import { AUTHORED_BANK } from "./bank";
import { PASTPAPER_BANK } from "./pastpaper-bank";
import { ABILITY, PHYSICS_CLASS_ID, type AbilityProfile } from "./cohort";

/** Questions a seeded sitting may draw on: everything that does not need a missing figure. */
const POOL: PhysicsQuestion[] = [...AUTHORED_BANK, ...PASTPAPER_BANK].filter((q) => !q.needsFigure);

const DRILL_SIZE = 10;
const PAPER_SIZE = 14;
const FOCUS_WEIGHT = 4; // a focus topic is this many times likelier to be drawn
const DAY_MS = 86_400_000;
const TERM_DAYS = 70;

/** mulberry32: tiny, fast, and identical on every platform. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Midnight today, so a seeded history is stable within a day and still moves with the demo. */
function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function pickQuestions(random: () => number, profile: AbilityProfile, size: number, only?: (q: PhysicsQuestion) => boolean): PhysicsQuestion[] {
  const candidates = only ? POOL.filter(only) : POOL;
  if (!candidates.length) return [];
  const picked: PhysicsQuestion[] = [];
  const seen = new Set<string>();
  let guard = size * 40;
  while (picked.length < size && guard > 0) {
    guard -= 1;
    const q = candidates[Math.floor(random() * candidates.length)];
    if (seen.has(q.id)) continue;
    // Focus strands come up more often, because that is what was set as work.
    if (!profile.focus.includes(q.t) && random() > 1 / FOCUS_WEIGHT && picked.length < size / 2) continue;
    seen.add(q.id);
    picked.push(q);
  }
  return picked;
}

function abilityAt(profile: AbilityProfile, level: ThinkingLevel): number {
  return level === "HOT" ? profile.hot : profile.lot;
}

function markSeeded(random: () => number, q: PhysicsQuestion, profile: AbilityProfile): AttemptQuestion {
  const skill = abilityAt(profile, q.lvl);
  const base: Omit<AttemptQuestion, "earned" | "correct" | "response" | "feedback" | "points" | "method"> = {
    id: q.id,
    topic: q.t,
    level: q.lvl,
    paperType: q.paper,
    marks: q.marks,
    expectedSec: expectedSeconds(q),
  };

  if (q.type === "mcq") {
    const correct = random() < skill;
    const chosen = correct ? (q.ans ?? 0) : ((q.ans ?? 0) + 1 + Math.floor(random() * 3)) % (q.opts?.length || 4);
    return {
      ...base,
      earned: correct ? q.marks : 0,
      correct,
      response: String(chosen),
      feedback: correct ? "Correct." : q.scheme[0] ?? "Not the correct option.",
      points: [{ label: q.scheme[0] ?? "Correct option", earned: correct, evidence: correct ? q.opts?.[chosen] ?? "" : "" }],
      method: "auto",
    };
  }

  // Structured: each mark point is earned independently, which is how a real
  // script scores — partial credit clusters rather than all-or-nothing.
  const points = q.scheme.slice(0, q.marks).map((label) => ({ label, earned: random() < skill, evidence: "" }));
  while (points.length < q.marks) points.push({ label: `Mark point ${points.length + 1}`, earned: random() < skill, evidence: "" });
  const earned = points.filter((p) => p.earned).length;
  return {
    ...base,
    earned,
    correct: null,
    response: "(script submitted in class)",
    feedback: earned === q.marks ? "Full marks: every scheme point covered." : `${earned} of ${q.marks}. Missed: ${points.find((p) => !p.earned)?.label ?? "a scheme point"}.`,
    points,
    method: "teacher-approved",
  };
}

function buildSeedAttempt(profile: AbilityProfile, index: number, studentName: string): PhysicsAttempt {
  const random = rng(hash(`${profile.studentId}:${index}`));
  const asPaper = index % 3 === 2;
  const paperType = asPaper ? "P1" : index % 2 === 0 ? "P2" : "P4";
  const questions = asPaper
    ? pickQuestions(random, profile, PAPER_SIZE, (q) => q.paper === "P1")
    : pickQuestions(random, profile, DRILL_SIZE, (q) => q.paper === paperType);

  const marked = questions.map((q) => markSeeded(random, q, profile));
  const score = marked.reduce((sum, q) => sum + (q.earned ?? 0), 0);
  const total = marked.reduce((sum, q) => sum + q.marks, 0);
  const expected = marked.reduce((sum, q) => sum + q.expectedSec, 0);
  const daysAgo = Math.round((TERM_DAYS / Math.max(1, profile.attempts)) * (profile.attempts - index));

  return {
    id: `seed-at-${profile.studentId}-${index}`,
    studentId: profile.studentId,
    studentName,
    classId: PHYSICS_CLASS_ID,
    paperId: `seed-paper-${paperType}-${index}`,
    ts: startOfToday() - daysAgo * DAY_MS,
    mode: asPaper ? "paper" : "drill",
    paperType,
    code: asPaper ? `9702/1${(index % 3) + 1}` : undefined,
    ref: asPaper ? `${PAPER_CANON.P1.name} · practice ${index + 1}` : `${PAPER_CANON[paperType].short} drill ${index + 1}`,
    score,
    total,
    qCount: marked.length,
    scoredCount: marked.length,
    durationSec: Math.round(expected * (0.75 + random() * 0.5)),
    questions: marked,
    context: { kind: index === 0 ? "test" : index % 2 === 0 ? "assignment" : "practice", help: index % 2 !== 0, revealsUsed: index % 2 !== 0 ? Math.floor(random() * 3) : 0, allocationId: null },
  };
}

/** The whole cohort's history, oldest first, which is the order `analyse` expects. */
export function seedAttempts(nameFor: (studentId: string) => string): PhysicsAttempt[] {
  const out: PhysicsAttempt[] = [];
  for (const profile of ABILITY) {
    const name = nameFor(profile.studentId);
    for (let i = 0; i < profile.attempts; i += 1) out.push(buildSeedAttempt(profile, i, name));
  }
  return out.sort((a, b) => a.ts - b.ts);
}

/** Sanity figure used in the report and the class view footnote. */
export function seedSummary(attempts: PhysicsAttempt[]): { attempts: number; questions: number; marks: number; accuracy: number } {
  const questions = attempts.reduce((sum, a) => sum + a.qCount, 0);
  const marks = attempts.reduce((sum, a) => sum + a.total, 0);
  const earned = attempts.reduce((sum, a) => sum + a.score, 0);
  return { attempts: attempts.length, questions, marks, accuracy: pct(earned, marks) };
}
