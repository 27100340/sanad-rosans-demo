/**
 * Assessments: question bank, tests, allocations and attempts. Pure types and
 * pure scoring only; no IO. Mirrors general-spec/11. The correct answer never
 * reaches the student's client until the attempt is submitted (see `forStudent`).
 */
import type { MarkPoint } from "./types";
import type { GuardMode } from "./proctor";

export type QuestionType = "mcq" | "numeric" | "short" | "structured";
export type Difficulty = "core" | "extended";
export type TestMode = "quiz" | "timed" | "mock" | "past-paper";
export type AllocationStatus = "not-started" | "in-progress" | "submitted" | "published";
export type MarkingStatus = "auto" | "ai-marked" | "teacher-approved";

export interface Question {
  id: string;
  subjectId: string; // catalogue id, e.g. "ls-maths"
  topicCode: string; // syllabus code inside the space, e.g. "8Ae"
  type: QuestionType;
  stem: string;
  options?: string[]; // mcq only, in display order
  /** Server-only. mcq: option index as string; numeric: the value; short/structured: model answer. */
  answer: string;
  markScheme: string[]; // one line per mark point (short/structured); mcq/numeric use one line
  marks: number;
  difficulty: Difficulty;
  source: "authored" | "past-paper" | "ai-assembled";
  paperRef?: string; // e.g. "4024/12 June 2023 Q7"
}

/** What the runner may see before submission. */
export type StudentQuestion = Omit<Question, "answer" | "markScheme">;

export interface Test {
  id: string;
  spaceId: string;
  title: string;
  mode: TestMode;
  questionIds: string[];
  durationMin?: number; // undefined = untimed
  opensAt: string; // ISO date
  closesAt: string; // ISO date
  attemptsAllowed: number;
  proctored: boolean; // strict mode with the on-device camera proctor
  guardMode?: GuardMode; // off (quiz) | standard (timed) | strict (mock exam, proctored)
  instructions?: string;
  paperCode?: string; // mode "past-paper": the allocated Cambridge paper
  paperKey?: string;
  createdBy: string; // teacher id
}

export interface Allocation {
  testId: string;
  studentId: string;
  status: AllocationStatus;
  attemptId?: string;
}

export interface AnswerRecord {
  questionId: string;
  response: string; // mcq: option index; numeric/short/structured: free text
  savedAt: string; // ISO datetime
}

export interface QuestionMarking {
  questionId: string;
  awarded: number;
  points: MarkPoint[];
  feedback: string;
  status: MarkingStatus;
  overridden?: boolean; // teacher changed the awarded mark
}

export interface Attempt {
  id: string;
  testId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  answers: AnswerRecord[];
  marking: QuestionMarking[];
  total?: number;
  maxMarks: number;
  guardEvents: number; // tab switches / paste attempts counted by the exam guard
  late?: boolean; // submitted after duration + grace, decided by the server clock
}

export const LATE_GRACE_SECONDS = 300;

/** True when a timed attempt is sealed after its duration plus the grace period. */
export function isLate(attempt: Pick<Attempt, "startedAt">, durationMin: number | undefined, submittedAt: Date): boolean {
  if (!durationMin) return false;
  return submittedAt.getTime() - new Date(attempt.startedAt).getTime() > (durationMin * 60 + LATE_GRACE_SECONDS) * 1000;
}

export interface TopicMastery {
  studentId: string;
  topicCode: string;
  score: number; // 0..100 rolling
  lastAssessedAt: string;
}

/* ---------------- pure helpers ---------------- */

export function forStudent(q: Question): StudentQuestion {
  const { id, subjectId, topicCode, type, stem, options, marks, difficulty, source, paperRef } = q;
  return { id, subjectId, topicCode, type, stem, options, marks, difficulty, source, paperRef };
}

export function maxMarksOf(questions: Question[]): number {
  return questions.reduce((a, q) => a + q.marks, 0);
}

const NUMERIC_TOLERANCE = 0.01;

/** Parses "3.5", "-2", "7/2", "x = 5" and "x=5" to a number; null when it is not a number. */
export function parseNumeric(text: string): number | null {
  const cleaned = text.replace(/^[a-z]\s*=\s*/i, "").replace(/,/g, "").trim();
  const frac = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  const n = Number(cleaned);
  return cleaned !== "" && Number.isFinite(n) ? n : null;
}

/** Deterministic marking for mcq and numeric; returns null for types that need the marker. */
export function autoMark(q: Question, response: string): QuestionMarking | null {
  if (q.type === "mcq") {
    const earned = response.trim() === q.answer.trim();
    const chosen = q.options?.[Number(response)] ?? "no option chosen";
    return {
      questionId: q.id,
      awarded: earned ? q.marks : 0,
      points: [{ label: q.markScheme[0] ?? "Correct option", earned, evidence: chosen }],
      feedback: earned ? "Correct." : `Not this one. Look again at ${q.topicCode}; the tutor can walk you through it.`,
      status: "auto",
    };
  }
  if (q.type === "numeric") {
    const got = parseNumeric(response);
    const want = parseNumeric(q.answer);
    const earned = got !== null && want !== null && Math.abs(got - want) <= NUMERIC_TOLERANCE;
    return {
      questionId: q.id,
      awarded: earned ? q.marks : 0,
      points: [{ label: q.markScheme[0] ?? "Correct value", earned, evidence: response.trim() || "no answer" }],
      feedback: earned ? "Correct." : got === null ? "Write your final answer as a number." : "The value is not right. Check each balancing step.",
      status: "auto",
    };
  }
  return null;
}

export function totalOf(marking: QuestionMarking[]): number {
  return marking.reduce((a, m) => a + m.awarded, 0);
}

/** Rolling topic score: 70% previous, 30% latest, so one bad test does not erase a term. */
export function rollMastery(previous: number | undefined, latestPct: number): number {
  if (previous === undefined) return Math.round(latestPct);
  return Math.round(previous * 0.7 + latestPct * 0.3);
}

export function pctOf(awarded: number, max: number): number {
  return max > 0 ? Math.round((awarded / max) * 100) : 0;
}

/** Seconds left in a timed attempt at `now`; null for untimed. */
export function secondsLeft(attempt: Pick<Attempt, "startedAt">, durationMin: number | undefined, now: Date): number | null {
  if (!durationMin) return null;
  const end = new Date(attempt.startedAt).getTime() + durationMin * 60_000;
  return Math.max(0, Math.floor((end - now.getTime()) / 1000));
}

/** Facility index of one question across submitted attempts: mean fraction of its marks earned (0..1). */
export function facility(q: Pick<Question, "id" | "marks">, attempts: Attempt[]): number | null {
  const awarded = attempts.flatMap((a) => a.marking.filter((m) => m.questionId === q.id).map((m) => m.awarded));
  if (!awarded.length || q.marks === 0) return null;
  return awarded.reduce((s, n) => s + n, 0) / awarded.length / q.marks;
}

/* ---------------- past-paper practice ---------------- */

export type PaperAnswerStatus = "auto" | "ai-marked" | "unanswered";

export interface PaperAnswer {
  questionId: string;
  response: string; // typed answer or the OCR transcript of a photographed one
  imageId?: string; // photographed script, when one was uploaded
  transcribed?: boolean; // response came from OCR
  awarded: number;
  points: MarkPoint[];
  feedback: string;
  status: PaperAnswerStatus;
  secondsUsed: number;
  answeredAt: string;
}

export interface PaperAttempt {
  id: string;
  studentId: string;
  code: string;
  paperKey: string;
  pace: "paper" | "untimed"; // "paper" = per-question clock at the exam's own pace
  startedAt: string;
  finishedAt?: string;
  answers: PaperAnswer[];
  maxMarks: number;
}

export function paperTotal(attempt: Pick<PaperAttempt, "answers">): number {
  return attempt.answers.reduce((a, x) => a + x.awarded, 0);
}
